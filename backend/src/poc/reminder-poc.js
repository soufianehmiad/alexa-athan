/**
 * Proof-of-Concept: Alexa Reminders via Skill Messaging API
 *
 * This POC demonstrates the two-hop pattern for creating Alexa Reminders
 * from a backend Lambda (out-of-session) using the Skill Messaging API.
 *
 * Architecture:
 *   1. Backend Lambda gets a Skill Messaging access token (skill credentials)
 *   2. Backend Lambda sends prayer times to the Skill via Skill Messaging API
 *   3. Skill Lambda receives Messaging.MessageReceived with valid apiAccessToken
 *   4. Skill Lambda creates reminders using that apiAccessToken
 *
 * This file contains TWO components:
 *   Part A: Backend cron logic (sends the Skill Message)
 *   Part B: Skill handler logic (receives message, creates reminders)
 *
 * Usage:
 *   - Set environment variables (see below)
 *   - Part A can be run standalone: node reminder-poc.js
 *   - Part B is meant to be integrated into the Alexa skill Lambda
 */

const https = require("node:https");

// ============================================================================
// CONFIGURATION — Set these environment variables before running
// ============================================================================

const CONFIG = {
  // Skill-level credentials (from Alexa Developer Console > Build > Permissions)
  SKILL_CLIENT_ID: process.env.SKILL_CLIENT_ID || "",
  SKILL_CLIENT_SECRET: process.env.SKILL_CLIENT_SECRET || "",

  // The Alexa user ID captured from a prior in-session interaction
  // Format: amzn1.ask.account.XXXXX...
  ALEXA_USER_ID: process.env.ALEXA_USER_ID || "",

  // LWA token endpoint
  LWA_TOKEN_URL: "https://api.amazon.com/auth/o2/token",

  // Skill Messaging endpoint
  SKILL_MESSAGING_BASE: "https://api.amazonalexa.com",
};

// ============================================================================
// PART A: Backend Cron — Send prayer times via Skill Messaging API
// ============================================================================

/**
 * Get an LWA access token for the Skill Messaging API.
 * Uses skill-level credentials (clientId + clientSecret), NOT user tokens.
 *
 * @returns {Promise<string>} Access token for Skill Messaging scope
 */
async function getSkillMessagingToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CONFIG.SKILL_CLIENT_ID,
    client_secret: CONFIG.SKILL_CLIENT_SECRET,
    scope: "alexa:skill_messaging",
  }).toString();

  const response = await httpsRequest(CONFIG.LWA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body).toString(),
    },
  }, body);

  if (response.statusCode !== 200) {
    throw new Error(
      `Failed to get Skill Messaging token (${response.statusCode}): ${response.body}`
    );
  }

  const result = JSON.parse(response.body);
  console.log("[POC] Got Skill Messaging access token (expires in", result.expires_in, "seconds)");
  return result.access_token;
}

/**
 * Send a message to the Alexa Skill via the Skill Messaging API.
 * The skill will receive this as a Messaging.MessageReceived request.
 *
 * @param {string} accessToken - Skill Messaging access token
 * @param {string} userId - Alexa user ID (amzn1.ask.account.XXXX)
 * @param {object} prayerData - Prayer times and scheduling instructions
 * @returns {Promise<void>}
 */
async function sendSkillMessage(accessToken, userId, prayerData) {
  const body = JSON.stringify({
    data: {
      operation: "SCHEDULE_REMINDERS",
      prayerTimes: prayerData.prayerTimes,
      timezone: prayerData.timezone,
      date: prayerData.date,
      // Idempotency key to prevent duplicate reminder creation
      requestId: `cron-${prayerData.date}-${Date.now()}`,
    },
    // Message expires after 1 hour — if not delivered by then,
    // the prayer times for today may be stale
    expiresAfterSeconds: 3600,
  });

  const response = await httpsRequest(
    `${CONFIG.SKILL_MESSAGING_BASE}/v1/skillmessages/users/${userId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body).toString(),
      },
    },
    body
  );

  // 202 Accepted = message queued for delivery (not delivered yet)
  if (response.statusCode === 202) {
    console.log("[POC] Skill Message accepted for delivery");
    return;
  }

  // 403 = user has not enabled the skill or granted permissions
  if (response.statusCode === 403) {
    throw new Error(
      `User has not enabled the skill or granted messaging permissions. ` +
      `Response: ${response.body}`
    );
  }

  throw new Error(
    `Skill Messaging failed (${response.statusCode}): ${response.body}`
  );
}

/**
 * Main cron handler — computes prayer times and sends via Skill Messaging.
 * This replaces the current dailyCron.ts direct Reminders API approach.
 */
async function cronHandler() {
  console.log("[POC] === PART A: Backend Cron ===");
  console.log("[POC] Getting Skill Messaging access token...");

  const messagingToken = await getSkillMessagingToken();

  // Example prayer times (in production, computed by PrayerEngine)
  const prayerData = {
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    timezone: "America/Chicago",
    prayerTimes: {
      fajr: "2026-02-25T05:47:00",
      dhuhr: "2026-02-25T12:15:00",
      asr: "2026-02-25T15:30:00",
      maghrib: "2026-02-25T17:52:00",
      isha: "2026-02-25T19:15:00",
    },
  };

  console.log("[POC] Sending prayer times via Skill Messaging API...");
  console.log("[POC] User ID:", CONFIG.ALEXA_USER_ID.substring(0, 30) + "...");
  console.log("[POC] Prayer times:", JSON.stringify(prayerData.prayerTimes, null, 2));

  await sendSkillMessage(messagingToken, CONFIG.ALEXA_USER_ID, prayerData);

  console.log("[POC] Message sent. The Skill Lambda will receive it as");
  console.log("[POC] Messaging.MessageReceived and create reminders.");
  console.log("[POC] === PART A Complete ===");
}

// ============================================================================
// PART B: Skill Handler — Receives Skill Message, creates reminders
// ============================================================================

/**
 * ASK SDK v2 handler for Messaging.MessageReceived requests.
 * This would be added to the Alexa skill's handler chain.
 *
 * When the Skill Messaging API delivers a message, Alexa invokes the
 * skill Lambda with a Messaging.MessageReceived request that includes
 * a valid apiAccessToken in context.System.apiAccessToken.
 */
const MessageReceivedHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "Messaging.MessageReceived";
  },

  async handle(handlerInput) {
    const message = handlerInput.requestEnvelope.request.message;
    console.log("[POC] Received Skill Message:", JSON.stringify(message));

    if (message.operation !== "SCHEDULE_REMINDERS") {
      console.log("[POC] Unknown operation:", message.operation);
      return { statusCode: 200 };
    }

    // Extract the apiAccessToken — this is the key piece that makes
    // reminder creation possible from outside a user session
    const apiAccessToken =
      handlerInput.requestEnvelope.context.System.apiAccessToken;
    const apiEndpoint =
      handlerInput.requestEnvelope.context.System.apiEndpoint ||
      "https://api.amazonalexa.com";

    if (!apiAccessToken) {
      console.error("[POC] No apiAccessToken in Messaging.MessageReceived!");
      return { statusCode: 200 };
    }

    console.log("[POC] Got apiAccessToken from Messaging.MessageReceived");
    console.log("[POC] API endpoint:", apiEndpoint);

    // Idempotency check: prevent duplicate reminder creation
    // In production, check DynamoDB for the requestId
    const requestId = message.requestId;
    console.log("[POC] Request ID (for idempotency):", requestId);

    // Delete existing reminders first
    try {
      const existingReminders = await getReminders(apiAccessToken, apiEndpoint);
      console.log("[POC] Found", existingReminders.totalCount, "existing reminders");

      for (const alert of existingReminders.alerts || []) {
        await deleteReminder(apiAccessToken, apiEndpoint, alert.alertToken);
        console.log("[POC] Deleted reminder:", alert.alertToken);
      }
    } catch (err) {
      console.warn("[POC] Failed to clean up existing reminders:", err.message);
    }

    // Create new reminders for each prayer time
    const { prayerTimes, timezone } = message;
    const now = new Date();
    let created = 0;
    let errors = 0;

    for (const [prayer, timeStr] of Object.entries(prayerTimes)) {
      const prayerTime = new Date(timeStr);

      // Skip prayer times that have already passed
      if (prayerTime <= now) {
        console.log(`[POC] Skipping ${prayer}: already passed`);
        continue;
      }

      const displayName = prayer.charAt(0).toUpperCase() + prayer.slice(1);
      const reminder = {
        requestTime: new Date().toISOString(),
        trigger: {
          type: "SCHEDULED_ABSOLUTE",
          scheduledTime: timeStr,
          timeZoneId: timezone,
        },
        alertInfo: {
          spokenInfo: {
            content: [
              {
                locale: "en-US",
                text: `It is time for ${displayName} prayer.`,
              },
            ],
          },
        },
        pushNotification: {
          status: "ENABLED",
        },
      };

      try {
        const result = await createReminder(apiAccessToken, apiEndpoint, reminder);
        console.log(`[POC] Created reminder for ${prayer}: alertToken=${result.alertToken}`);
        created++;

        // Small delay between API calls to avoid rate limiting
        await sleep(200);
      } catch (err) {
        console.error(`[POC] Failed to create reminder for ${prayer}:`, err.message);
        errors++;

        // Back off on rate limit
        if (err.message.includes("429")) {
          console.warn("[POC] Rate limit hit, waiting 2 seconds...");
          await sleep(2000);
        }
      }
    }

    console.log(`[POC] Reminder creation complete: ${created} created, ${errors} errors`);

    // Messaging.MessageReceived requires a prompt acknowledgment response
    return { statusCode: 200 };
  },
};

// ============================================================================
// PART B Helper: Reminders API calls using apiAccessToken
// ============================================================================

async function createReminder(apiAccessToken, apiEndpoint, reminder) {
  const body = JSON.stringify(reminder);

  const response = await httpsRequest(
    `${apiEndpoint}/v1/alerts/reminders`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiAccessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body).toString(),
      },
    },
    body
  );

  if (response.statusCode === 401) {
    throw new Error(`INVALID_BEARER_TOKEN: apiAccessToken may not have reminder permission`);
  }

  if (response.statusCode === 429) {
    throw new Error(`429 Rate limit exceeded`);
  }

  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new Error(`Create reminder failed (${response.statusCode}): ${response.body}`);
  }

  return JSON.parse(response.body);
}

async function getReminders(apiAccessToken, apiEndpoint) {
  const response = await httpsRequest(
    `${apiEndpoint}/v1/alerts/reminders`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiAccessToken}`,
      },
    }
  );

  if (response.statusCode !== 200) {
    throw new Error(`Get reminders failed (${response.statusCode}): ${response.body}`);
  }

  return JSON.parse(response.body);
}

async function deleteReminder(apiAccessToken, apiEndpoint, alertToken) {
  const response = await httpsRequest(
    `${apiEndpoint}/v1/alerts/reminders/${alertToken}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiAccessToken}`,
      },
    }
  );

  if (response.statusCode !== 200 && response.statusCode !== 204) {
    throw new Error(`Delete reminder failed (${response.statusCode}): ${response.body}`);
  }
}

// ============================================================================
// Shared HTTP helper
// ============================================================================

function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 500,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error("Request timed out"));
    });
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Run Part A if executed directly
// ============================================================================

if (require.main === module) {
  // Validate config
  if (!CONFIG.SKILL_CLIENT_ID || !CONFIG.SKILL_CLIENT_SECRET || !CONFIG.ALEXA_USER_ID) {
    console.error("Missing required environment variables:");
    console.error("  SKILL_CLIENT_ID     - Skill client ID from Alexa Developer Console");
    console.error("  SKILL_CLIENT_SECRET - Skill client secret from Alexa Developer Console");
    console.error("  ALEXA_USER_ID       - User ID captured from prior skill interaction");
    console.error("");
    console.error("Set these and run again:");
    console.error("  SKILL_CLIENT_ID=xxx SKILL_CLIENT_SECRET=yyy ALEXA_USER_ID=zzz node reminder-poc.js");
    process.exit(1);
  }

  cronHandler()
    .then(() => {
      console.log("\n[POC] Success! Check your Alexa skill's CloudWatch logs");
      console.log("[POC] to verify that Messaging.MessageReceived was received");
      console.log("[POC] and reminders were created.");
    })
    .catch((err) => {
      console.error("\n[POC] FAILED:", err.message);
      console.error("[POC] Full error:", err);
      process.exit(1);
    });
}

// Export for use in other modules
module.exports = {
  getSkillMessagingToken,
  sendSkillMessage,
  MessageReceivedHandler,
  cronHandler,
};
