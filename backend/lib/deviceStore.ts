import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { CalculationMethodName, MadhabName } from "./prayerEngine.js";

export interface DeviceConfig {
  pk: string;
  deviceToken: string;
  city: string;
  lat: number;
  lon: number;
  method: CalculationMethodName;
  madhab: MadhabName;
  offsets: Record<string, number>;
  enabledPrayers: string[];
  alexaDeviceIds: string[];
  lwaTokenEncrypted: string;
  lwaRefreshTokenEncrypted: string;
  updatedAt: string;
  ttl?: number;
}

const TABLE_NAME = process.env.DYNAMODB_TABLE || "athan-backend-dev";

let docClient: DynamoDBDocumentClient;

export function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    const client = new DynamoDBClient({});
    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return docClient;
}

export function setDocClient(client: DynamoDBDocumentClient): void {
  docClient = client;
}

function devicePk(deviceToken: string): string {
  return `DEVICE#${deviceToken}`;
}

export async function getDevice(deviceToken: string): Promise<DeviceConfig | null> {
  const result = await getDocClient().send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: devicePk(deviceToken) },
    })
  );
  return (result.Item as DeviceConfig) ?? null;
}

export async function putDevice(config: Omit<DeviceConfig, "pk">): Promise<DeviceConfig> {
  const item: DeviceConfig = {
    ...config,
    pk: devicePk(config.deviceToken),
    updatedAt: new Date().toISOString(),
  };

  await getDocClient().send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return item;
}

export async function deleteDevice(deviceToken: string): Promise<void> {
  await getDocClient().send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: devicePk(deviceToken) },
    })
  );
}

export async function scanAllDevices(): Promise<DeviceConfig[]> {
  const items: DeviceConfig[] = [];
  let lastKey: Record<string, any> | undefined;

  do {
    const result = await getDocClient().send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastKey,
      })
    );
    if (result.Items) {
      items.push(...(result.Items as DeviceConfig[]));
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}
