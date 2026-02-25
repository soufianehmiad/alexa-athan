import { handler } from "../functions/api/getDevices";
import type { APIGatewayProxyEvent, Context, Callback, APIGatewayProxyResult } from "aws-lambda";
import * as alexaReminders from "../lib/alexaReminders";

jest.mock("../lib/alexaReminders");
const mockedGetAlexaDevices = jest.mocked(alexaReminders.getAlexaDevices);

describe("getDevices handler", () => {
  const mockContext = {} as Context;
  const mockCallback = (() => {}) as Callback;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeEvent(authHeader?: string): APIGatewayProxyEvent {
    const headers: Record<string, string> = {};
    if (authHeader !== undefined) {
      headers["Authorization"] = authHeader;
    }
    return { headers } as APIGatewayProxyEvent;
  }

  it("should return 401 when Authorization header is missing", async () => {
    const result = (await handler(makeEvent(), mockContext, mockCallback)) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(401);
  });

  it("should return 401 when Authorization header lacks Bearer prefix", async () => {
    const result = (await handler(
      makeEvent("token-without-bearer"),
      mockContext,
      mockCallback
    )) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(401);
  });

  it("should return 401 when Bearer token is empty", async () => {
    const result = (await handler(
      makeEvent("Bearer "),
      mockContext,
      mockCallback
    )) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(401);
  });

  it("should return 200 with devices on success", async () => {
    mockedGetAlexaDevices.mockResolvedValue({
      devices: [
        { deviceId: "echo-1", friendlyName: "Living Room Echo" },
        { deviceId: "echo-2", friendlyName: "Bedroom Echo" },
      ],
    });

    const result = (await handler(
      makeEvent("Bearer valid-token"),
      mockContext,
      mockCallback
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.devices).toHaveLength(2);
    expect(body.devices[0].friendlyName).toBe("Living Room Echo");
  });

  it("should return 401 when Alexa API returns auth error", async () => {
    mockedGetAlexaDevices.mockRejectedValue(new Error("Failed to get Alexa devices (401): Unauthorized"));

    const result = (await handler(
      makeEvent("Bearer expired-token"),
      mockContext,
      mockCallback
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 on unexpected error", async () => {
    mockedGetAlexaDevices.mockRejectedValue(new Error("Network timeout"));

    const result = (await handler(
      makeEvent("Bearer valid-token"),
      mockContext,
      mockCallback
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(500);
  });
});
