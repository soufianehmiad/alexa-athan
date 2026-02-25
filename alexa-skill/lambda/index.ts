import { SkillBuilders } from 'ask-sdk-core';
import { MessageReceivedHandler } from './handlers/MessageReceivedHandler';
import { LaunchHandler } from './handlers/LaunchHandler';
import { PlayAthanHandler } from './handlers/PlayAthanHandler';
import { PrayerTimesHandler } from './handlers/PrayerTimesHandler';
import { SetCityHandler } from './handlers/SetCityHandler';
import {
  PlaybackStartedHandler,
  PlaybackFinishedHandler,
  PlaybackStoppedHandler,
  PlaybackNearlyFinishedHandler,
  PlaybackFailedHandler,
} from './handlers/AudioPlayerHandlers';
import { HelpHandler } from './handlers/HelpHandler';
import { StopHandler } from './handlers/StopHandler';
import { SessionEndedHandler } from './handlers/SessionEndedHandler';
import { ErrorHandler } from './handlers/ErrorHandler';

const skill = SkillBuilders.custom()
  .addRequestHandlers(
    MessageReceivedHandler,
    LaunchHandler,
    PlayAthanHandler,
    PrayerTimesHandler,
    SetCityHandler,
    HelpHandler,
    StopHandler,
    PlaybackStartedHandler,
    PlaybackFinishedHandler,
    PlaybackStoppedHandler,
    PlaybackNearlyFinishedHandler,
    PlaybackFailedHandler,
    SessionEndedHandler
  )
  .addErrorHandlers(ErrorHandler)
  .create();

export const handler = async (event: any, context: any) => {
  return skill.invoke(event, context);
};
