import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response, IntentRequest } from 'ask-sdk-model';
import { SessionAttributes, CITY_COORDINATES } from '../models/types';

export const SetCityHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      (handlerInput.requestEnvelope.request as IntentRequest).intent.name === 'SetCityIntent'
    );
  },
  handle(handlerInput: HandlerInput): Response {
    const request = handlerInput.requestEnvelope.request as IntentRequest;
    const citySlot = request.intent.slots?.CityName;
    const cityValue = citySlot?.value;

    if (!cityValue) {
      return handlerInput.responseBuilder
        .speak('I didn\'t catch the city name. Please say: set my city to, followed by a city name.')
        .reprompt('Which city would you like to set?')
        .getResponse();
    }

    const normalizedCity = cityValue.toLowerCase();
    const coords = CITY_COORDINATES[normalizedCity];

    if (!coords) {
      return handlerInput.responseBuilder
        .speak(
          `I don't have coordinates for ${cityValue} yet. Try a major city like New York, London, Cairo, or Mecca.`
        )
        .reprompt('Which city would you like to set?')
        .getResponse();
    }

    const sessionAttributes: SessionAttributes = {
      city: normalizedCity,
      latitude: coords.latitude,
      longitude: coords.longitude,
      timezone: coords.timezone,
    };
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(`City set to ${cityValue}. You can now ask for prayer times or play the athan.`)
      .reprompt('What would you like to do?')
      .getResponse();
  },
};
