import { RequestEnvelope, IntentRequest, LaunchRequest, SessionEndedRequest } from 'ask-sdk-model';

interface CreateIntentRequestOptions {
  intentName: string;
  slots?: Record<string, string>;
  sessionAttributes?: Record<string, any>;
}

export function createIntentRequestEnvelope(options: CreateIntentRequestOptions): RequestEnvelope {
  const slots: Record<string, any> = {};
  if (options.slots) {
    for (const [name, value] of Object.entries(options.slots)) {
      slots[name] = {
        name,
        value,
        confirmationStatus: 'NONE',
      };
    }
  }

  return {
    version: '1.0',
    session: {
      new: false,
      sessionId: 'test-session-id',
      application: {
        applicationId: 'amzn1.ask.skill.test',
      },
      attributes: options.sessionAttributes || {},
      user: {
        userId: 'test-user-id',
      },
    },
    context: {
      System: {
        application: {
          applicationId: 'amzn1.ask.skill.test',
        },
        user: {
          userId: 'test-user-id',
        },
        device: {
          deviceId: 'test-device-id',
          supportedInterfaces: {},
        },
        apiEndpoint: 'https://api.amazonalexa.com',
        apiAccessToken: 'test-token',
      },
    },
    request: {
      type: 'IntentRequest',
      requestId: 'test-request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      intent: {
        name: options.intentName,
        confirmationStatus: 'NONE',
        slots,
      },
    } as IntentRequest,
  };
}

export function createLaunchRequestEnvelope(
  sessionAttributes?: Record<string, any>
): RequestEnvelope {
  return {
    version: '1.0',
    session: {
      new: true,
      sessionId: 'test-session-id',
      application: {
        applicationId: 'amzn1.ask.skill.test',
      },
      attributes: sessionAttributes || {},
      user: {
        userId: 'test-user-id',
      },
    },
    context: {
      System: {
        application: {
          applicationId: 'amzn1.ask.skill.test',
        },
        user: {
          userId: 'test-user-id',
        },
        device: {
          deviceId: 'test-device-id',
          supportedInterfaces: {},
        },
        apiEndpoint: 'https://api.amazonalexa.com',
        apiAccessToken: 'test-token',
      },
    },
    request: {
      type: 'LaunchRequest',
      requestId: 'test-request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
    } as LaunchRequest,
  };
}

export function createSessionEndedRequestEnvelope(): RequestEnvelope {
  return {
    version: '1.0',
    session: {
      new: false,
      sessionId: 'test-session-id',
      application: {
        applicationId: 'amzn1.ask.skill.test',
      },
      attributes: {},
      user: {
        userId: 'test-user-id',
      },
    },
    context: {
      System: {
        application: {
          applicationId: 'amzn1.ask.skill.test',
        },
        user: {
          userId: 'test-user-id',
        },
        device: {
          deviceId: 'test-device-id',
          supportedInterfaces: {},
        },
        apiEndpoint: 'https://api.amazonalexa.com',
        apiAccessToken: 'test-token',
      },
    },
    request: {
      type: 'SessionEndedRequest',
      requestId: 'test-request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      reason: 'USER_INITIATED',
    } as SessionEndedRequest,
  };
}

interface CreateMessageReceivedOptions {
  message: {
    operation: string;
    prayerTimes?: Record<string, string>;
    timezone?: string;
    date?: string;
    requestId?: string;
  };
  apiAccessToken?: string;
  apiEndpoint?: string;
}

export function createMessageReceivedEnvelope(
  options: CreateMessageReceivedOptions
): RequestEnvelope {
  return {
    version: '1.0',
    session: undefined as any,
    context: {
      System: {
        application: {
          applicationId: 'amzn1.ask.skill.test',
        },
        user: {
          userId: 'test-user-id',
        },
        device: {
          deviceId: 'test-device-id',
          supportedInterfaces: {},
        },
        apiEndpoint: options.apiEndpoint || 'https://api.amazonalexa.com',
        apiAccessToken: options.apiAccessToken ?? 'test-token',
      },
    },
    request: {
      type: 'Messaging.MessageReceived',
      requestId: 'test-request-id',
      timestamp: new Date().toISOString(),
      message: options.message,
    } as any,
  };
}

export function createAudioPlayerRequestEnvelope(
  requestType: string,
  token: string = 'athan-fajr-123'
): RequestEnvelope {
  return {
    version: '1.0',
    session: undefined as any,
    context: {
      System: {
        application: {
          applicationId: 'amzn1.ask.skill.test',
        },
        user: {
          userId: 'test-user-id',
        },
        device: {
          deviceId: 'test-device-id',
          supportedInterfaces: {
            AudioPlayer: {},
          },
        },
        apiEndpoint: 'https://api.amazonalexa.com',
        apiAccessToken: 'test-token',
      },
      AudioPlayer: {
        token,
        offsetInMilliseconds: 0,
        playerActivity: 'PLAYING',
      },
    },
    request: {
      type: requestType,
      requestId: 'test-request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      token,
      offsetInMilliseconds: 0,
    } as any,
  };
}

export function getSpeechText(response: any): string {
  return response.outputSpeech?.ssml?.replace(/<[^>]+>/g, '') ||
    response.outputSpeech?.text ||
    '';
}
