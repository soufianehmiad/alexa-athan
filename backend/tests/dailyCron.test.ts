import * as deviceStore from "../lib/deviceStore";
import * as alexaReminders from "../lib/alexaReminders";
import * as encryption from "../lib/encryption";
import * as prayerEngine from "../lib/prayerEngine";
import type { ScheduledEvent, Context, Callback } from "aws-lambda";

jest.mock("../lib/deviceStore");
jest.mock("../lib/alexaReminders");
jest.mock("../lib/encryption");

const mockedScanAllDevices = jest.mocked(deviceStore.scanAllDevices);
const mockedPutDevice = jest.mocked(deviceStore.putDevice);
const mockedRefreshLwaToken = jest.mocked(alexaReminders.refreshLwaToken);
const mockedGetAllReminders = jest.mocked(alexaReminders.getAllReminders);
const mockedDeleteReminder = jest.mocked(alexaReminders.deleteReminder);
const mockedCreateReminder = jest.mocked(alexaReminders.createReminder);
const mockedDecrypt = jest.mocked(encryption.decrypt);
const mockedEncrypt = jest.mocked(encryption.encrypt);

// Import handler after mocks
let handler: typeof import("../functions/scheduler/dailyCron").handler;

beforeAll(async () => {
  process.env.ENCRYPTION_KEY = "test-key";
  process.env.LWA_CLIENT_ID = "test-client-id";
  process.env.LWA_CLIENT_SECRET = "test-client-secret";
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
    lwaTokenEncrypted: "encrypted-access",
    lwaRefreshTokenEncrypted: "encrypted-refresh",
    updatedAt: "2026-02-24T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedDecrypt.mockReturnValue("decrypted-refresh-token");
    mockedEncrypt.mockReturnValue("new-encrypted-token");

    mockedRefreshLwaToken.mockResolvedValue({
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
    });

    mockedPutDevice.mockResolvedValue(mockDevice);
    mockedGetAllReminders.mockResolvedValue({ totalCount: 0, alerts: [] });
    mockedDeleteReminder.mockResolvedValue();
    mockedCreateReminder.mockResolvedValue({
      alertToken: "alert-123",
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
      status: "ON",
      href: "/v1/alerts/reminders/alert-123",
    });
  });

  it("should process no devices without error", async () => {
    mockedScanAllDevices.mockResolvedValue([]);
    await handler(mockEvent, mockContext, mockCallback);
    expect(mockedScanAllDevices).toHaveBeenCalledTimes(1);
    expect(mockedRefreshLwaToken).not.toHaveBeenCalled();
  });

  it("should refresh tokens and schedule reminders for a device", async () => {
    mockedScanAllDevices.mockResolvedValue([mockDevice]);

    await handler(mockEvent, mockContext, mockCallback);

    expect(mockedDecrypt).toHaveBeenCalledWith("encrypted-refresh", "test-key");
    expect(mockedRefreshLwaToken).toHaveBeenCalledWith(
      "decrypted-refresh-token",
      "test-client-id",
      "test-client-secret"
    );
    expect(mockedPutDevice).toHaveBeenCalled();
    expect(mockedGetAllReminders).toHaveBeenCalledWith("new-access-token");
    // Should attempt to create reminders for enabled prayers
    expect(mockedCreateReminder).toHaveBeenCalled();
  });

  it("should delete existing reminders before creating new ones", async () => {
    mockedScanAllDevices.mockResolvedValue([mockDevice]);
    mockedGetAllReminders.mockResolvedValue({
      totalCount: 2,
      alerts: [
        { alertToken: "old-1", status: "ON" },
        { alertToken: "old-2", status: "ON" },
      ],
    });

    await handler(mockEvent, mockContext, mockCallback);

    expect(mockedDeleteReminder).toHaveBeenCalledTimes(2);
    expect(mockedDeleteReminder).toHaveBeenCalledWith("new-access-token", "old-1");
    expect(mockedDeleteReminder).toHaveBeenCalledWith("new-access-token", "old-2");
  });

  it("should continue processing other devices if one fails", async () => {
    const device2 = { ...mockDevice, pk: "DEVICE#token-2", deviceToken: "token-2" };
    mockedScanAllDevices.mockResolvedValue([mockDevice, device2]);

    // First device token refresh fails
    mockedDecrypt
      .mockReturnValueOnce("bad-token")
      .mockReturnValueOnce("good-token");

    mockedRefreshLwaToken
      .mockRejectedValueOnce(new Error("Token expired"))
      .mockResolvedValueOnce({
        access_token: "token-2-access",
        refresh_token: "token-2-refresh",
        token_type: "bearer",
        expires_in: 3600,
      });

    await handler(mockEvent, mockContext, mockCallback);

    // Should still try the second device
    expect(mockedRefreshLwaToken).toHaveBeenCalledTimes(2);
  });

  it("should only schedule enabled prayers", async () => {
    const device = {
      ...mockDevice,
      enabledPrayers: ["fajr", "isha"], // Only 2 prayers enabled
    };
    mockedScanAllDevices.mockResolvedValue([device]);

    await handler(mockEvent, mockContext, mockCallback);

    // At most 2 createReminder calls (may be fewer if times already passed)
    expect(mockedCreateReminder.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
