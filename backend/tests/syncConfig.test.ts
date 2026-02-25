import { handler } from "../functions/api/syncConfig";
import type { APIGatewayProxyEvent, Context, Callback, APIGatewayProxyResult } from "aws-lambda";
import * as deviceStore from "../lib/deviceStore";

jest.mock("../lib/deviceStore");
const mockedPutDevice = jest.mocked(deviceStore.putDevice);

describe("syncConfig handler", () => {
  const mockContext = {} as Context;
  const mockCallback = (() => {}) as Callback;

  const validBody = {
    city: "New York",
    lat: 40.7128,
    lon: -74.006,
    method: "NORTH_AMERICA",
    madhab: "SHAFI",
    enabledPrayers: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
    alexaDeviceIds: ["device-1"],
    lwaAccessToken: "Atza|access-token",
    lwaRefreshToken: "Atzr|refresh-token",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENCRYPTION_KEY = "test-key-for-unit-tests";
    mockedPutDevice.mockResolvedValue({
      pk: "DEVICE#test-token",
      deviceToken: "test-token",
      city: "New York",
      lat: 40.7128,
      lon: -74.006,
      method: "NORTH_AMERICA",
      madhab: "SHAFI",
      offsets: {},
      enabledPrayers: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
      alexaDeviceIds: ["device-1"],
      lwaTokenEncrypted: "encrypted",
      lwaRefreshTokenEncrypted: "encrypted",
      updatedAt: "2026-02-24T00:00:00.000Z",
    });
  });

  function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
    return {
      headers: { "X-Device-Token": "test-token", ...overrides.headers },
      body: JSON.stringify(validBody),
      ...overrides,
    } as APIGatewayProxyEvent;
  }

  it("should return 200 on valid input", async () => {
    const result = (await handler(makeEvent(), mockContext, mockCallback)) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.message).toBe("Configuration saved");
    expect(body.deviceToken).toBe("test-token");
  });

  it("should return 400 when X-Device-Token header is missing", async () => {
    const result = (await handler(
      makeEvent({ headers: {} }),
      mockContext,
      mockCallback
    )) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain("X-Device-Token");
  });

  it("should return 400 on invalid JSON body", async () => {
    const result = (await handler(
      makeEvent({ body: "not-json" }),
      mockContext,
      mockCallback
    )) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain("Invalid JSON");
  });

  it("should return 400 on validation errors", async () => {
    const result = (await handler(
      makeEvent({ body: JSON.stringify({ city: "" }) }),
      mockContext,
      mockCallback
    )) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Validation failed");
  });

  it("should return 500 when ENCRYPTION_KEY is missing", async () => {
    process.env.ENCRYPTION_KEY = "";
    const result = (await handler(makeEvent(), mockContext, mockCallback)) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(500);
  });

  it("should call putDevice with encrypted tokens", async () => {
    await handler(makeEvent(), mockContext, mockCallback);
    expect(mockedPutDevice).toHaveBeenCalledTimes(1);

    const call = mockedPutDevice.mock.calls[0][0];
    expect(call.deviceToken).toBe("test-token");
    expect(call.lwaTokenEncrypted).toBeDefined();
    expect(call.lwaTokenEncrypted).not.toBe("Atza|access-token");
    expect(call.lwaRefreshTokenEncrypted).toBeDefined();
    expect(call.lwaRefreshTokenEncrypted).not.toBe("Atzr|refresh-token");
  });
});
