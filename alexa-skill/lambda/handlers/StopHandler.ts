import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response, IntentRequest } from 'ask-sdk-model';

export const StopHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      ((handlerInput.requestEnvelope.request as IntentRequest).intent.name === 'AMAZON.StopIntent' ||
        (handlerInput.requestEnvelope.request as IntentRequest).intent.name === 'AMAZON.CancelIntent')
    );
  },
  handle(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder
      .speak('Goodbye. Assalamu Alaikum.')
      .addAudioPlayerStopDirective()
      .withShouldEndSession(true)
      .getResponse();
  },
};
