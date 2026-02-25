import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';

export const PlaybackStartedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackStarted';
  },
  handle(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder.getResponse();
  },
};

export const PlaybackFinishedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackFinished';
  },
  handle(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder.getResponse();
  },
};

export const PlaybackStoppedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackStopped';
  },
  handle(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder.getResponse();
  },
};

export const PlaybackNearlyFinishedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackNearlyFinished';
  },
  handle(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder.getResponse();
  },
};

export const PlaybackFailedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackFailed';
  },
  handle(handlerInput: HandlerInput): Response {
    console.error('AudioPlayer playback failed:', JSON.stringify(handlerInput.requestEnvelope.request));
    return handlerInput.responseBuilder.getResponse();
  },
};
