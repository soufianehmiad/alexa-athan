import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { PrayerEngineService } from '../services/PrayerEngineService';
import { SessionAttributes, CITY_COORDINATES } from '../models/types';

const prayerEngine = new PrayerEngineService();

export const LaunchHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput: HandlerInput): Response {
    const sessionAttributes =
      (handlerInput.attributesManager.getSessionAttributes() as SessionAttributes) || {};
    const city = sessionAttributes.city || 'mecca';
    const coords = CITY_COORDINATES[city.toLowerCase()];

    let speechText =
      'Welcome to Athan. I can tell you prayer times, play the athan, or set your city.';

    if (coords) {
      const nextPrayer = prayerEngine.getNextPrayer(coords, new Date(), city);
      if (nextPrayer) {
        const timeStr = prayerEngine.formatTimeForSpeech(nextPrayer.time, coords.timezone);
        speechText += ` The next prayer is ${nextPrayer.displayName} at ${timeStr}, in ${nextPrayer.timeUntil}.`;
      }
    }

    const reprompt = 'You can say: what are today\'s prayer times, play the athan, or set my city.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(reprompt)
      .getResponse();
  },
};
