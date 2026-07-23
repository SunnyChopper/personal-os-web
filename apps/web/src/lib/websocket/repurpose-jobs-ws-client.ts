import type { ContentVariant, RepurposeJob } from '@/types/api/personal-branding.dto';
import {
  AuthenticatedWsClient,
  type AuthenticatedWsConnectionState,
} from '@/lib/websocket/authenticated-ws-client';

export type RepurposeJobProgressPayload = RepurposeJob & {
  contentId?: string;
};

export type RepurposeVariantCreatedPayload = {
  contentId: string;
  jobId: string;
  variant: ContentVariant;
};

export type RepurposeSubscribeAckPayload = {
  contentId: string;
};

type RepurposeJobsWsClientOptions = {
  wsBaseUrl: string;
  getAccessToken: () => Promise<string | null>;
  keepAliveIntervalMs?: number;
  onJobProgress?: (payload: RepurposeJobProgressPayload) => void;
  onVariantCreated?: (payload: RepurposeVariantCreatedPayload) => void;
  onSubscribeAck?: (payload: RepurposeSubscribeAckPayload) => void;
  onConnectionStateChange?: (state: AuthenticatedWsConnectionState) => void;
  onOpen?: () => void;
};

export class RepurposeJobsWsClient {
  private readonly transport: AuthenticatedWsClient;
  private readonly onJobProgress?: (payload: RepurposeJobProgressPayload) => void;
  private readonly onVariantCreated?: (payload: RepurposeVariantCreatedPayload) => void;
  private readonly onSubscribeAck?: (payload: RepurposeSubscribeAckPayload) => void;
  private subscribedContentId: string | null = null;

  constructor(options: RepurposeJobsWsClientOptions) {
    this.onJobProgress = options.onJobProgress;
    this.onVariantCreated = options.onVariantCreated;
    this.onSubscribeAck = options.onSubscribeAck;

    this.transport = new AuthenticatedWsClient({
      wsBaseUrl: options.wsBaseUrl,
      getAccessToken: options.getAccessToken,
      keepAliveIntervalMs: options.keepAliveIntervalMs ?? 240_000,
      reconnect: true,
      logLabel: 'Repurpose WebSocket',
      onConnectionStateChange: options.onConnectionStateChange,
      onOpen: () => {
        options.onOpen?.();
        if (this.subscribedContentId) {
          void this.subscribe(this.subscribedContentId).catch(() => {
            // reconnect path will retry subscribe on next open if needed
          });
        }
      },
      onMessage: (type, payload) => this.dispatch(type, payload),
    });
  }

  async connect(): Promise<void> {
    await this.transport.connect();
  }

  disconnect(): void {
    this.subscribedContentId = null;
    this.transport.disconnect();
  }

  async subscribe(contentId: string): Promise<void> {
    this.subscribedContentId = contentId;
    await this.transport.sendAfterConnect({
      type: 'subscribeRepurposeJobs',
      payload: { contentId },
    });
  }

  getConnectionState(): AuthenticatedWsConnectionState {
    return this.transport.getConnectionState();
  }

  private dispatch(type: string, payload: unknown): void {
    switch (type) {
      case 'repurposeSubscribeAck':
        this.onSubscribeAck?.(payload as RepurposeSubscribeAckPayload);
        break;
      case 'repurposeJobProgress':
        this.onJobProgress?.(payload as RepurposeJobProgressPayload);
        break;
      case 'repurposeVariantCreated':
        this.onVariantCreated?.(payload as RepurposeVariantCreatedPayload);
        break;
      default:
        break;
    }
  }
}

export type { AuthenticatedWsConnectionState as RepurposeWsConnectionState };
