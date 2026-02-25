import { SkillBuilders } from 'ask-sdk-core';
import { ResponseEnvelope } from 'ask-sdk-model';
import {
  createIntentRequestEnvelope,
  createLaunchRequestEnvelope,
  createSessionEndedRequestEnvelope,
  createAudioPlayerRequestEnvelope,
} from './helpers';

import { LaunchHandler } from '../lambda/handlers/LaunchHandler';
import { PlayAthanHandler } from '../lambda/handlers/PlayAthanHandler';
import { PrayerTimesHandler } from '../lambda/handlers/PrayerTimesHandler';
import { SetCityHandler } from '../lambda/handlers/SetCityHandler';
import {
  PlaybackStartedHandler,
  PlaybackFinishedHandler,
  PlaybackStoppedHandler,
  PlaybackNearlyFinishedHandler,
  PlaybackFailedHandler,
} from '../lambda/handlers/AudioPlayerHandlers';
import { HelpHandler } from '../lambda/handlers/HelpHandler';
import { StopHandler } from '../lambda/handlers/StopHandler';
import { SessionEndedHandler } from '../lambda/handlers/SessionEndedHandler';
import { ErrorHandler } from '../lambda/handlers/ErrorHandler';

function createSkill() {
  return SkillBuilders.custom()
    .addRequestHandlers(
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
}

function speechText(response: ResponseEnvelope): string {
  const output = response.response?.outputSpeech;
  if (!output) return '';
  if (output.type === 'SSML') {
    return (output as any).ssml?.replace(/<[^>]+>/g, '') || '';
  }
  return (output as any).text || '';
}

describe('LaunchHandler', () => {
  it('returns a welcome message with next prayer info', async () => {
    const skill = createSkill();
    const envelope = createLaunchRequestEnvelope();

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain('Welcome to Athan');
    expect(response.response?.shouldEndSession).toBe(false);
  });

  it('uses city from session attributes if set', async () => {
    const skill = createSkill();
    const envelope = createLaunchRequestEnvelope({ city: 'cairo' });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain('Welcome to Athan');
  });
});

describe('PrayerTimesHandler', () => {
  it('returns prayer times for default city (mecca)', async () => {
    const skill = createSkill();
    const envelope = createIntentRequestEnvelope({
      intentName: 'GetPrayerTimesIntent',
    });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain('prayer times for mecca');
    expect(text).toContain('Fajr');
    expect(text).toContain('Dhuhr');
    expect(text).toContain('Asr');
    expect(text).toContain('Maghrib');
    expect(text).toContain('Isha');
    expect(response.response?.shouldEndSession).toBe(true);
  });

  it('returns prayer times for a set city', async () => {
    const skill = createSkill();
    const envelope = createIntentRequestEnvelope({
      intentName: 'GetPrayerTimesIntent',
      sessionAttributes: { city: 'new york' },
    });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain('prayer times for new york');
    expect(text).toContain('Fajr');
  });

  it('handles unknown city gracefully', async () => {
    const skill = createSkill();
    const envelope = createIntentRequestEnvelope({
      intentName: 'GetPrayerTimesIntent',
      sessionAttributes: { city: 'unknown_place_xyz' },
    });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain("don't have coordinates");
  });
});

describe('PlayAthanHandler', () => {
  it('returns AudioPlayer.Play directive', async () => {
    const skill = createSkill();
    const envelope = createIntentRequestEnvelope({
      intentName: 'PlayAthanIntent',
    });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain('Playing the athan');

    const directives = response.response?.directives || [];
    expect(directives.length).toBeGreaterThan(0);

    const playDirective = directives.find((d: any) => d.type === 'AudioPlayer.Play');
    expect(playDirective).toBeDefined();
    expect((playDirective as any).playBehavior).toBe('REPLACE_ALL');
    expect((playDirective as any).audioItem?.stream?.url).toBeTruthy();
    expect((playDirective as any).audioItem?.stream?.token).toMatch(/^athan-/);
  });
});

describe('SetCityHandler', () => {
  it('sets city and confirms', async () => {
    const skill = createSkill();
    const envelope = createIntentRequestEnvelope({
      intentName: 'SetCityIntent',
      slots: { CityName: 'Cairo' },
    });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain('City set to Cairo');
    expect(response.sessionAttributes?.city).toBe('cairo');
  });

  it('rejects unknown city', async () => {
    const skill = createSkill();
    const envelope = createIntentRequestEnvelope({
      intentName: 'SetCityIntent',
      slots: { CityName: 'Atlantis' },
    });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain("don't have coordinates");
  });

  it('handles missing city slot', async () => {
    const skill = createSkill();
    const envelope = createIntentRequestEnvelope({
      intentName: 'SetCityIntent',
    });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain("didn't catch the city");
  });
});

describe('HelpHandler', () => {
  it('returns help text', async () => {
    const skill = createSkill();
    const envelope = createIntentRequestEnvelope({
      intentName: 'AMAZON.HelpIntent',
    });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain('prayer times');
    expect(text).toContain('play the athan');
    expect(response.response?.shouldEndSession).toBe(false);
  });
});

describe('StopHandler', () => {
  it('handles AMAZON.StopIntent', async () => {
    const skill = createSkill();
    const envelope = createIntentRequestEnvelope({
      intentName: 'AMAZON.StopIntent',
    });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain('Goodbye');
    expect(response.response?.shouldEndSession).toBe(true);

    const directives = response.response?.directives || [];
    const stopDirective = directives.find((d: any) => d.type === 'AudioPlayer.Stop');
    expect(stopDirective).toBeDefined();
  });

  it('handles AMAZON.CancelIntent', async () => {
    const skill = createSkill();
    const envelope = createIntentRequestEnvelope({
      intentName: 'AMAZON.CancelIntent',
    });

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain('Goodbye');
  });
});

describe('SessionEndedHandler', () => {
  it('handles session ended request', async () => {
    const skill = createSkill();
    const envelope = createSessionEndedRequestEnvelope();

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    expect(response).toBeDefined();
    expect(response.response).toBeDefined();
  });
});

describe('AudioPlayer Handlers', () => {
  it('handles PlaybackStarted', async () => {
    const skill = createSkill();
    const envelope = createAudioPlayerRequestEnvelope('AudioPlayer.PlaybackStarted');

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    expect(response).toBeDefined();
    expect(response.response).toBeDefined();
  });

  it('handles PlaybackFinished', async () => {
    const skill = createSkill();
    const envelope = createAudioPlayerRequestEnvelope('AudioPlayer.PlaybackFinished');

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    expect(response).toBeDefined();
  });

  it('handles PlaybackStopped', async () => {
    const skill = createSkill();
    const envelope = createAudioPlayerRequestEnvelope('AudioPlayer.PlaybackStopped');

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    expect(response).toBeDefined();
  });

  it('handles PlaybackNearlyFinished', async () => {
    const skill = createSkill();
    const envelope = createAudioPlayerRequestEnvelope('AudioPlayer.PlaybackNearlyFinished');

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    expect(response).toBeDefined();
  });

  it('handles PlaybackFailed', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const skill = createSkill();
    const envelope = createAudioPlayerRequestEnvelope('AudioPlayer.PlaybackFailed');

    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    expect(response).toBeDefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('ErrorHandler', () => {
  it('catches unhandled errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const brokenHandler = {
      canHandle() { return true; },
      handle(): never { throw new Error('Test error'); },
    };

    const skill = SkillBuilders.custom()
      .addRequestHandlers(brokenHandler)
      .addErrorHandlers(ErrorHandler)
      .create();

    const envelope = createLaunchRequestEnvelope();
    const response = await skill.invoke(envelope, {}) as ResponseEnvelope;

    const text = speechText(response);
    expect(text).toContain('trouble processing');
    consoleSpy.mockRestore();
  });
});
