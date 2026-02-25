# Audio Files

This directory contains Athan (call to prayer) audio files used by the Alexa skill and iOS app.

## Requirements

- **Format:** MP3 (MPEG Audio Layer 3)
- **Bit rate:** 48 kbps (Alexa AudioPlayer requirement)
- **Sample rate:** 22050 Hz or 16000 Hz
- **Duration:** Under 240 seconds per file (Alexa limit)
- **Channels:** Mono or stereo
- **Hosting:** Files must be served over HTTPS for Alexa playback

## Directory Layout

```
audio/
├── README.md          This file
├── LICENSES.md        Per-file license provenance
└── athan/
    └── default.mp3    Default Athan recording
```

## Adding Audio Files

1. Place the audio file in the appropriate subdirectory
2. Record the license, source, and attribution in `LICENSES.md`
3. Verify the file meets the format requirements above
4. Test playback through the Alexa skill simulator

## Licensing Rules

- All audio files **must** have documented provenance
- Only public domain, Creative Commons (CC0, CC-BY), or explicitly licensed files are permitted
- No copyrighted recordings without written permission from the rights holder
- Each file must have a corresponding entry in `LICENSES.md` before it can be merged
