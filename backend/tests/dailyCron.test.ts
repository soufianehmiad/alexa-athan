import * as deviceStore from "../lib/deviceStore";
import * as skillMessaging from "../lib/skillMessaging";
import type { ScheduledEvent, Context, Callback } from "aws-lambda";

jest.mock("../lib/deviceStore");
jest.mock("../lib/skillMessaging");

const mockedScanAllDevices = jest.mocked(deviceStore.scanAllDevices);
const mockedGetSkillMessagingToken = jest.mocked(skillMessaging.getSkillMessagingToken);
const mockedSendSkillMessage = jest.mocked(skillMessaging.sendSkillMessage);

let handler: typeof import("../functions/scheduler/dailyCron").handler;

beforeAll(async () => {
  process.env.SKILL_CLIENT_ID = "test-skill-client-id";
  process.env.SKILL_CLIENT_SECRET = "test-skill-client-secret";
  const mod = await import("../functions/scheduler/dailyCron");
  handler = mod.handler;
});

describe("dailyCron handler", () => {
  const mockEvent = { source: "aws.events" } as ScheduledEvent;
  const mockContext = {} as Context;
  const mockCallback = (() => {}) as Callback;

  const mockDevice: deviceStore.DeviceConfig = {
    pk: "DEVICE#token-1",
    deviceToken: "token-1",
    city: "New York",
    lat: 40.7128,
    lon: -74.006,
    method: "NORTH_AMERICA",
    madhab: "SHAFI",
    offsets: {},
    enabledPrayers: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
    alexaDeviceIds: ["echo-1"],
    alexaUserId: "amzn1.ask.account.TEST_USER_1",
    lwaTokenEncrypted: "encrypted-access",
    lwaRefreshTokenEncrypted: "encrypted-refresh",
    updatedAt: "2026-02-24T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedGetSkillMessagingToken.mockResolvedValue("messaging-token-123");
    mockedSendSkillMessage.mockResolvedValue();
  });

  it("should process no devices without error", async () => {
    mockedScanAllDevices.mockResolvedValue([]);
    await handler(mockEvent, mockContext, mockCallback);
    expect(mockedScanAllDevices).toHaveBeenCalledTimes(1);
    expect(mockedGetSkillMessagingToken).toHaveBeenCalledTimes(1);
    expect(mockedSendSkillMessage).not.toHaveBeenCalled();
  });

  it("should get skill messaging token and send prayer times for a device", async () => {
    mockedScanAllDevices.mockResolvedValue([mockDevice]);

    await handler(mockEvent, mockContext, mockCallback);

    expect(mockedGetSkillMessagingToken).toHaveBeenCalledWith(
      "test-skill-client-id",
      "test-skill-client-secret"
    );
    expect(mockedSendSkillMessage).toHaveBeenCalledTimes(1);
    expect(mockedSendSkillMessage).toHaveBeenCalledWith(
      "messaging-token-123",
      "amzn1.ask.account.TEST_USER_1",
      expect.objectContaining({
        timezone: expect.any(String),
        date: expect.any(String),
        prayerTimes: expect.any(Object),
      })
    );
  });

  it("should skip devices without alexaUserId", async () => {
    const deviceWithoutUserId = { ...mockDevice, alexaUserId: undefined };
    mockedScanAllDevices.mockResolvedValue([deviceWithoutUserId]);

    await handler(mockEvent, mockContext, mockCallback);

    expect(mockedSendSkillMessage).not.toHaveBeenCalled();
  });

  it("should continue processing other devices if one fails", async () => {
    const device2 = {
      ...mockDevice,
      pk: "DEVICE#token-2",
      deviceToken: "token-2",
      alexaUserId: "amzn1.ask.account.TEST_USER_2",
    };
    mockedScanAllDevices.mockResolvedValue([mockDevice, device2]);

    mockedSendSkillMessage
      .mockRejectedValueOnce(new Error("Messaging failed"))
      .mockResolvedValueOnce();

    await handler(mockEvent, mockContext, mockCallback);

    expect(mockedSendSkillMessage).toHaveBeenCalledTimes(2);
  });

  it("should only include enabled prayers in the payload", async () => {
    const device = {
      ...mockDevice,
      enabledPrayers: ["fajr", "isha"],
    };
    mockedScanAllDevices.mockResolvedValue([device]);

    await handler(mockEvent, mockContext, mockCallback);

    expect(mockedSendSkillMessage).toHaveBeenCalledTimes(1);
    const payload = mockedSendSkillMessage.mock.calls[0][2];
    const prayerNames = Object.keys(payload.prayerTimes);
    // Should only contain enabled prayers (fajr and isha)
    for (const name of prayerNames) {
      expect(["fajr", "isha"]).toContain(name);
    }
  });

  it("should abort if skill messaging token fetch fails", async () => {
    mockedGetSkillMessagingToken.mockRejectedValue(new Error("Token fetch failed"));
    mockedScanAllDevices.mockResolvedValue([mockDevice]);

    await handler(mockEvent, mockContext, mockCallback);

    expect(mockedSendSkillMessage).not.toHaveBeenCalled();
  });
});
