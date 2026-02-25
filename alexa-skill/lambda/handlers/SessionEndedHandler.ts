import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';

export const SessionEndedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput: HandlerInput): Response {
    const request = handlerInput.requestEnvelope.request as any;
    if (request.error) {
      console.error('Session ended with error:', JSON.stringify(request.error));
    }
    return handlerInput.responseBuilder.getResponse();
  },
};
