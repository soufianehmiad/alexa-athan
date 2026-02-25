import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import {
  createReminder,
  deleteAllReminders,
  buildReminderRequest,
} from '../services/ReminderService';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const MessageReceivedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'Messaging.MessageReceived';
  },

  async handle(handlerInput: HandlerInput): Promise<Response> {
    const request = handlerInput.requestEnvelope.request as any;
    const message = request.message;

    console.log('[MessageReceived] Received message:', JSON.stringify(message));

    if (!message || message.operation !== 'SCHEDULE_REMINDERS') {
      console.log('[MessageReceived] Unknown operation:', message?.operation);
      return handlerInput.responseBuilder.getResponse();
    }

    const apiAccessToken =
      handlerInput.requestEnvelope.context.System.apiAccessToken;
    const apiEndpoint =
      handlerInput.requestEnvelope.context.System.apiEndpoint ||
      'https://api.amazonalexa.com';

    if (!apiAccessToken) {
      console.error('[MessageReceived] No apiAccessToken in request');
      return handlerInput.responseBuilder.getResponse();
    }

    // Delete existing reminders first
    try {
      const deleted = await deleteAllReminders(apiAccessToken, apiEndpoint);
      console.log(`[MessageReceived] Deleted ${deleted} existing reminders`);
    } catch (err: any) {
      console.warn('[MessageReceived] Failed to clean up existing reminders:', err.message);
    }

    // Create new reminders for each prayer time that hasn't passed
    const { prayerTimes, timezone } = message;
    const now = new Date();
    let created = 0;
    let errors = 0;

    for (const [prayer, timeStr] of Object.entries(prayerTimes) as Array<[string, string]>) {
      const prayerTime = new Date(timeStr);

      if (prayerTime <= now) {
        console.log(`[MessageReceived] Skipping ${prayer}: already passed`);
        continue;
      }

      const reminder = buildReminderRequest(prayer, timeStr, timezone);

      try {
        await createReminder(apiAccessToken, apiEndpoint, reminder);
        console.log(`[MessageReceived] Created reminder for ${prayer}`);
        created++;

        // Small delay between API calls to avoid rate limiting
        await sleep(200);
      } catch (err: any) {
        console.error(`[MessageReceived] Failed to create reminder for ${prayer}:`, err.message);
        errors++;

        if (err.message.includes('429')) {
          console.warn('[MessageReceived] Rate limit hit, waiting 2 seconds...');
          await sleep(2000);
        }
      }
    }

    console.log(`[MessageReceived] Complete: ${created} created, ${errors} errors`);

    return handlerInput.responseBuilder.getResponse();
  },
};
