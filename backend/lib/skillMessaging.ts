import https from "node:https";

const LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token";
const SKILL_MESSAGING_BASE = "https://api.amazonalexa.com";

export interface SkillMessagePayload {
  prayerTimes: Record<string, string>;
  timezone: string;
  date: string;
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

export async function getSkillMessagingToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "alexa:skill_messaging",
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
      `Failed to get Skill Messaging token (${response.statusCode}): ${response.body}`
    );
  }

  const result = JSON.parse(response.body);
  return result.access_token as string;
}

export async function sendSkillMessage(
  accessToken: string,
  userId: string,
  data: SkillMessagePayload
): Promise<void> {
  const body = JSON.stringify({
    data: {
      operation: "SCHEDULE_REMINDERS",
      prayerTimes: data.prayerTimes,
      timezone: data.timezone,
      date: data.date,
      requestId: `cron-${data.date}-${Date.now()}`,
    },
    expiresAfterSeconds: 3600,
  });

  const response = await httpsRequest(
    `${SKILL_MESSAGING_BASE}/v1/skillmessages/users/${userId}`,
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

  if (response.statusCode === 202) {
    return;
  }

  if (response.statusCode === 403) {
    throw new Error(
      `User has not enabled the skill or granted messaging permissions. Response: ${response.body}`
    );
  }

  throw new Error(
    `Skill Messaging failed (${response.statusCode}): ${response.body}`
  );
}
