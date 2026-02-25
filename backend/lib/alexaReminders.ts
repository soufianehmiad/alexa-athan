import https from "node:https";

const ALEXA_API_BASE = "https://api.amazonalexa.com";
const LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token";

export interface ReminderRequest {
  requestTime: string;
  trigger: {
    type: "SCHEDULED_ABSOLUTE";
    scheduledTime: string;
    timeZoneId: string;
  };
  alertInfo: {
    spokenInfo: {
      content: Array<{
        locale: string;
        text: string;
        ssml?: string;
      }>;
    };
  };
  pushNotification: {
    status: "ENABLED" | "DISABLED";
  };
}

export interface ReminderResponse {
  alertToken: string;
  createdTime: string;
  updatedTime: string;
  status: string;
  href: string;
}

export interface TokenRefreshResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

function httpsRequest(
  url: string,
  options: https.RequestOptions,
  body?: string
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode ?? 500,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    req.on("error", reject);
    req.setTimeout(10_000, () => {
      req.destroy(new Error("Request timed out"));
    });
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

export async function refreshLwaToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenRefreshResult> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  const response = await httpsRequest(LWA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body).toString(),
    },
  }, body);

  if (response.statusCode !== 200) {
    throw new Error(
      `LWA token refresh failed (${response.statusCode}): ${response.body}`
    );
  }

  return JSON.parse(response.body) as TokenRefreshResult;
}

export async function createReminder(
  accessToken: string,
  reminder: ReminderRequest
): Promise<ReminderResponse> {
  const body = JSON.stringify(reminder);

  const response = await httpsRequest(
    `${ALEXA_API_BASE}/v1/alerts/reminders`,
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

  if (response.statusCode === 429) {
    throw new Error("Alexa Reminders API rate limit exceeded");
  }

  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new Error(
      `Failed to create reminder (${response.statusCode}): ${response.body}`
    );
  }

  return JSON.parse(response.body) as ReminderResponse;
}

export async function deleteReminder(
  accessToken: string,
  alertToken: string
): Promise<void> {
  const response = await httpsRequest(
    `${ALEXA_API_BASE}/v1/alerts/reminders/${alertToken}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.statusCode !== 200 && response.statusCode !== 204) {
    throw new Error(
      `Failed to delete reminder (${response.statusCode}): ${response.body}`
    );
  }
}

export async function getAllReminders(
  accessToken: string
): Promise<{ totalCount: number; alerts: Array<{ alertToken: string; status: string }> }> {
  const response = await httpsRequest(
    `${ALEXA_API_BASE}/v1/alerts/reminders`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.statusCode !== 200) {
    throw new Error(
      `Failed to get reminders (${response.statusCode}): ${response.body}`
    );
  }

  return JSON.parse(response.body);
}

export async function getAlexaDevices(
  accessToken: string
): Promise<{ devices: Array<{ deviceId: string; friendlyName: string }> }> {
  const response = await httpsRequest(
    `${ALEXA_API_BASE}/v2/devices`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.statusCode !== 200) {
    throw new Error(
      `Failed to get Alexa devices (${response.statusCode}): ${response.body}`
    );
  }

  return JSON.parse(response.body);
}

export function buildReminderRequest(
  prayerName: string,
  scheduledTime: string,
  timeZoneId: string
): ReminderRequest {
  const displayName = prayerName.charAt(0).toUpperCase() + prayerName.slice(1);

  return {
    requestTime: new Date().toISOString(),
    trigger: {
      type: "SCHEDULED_ABSOLUTE",
      scheduledTime,
      timeZoneId,
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
}
