import { HandlerInput, ErrorHandler as ErrorHandlerType } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';

export const ErrorHandler: ErrorHandlerType = {
  canHandle(): boolean {
    return true;
  },
  handle(handlerInput: HandlerInput, error: Error): Response {
    console.error('Unhandled skill error:', error.message, error.stack);

    return handlerInput.responseBuilder
      .speak('Sorry, I had trouble processing your request. Please try again.')
      .reprompt('Please try again.')
      .getResponse();
  },
};
