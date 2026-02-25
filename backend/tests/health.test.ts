import { handler } from "../functions/api/health";
import type { APIGatewayProxyEvent, Context, Callback } from "aws-lambda";

describe("health handler", () => {
  const mockEvent = {} as APIGatewayProxyEvent;
  const mockContext = {} as Context;
  const mockCallback = (() => {}) as Callback;

  it("should return 200 with status ok", async () => {
    const result = await handler(mockEvent, mockContext, mockCallback);

    expect(result).toBeDefined();
    const response = result as { statusCode: number; body: string; headers: Record<string, string> };
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("athan-backend");
    expect(body.timestamp).toBeDefined();
  });

  it("should include CORS header", async () => {
    const result = await handler(mockEvent, mockContext, mockCallback);
    const response = result as { headers: Record<string, string> };
    expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
  });
});
