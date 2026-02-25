import https from "node:https";
import { EventEmitter } from "node:events";
import { getSkillMessagingToken, sendSkillMessage } from "../lib/skillMessaging";

jest.mock("node:https");

const mockedHttps = jest.mocked(https);

function mockHttpsResponse(statusCode: number, body: string) {
  const req = new EventEmitter() as any;
  req.write = jest.fn();
  req.end = jest.fn();
  req.setTimeout = jest.fn();

  mockedHttps.request.mockImplementationOnce((_url, _options, callback: any) => {
    const res = new EventEmitter() as any;
    res.statusCode = statusCode;

    process.nextTick(() => {
      callback(res);
      res.emit("data", Buffer.from(body));
      res.emit("end");
    });

    return req;
  });
}

describe("skillMessaging", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSkillMessagingToken", () => {
    it("should return access token on success", async () => {
      mockHttpsResponse(200, JSON.stringify({
        access_token: "messaging-token-123",
        expires_in: 3600,
        scope: "alexa:skill_messaging",
        token_type: "bearer",
      }));

      const token = await getSkillMessagingToken("client-id", "client-secret");

      expect(token).toBe("messaging-token-123");
      expect(mockedHttps.request).toHaveBeenCalledTimes(1);

      const [url, options] = mockedHttps.request.mock.calls[0] as any[];
      expect(url).toBe("https://api.amazon.com/auth/o2/token");
      expect(options.method).toBe("POST");
    });

    it("should send correct body parameters", async () => {
      mockHttpsResponse(200, JSON.stringify({
        access_token: "token",
        expires_in: 3600,
      }));

      await getSkillMessagingToken("my-client-id", "my-client-secret");

      const req = mockedHttps.request.mock.results[0].value;
      const writtenBody = req.write.mock.calls[0][0];

      expect(writtenBody).toContain("grant_type=client_credentials");
      expect(writtenBody).toContain("client_id=my-client-id");
      expect(writtenBody).toContain("client_secret=my-client-secret");
      expect(writtenBody).toContain("scope=alexa%3Askill_messaging");
    });

    it("should throw on non-200 response", async () => {
      mockHttpsResponse(401, JSON.stringify({ error: "invalid_client" }));

      await expect(
        getSkillMessagingToken("bad-id", "bad-secret")
      ).rejects.toThrow("Failed to get Skill Messaging token (401)");
    });
  });

  describe("sendSkillMessage", () => {
    const prayerData = {
      prayerTimes: {
        fajr: "2026-02-25T05:47:00",
        dhuhr: "2026-02-25T12:15:00",
      },
      timezone: "Etc/GMT+5",
      date: "2026-02-25",
    };

    it("should succeed on 202 response", async () => {
      mockHttpsResponse(202, "");

      await expect(
        sendSkillMessage("token-123", "amzn1.ask.account.USER", prayerData)
      ).resolves.toBeUndefined();

      const [url, options] = mockedHttps.request.mock.calls[0] as any[];
      expect(url).toBe(
        "https://api.amazonalexa.com/v1/skillmessages/users/amzn1.ask.account.USER"
      );
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer token-123");
    });

    it("should include correct payload structure", async () => {
      mockHttpsResponse(202, "");

      await sendSkillMessage("token", "user-id", prayerData);

      const req = mockedHttps.request.mock.results[0].value;
      const writtenBody = JSON.parse(req.write.mock.calls[0][0]);

      expect(writtenBody.data.operation).toBe("SCHEDULE_REMINDERS");
      expect(writtenBody.data.prayerTimes).toEqual(prayerData.prayerTimes);
      expect(writtenBody.data.timezone).toBe("Etc/GMT+5");
      expect(writtenBody.data.date).toBe("2026-02-25");
      expect(writtenBody.data.requestId).toMatch(/^cron-2026-02-25-/);
      expect(writtenBody.expiresAfterSeconds).toBe(3600);
    });

    it("should throw on 403 with permission error message", async () => {
      mockHttpsResponse(403, JSON.stringify({ message: "Access denied" }));

      await expect(
        sendSkillMessage("token", "user-id", prayerData)
      ).rejects.toThrow("User has not enabled the skill or granted messaging permissions");
    });

    it("should throw on unexpected status code", async () => {
      mockHttpsResponse(500, "Internal Server Error");

      await expect(
        sendSkillMessage("token", "user-id", prayerData)
      ).rejects.toThrow("Skill Messaging failed (500)");
    });
  });
});
