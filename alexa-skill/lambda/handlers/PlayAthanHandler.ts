import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response, IntentRequest, interfaces } from 'ask-sdk-model';
import { AudioService } from '../services/AudioService';

const audioService = new AudioService();

export const PlayAthanHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      (handlerInput.requestEnvelope.request as IntentRequest).intent.name === 'PlayAthanIntent'
    );
  },
  handle(handlerInput: HandlerInput): Response {
    const audio = audioService.getAthanAudio();

    return handlerInput.responseBuilder
      .speak('Playing the athan.')
      .addAudioPlayerPlayDirective(
        'REPLACE_ALL',
        audio.url,
        audio.token,
        audio.offsetInMilliseconds,
        undefined,
        undefined
      )
      .withShouldEndSession(true)
      .getResponse();
  },
};
