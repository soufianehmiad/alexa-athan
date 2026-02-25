import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response, IntentRequest } from 'ask-sdk-model';
import { PrayerEngineService } from '../services/PrayerEngineService';
import { SessionAttributes, CITY_COORDINATES } from '../models/types';

const prayerEngine = new PrayerEngineService();

export const PrayerTimesHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      (handlerInput.requestEnvelope.request as IntentRequest).intent.name === 'GetPrayerTimesIntent'
    );
  },
  handle(handlerInput: HandlerInput): Response {
    const sessionAttributes =
      (handlerInput.attributesManager.getSessionAttributes() as SessionAttributes) || {};
    const city = sessionAttributes.city || 'mecca';
    const coords = CITY_COORDINATES[city.toLowerCase()];

    if (!coords) {
      return handlerInput.responseBuilder
        .speak(
          `I don't have coordinates for ${city}. Please try setting a different city by saying: set my city to, followed by the city name.`
        )
        .reprompt('Which city would you like prayer times for?')
        .getResponse();
    }

    const result = prayerEngine.getPrayerTimes(coords, new Date(), city);

    const prayerLines = result.prayers.map(
      (p) => `${p.displayName} at ${prayerEngine.formatTimeForSpeech(p.time, coords.timezone)}`
    );

    const speechText = `Today's prayer times for ${city} are: ${prayerLines.join(', ')}.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse();
  },
};
