import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response, IntentRequest } from 'ask-sdk-model';

export const HelpHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      (handlerInput.requestEnvelope.request as IntentRequest).intent.name === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput: HandlerInput): Response {
    const speechText =
      'You can say: what are today\'s prayer times, play the athan, or set my city to a city name. What would you like to do?';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};
