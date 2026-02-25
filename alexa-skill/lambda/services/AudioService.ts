export interface AthanAudioInfo {
  url: string;
  token: string;
  offsetInMilliseconds: number;
}

const ATHAN_AUDIO_URL =
  process.env.ATHAN_AUDIO_URL ||
  'https://athan-audio.s3.amazonaws.com/athan-default.mp3';

export class AudioService {
  getAthanAudio(prayerName?: string): AthanAudioInfo {
    const timestamp = Date.now();
    return {
      url: ATHAN_AUDIO_URL,
      token: `athan-${prayerName || 'default'}-${timestamp}`,
      offsetInMilliseconds: 0,
    };
  }
}
