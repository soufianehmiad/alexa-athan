import https from 'node:https';

export interface ReminderRequest {
  requestTime: string;
  trigger: {
    type: 'SCHEDULED_ABSOLUTE';
    scheduledTime: string;
    timeZoneId: string;
  };
  alertInfo: {
    spokenInfo: {
      content: Array<{
        locale: string;
        text: string;
      }>;
    };
  };
  pushNotification: {
    status: 'ENABLED' | 'DISABLED';
  };
}

export interface ReminderResponse {
  alertToken: string;
  createdTime: string;
  updatedTime: string;
  status: string;
}

export interface GetRemindersResponse {
  totalCount: number;
  alerts: Array<{ alertToken: string; status: string }>;
}

function httpsRequest(
  url: string,
  options: https.RequestOptions,
  body?: string
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode ?? 500,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(10_000, () => {
      req.destroy(new Error('Request timed out'));
    });
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

export async function createReminder(
  apiAccessToken: string,
  apiEndpoint: string,
  reminder: ReminderRequest
): Promise<ReminderResponse> {
  const body = JSON.stringify(reminder);

  const response = await httpsRequest(
    `${apiEndpoint}/v1/alerts/reminders`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiAccessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
      },
    },
    body
  );

  if (response.statusCode === 401) {
    throw new Error('INVALID_BEARER_TOKEN: apiAccessToken may not have reminder permission');
  }

  if (response.statusCode === 429) {
    throw new Error('429 Rate limit exceeded');
  }

  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new Error(
      `Create reminder failed (${response.statusCode}): ${response.body}`
    );
  }

  return JSON.parse(response.body) as ReminderResponse;
}

export async function getAllReminders(
  apiAccessToken: string,
  apiEndpoint: string
): Promise<GetRemindersResponse> {
  const response = await httpsRequest(
    `${apiEndpoint}/v1/alerts/reminders`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiAccessToken}`,
      },
    }
  );

  if (response.statusCode !== 200) {
    throw new Error(
      `Get reminders failed (${response.statusCode}): ${response.body}`
    );
  }

  return JSON.parse(response.body) as GetRemindersResponse;
}

export async function deleteReminder(
  apiAccessToken: string,
  apiEndpoint: string,
  alertToken: string
): Promise<void> {
  const response = await httpsRequest(
    `${apiEndpoint}/v1/alerts/reminders/${alertToken}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiAccessToken}`,
      },
    }
  );

  if (response.statusCode !== 200 && response.statusCode !== 204) {
    throw new Error(
      `Delete reminder failed (${response.statusCode}): ${response.body}`
    );
  }
}

export async function deleteAllReminders(
  apiAccessToken: string,
  apiEndpoint: string
): Promise<number> {
  const existing = await getAllReminders(apiAccessToken, apiEndpoint);
  let deleted = 0;

  for (const alert of existing.alerts || []) {
    await deleteReminder(apiAccessToken, apiEndpoint, alert.alertToken);
    deleted++;
  }

  return deleted;
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
      type: 'SCHEDULED_ABSOLUTE',
      scheduledTime,
      timeZoneId,
    },
    alertInfo: {
      spokenInfo: {
        content: [
          {
            locale: 'en-US',
            text: `It is time for ${displayName} prayer.`,
          },
        ],
      },
    },
    pushNotification: {
      status: 'ENABLED',
    },
  };
}
