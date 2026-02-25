import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { getAlexaDevices } from "../../lib/alexaReminders.js";

function jsonResponse(statusCode: number, body: Record<string, unknown>): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authHeader = event.headers["Authorization"] || event.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse(401, { error: "Authorization header with Bearer token is required" });
    }

    const accessToken = authHeader.slice(7).trim();

    if (accessToken.length === 0) {
      return jsonResponse(401, { error: "Access token is empty" });
    }

    const result = await getAlexaDevices(accessToken);

    return jsonResponse(200, {
      devices: result.devices ?? [],
    });
  } catch (err) {
    console.error("getDevices error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("401") || message.includes("403")) {
      return jsonResponse(401, { error: "Invalid or expired access token" });
    }

    return jsonResponse(500, { error: "Internal server error" });
  }
};
