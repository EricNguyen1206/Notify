import { ChannelJoinData, ChannelMessageData, ChannelMessageReceivedMessage, MessageType, WsBaseMessage, WsMessageType } from './types/wsTypes';

// Connection states
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Additional WebSocket-specific types
export interface TypingIndicatorData {
  channel_id: string;
  is_typing: boolean;
}

export interface ErrorData {
  code: string;
  message: string;
  details?: string;
}

export interface UserStatusData {
  user_id: string;
  status: 'online' | 'offline' | 'away';
}

export interface UserNotificationData {
  type: 'message' | 'mention' | 'system';
  title: string;
  message: string;
  channel_id?: string;
}

export interface MemberJoinLeaveData {
  channel_id: string;
  user_id: string;
  username: string;
}

// Type guards for message validation
export const isValidMessageType = (type: string): type is MessageType => {
  return Object.values(WsMessageType).includes(type as MessageType);
};

export const isWsBaseMessage = (data: unknown): data is WsBaseMessage => {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    typeof msg.id === 'string' &&
    typeof msg.type === 'string' &&
    isValidMessageType(msg.type) &&
    typeof msg.timestamp === 'number' &&
    typeof msg.user_id === 'string' &&
    msg.data !== undefined
  );
};

// Message queue item interface
export interface QueuedMessage {
  message: WsBaseMessage;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

// WebSocket client configuration
export interface WebSocketClientConfig {
  reconnectAttempts?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
  messageQueueLimit?: number;
  messageCacheSize?: number;
  enableJitter?: boolean;
}

// Event listeners interface
export interface WebSocketEventListeners {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: <T>(message: WsBaseMessage<T>) => void;
  onChannelMessage?: (message: ChannelMessageReceivedMessage) => void;
  onTypingIndicator?: (message: WsBaseMessage<TypingIndicatorData>) => void;
  onMemberJoin?: (message: WsBaseMessage<MemberJoinLeaveData>) => void;
  onMemberLeave?: (message: WsBaseMessage<MemberJoinLeaveData>) => void;
  onUserStatus?: (message: WsBaseMessage<UserStatusData>) => void;
  onUserNotification?: (message: WsBaseMessage<UserNotificationData>) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

// Enhanced WebSocket client class
export class TypeSafeWebSocketClient {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private maxReconnectDelay: number;
  private heartbeatInterval: number;
  private connectionTimeout: number;
  private messageQueueLimit: number;
  private messageCacheSize: number;
  private enableJitter: boolean;

  // Timers
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;

  // Message handling
  private messageQueue: QueuedMessage[] = [];
  private processedMessages = new Set<string>();
  private connectionStartTime = 0;

  // Event listeners and state
  private listeners: WebSocketEventListeners = {};
  private url = '';
  private params: Record<string, any> = {};
  private isPageVisible = true;

  constructor(config: WebSocketClientConfig = {}) {
    this.maxReconnectAttempts = config.reconnectAttempts ?? 5;
    this.reconnectDelay = config.reconnectDelay ?? 1000;
    this.maxReconnectDelay = config.maxReconnectDelay ?? 30000;
    this.heartbeatInterval = config.heartbeatInterval ?? 30000;
    this.connectionTimeout = config.connectionTimeout ?? 10000;
    this.messageQueueLimit = config.messageQueueLimit ?? 100;
    this.messageCacheSize = config.messageCacheSize ?? 1000;
    this.enableJitter = config.enableJitter ?? true;

    // Setup page visibility and network monitoring
    this.setupPageVisibilityHandling();
    this.setupNetworkMonitoring();
  }

  // Page visibility and network monitoring setup
  private setupPageVisibilityHandling(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isPageVisible = document.visibilityState === 'visible';

        if (this.isPageVisible) {
          this.handlePageVisible();
        } else {
          this.handlePageHidden();
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }

  private setupNetworkMonitoring(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Network came back online');
        if (this.connectionState !== ConnectionState.CONNECTED) {
          this.connect(this.url, this.params);
        }
      });

      window.addEventListener('offline', () => {
        console.log('Network went offline');
        this.setConnectionState(ConnectionState.DISCONNECTED);
      });
    }
  }

  private handlePageVisible(): void {
    if (this.connectionState === ConnectionState.DISCONNECTED ||
        this.connectionState === ConnectionState.ERROR) {
      console.log('Page became visible, reconnecting...');
      this.connect(this.url, this.params);
    } else if (this.connectionState === ConnectionState.CONNECTED) {
      // Resume heartbeat if connection is still alive
      this.startHeartbeat();
    }
  }

  private handlePageHidden(): void {
    // Don't disconnect immediately, just stop heartbeat to conserve resources
    this.stopHeartbeat();
  }

  // Event listener management
  setEventListeners(listeners: WebSocketEventListeners): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  // Connection management
  async connect(url: string, params?: Record<string, any>): Promise<void> {
    this.url = url;
    this.params = params || {};

    return new Promise((resolve, reject) => {
      try {
        this.setConnectionState(ConnectionState.CONNECTING);

        const query = this.params ? '?' + new URLSearchParams(this.params).toString() : '';
        const wsUrl = url.replace(/^http/, 'ws') + query;

        this.ws = new WebSocket(wsUrl);

        // Connection timeout
        this.connectionTimer = setTimeout(() => {
          if (this.connectionState === ConnectionState.CONNECTING) {
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, this.connectionTimeout);

        this.ws.onopen = () => {
          this.clearConnectionTimer();
          this.setConnectionState(ConnectionState.CONNECTED);
          this.reconnectAttempts = 0;
          this.connectionStartTime = Date.now();
          this.startHeartbeat();
          this.flushMessageQueue(); // Send any queued messages
          this.listeners.onConnect?.();
          resolve();
        };

        this.ws.onerror = (error) => {
          this.clearConnectionTimer();
          this.setConnectionState(ConnectionState.ERROR);
          this.listeners.onError?.(error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.clearConnectionTimer();
          this.stopHeartbeat();

          if (this.connectionState === ConnectionState.CONNECTED) {
            this.setConnectionState(ConnectionState.DISCONNECTED);
            this.listeners.onDisconnect?.();
            this.attemptReconnect();
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

      } catch (error) {
        this.setConnectionState(ConnectionState.ERROR);
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.clearTimers();
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.ws?.close();
    this.ws = null;
  }

  // Message sending methods with queuing support
  sendMessage<T>(type: MessageType, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const message: WsBaseMessage<T> = {
        id: this.generateMessageId(),
        type,
        data,
        timestamp: Date.now(),
        user_id: this.params.userId || ''
      };

      if (this.isConnected() && this.ws) {
        try {
          this.ws.send(JSON.stringify(message));
          resolve();
        } catch (error) {
          console.error('Failed to send message, queuing:', error);
          this.queueMessage(message as WsBaseMessage);
          reject(error);
        }
      } else {
        // Queue message when not connected
        console.log('Not connected, queuing message:', type);
        this.queueMessage(message as WsBaseMessage);
        // Resolve immediately for queued messages (optimistic response)
        resolve();
      }
    });
  }

  joinChannel(channelId: string): void {
    this.sendMessage<ChannelJoinData>(WsMessageType.CHANNEL_JOIN, {
      channel_id: channelId
    });
  }

  leaveChannel(channelId: string): void {
    this.sendMessage<ChannelJoinData>(WsMessageType.CHANNEL_LEAVE, {
      channel_id: channelId
    });
  }

  sendChannelMessage(channelId: string, text: string, url?: string, fileName?: string): void {
    this.sendMessage<ChannelMessageData>(WsMessageType.CHANNEL_MESSAGE, {
      channel_id: channelId,
      text,
      url: url || null,
      fileName: fileName || null
    });
  }

  sendTypingIndicator(channelId: string, isTyping: boolean): void {
    const type = isTyping ? WsMessageType.CHANNEL_TYPING : WsMessageType.CHANNEL_STOP_TYPING;
    this.sendMessage<TypingIndicatorData>(type, {
      channel_id: channelId,
      is_typing: isTyping
    });
  }

  // Event listener management
  on<K extends keyof WebSocketEventListeners>(event: K, listener: WebSocketEventListeners[K]): void {
    this.listeners[event] = listener;
  }

  off<K extends keyof WebSocketEventListeners>(event: K): void {
    delete this.listeners[event];
  }

  // Connection state management
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.listeners.onConnectionStateChange?.(state);
    }
  }

  // Message handling with deduplication
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      if (!isWsBaseMessage(data)) {
        console.warn('Received invalid WebSocket message:', data);
        return;
      }

      // Message deduplication
      if (data.id && this.processedMessages.has(data.id)) {
        console.log('Duplicate message ignored:', data.id);
        return;
      }

      if (data.id) {
        this.processedMessages.add(data.id);

        // Limit cache size to prevent memory leaks
        if (this.processedMessages.size > this.messageCacheSize) {
          const firstId = this.processedMessages.values().next().value;
          if (firstId) {
            this.processedMessages.delete(firstId);
          }
        }
      }

      // Handle pong messages for heartbeat
      if (data.type === WsMessageType.PONG) {
        console.log('Received pong response');
        return; // Heartbeat response, no need to emit
      }

      // Handle connection success message
      if (data.type === 'connection.connect') {
        console.log('Connection established:', data);
        this.connectionStartTime = Date.now();
        return;
      }

      // Emit generic message event
      this.listeners.onMessage?.(data);

      // Emit specific message type events
      switch (data.type) {
        case WsMessageType.CHANNEL_MESSAGE:
          this.listeners.onChannelMessage?.(data as ChannelMessageReceivedMessage);
          break;
        case WsMessageType.CHANNEL_TYPING:
        case WsMessageType.CHANNEL_STOP_TYPING:
          this.listeners.onTypingIndicator?.(data as WsBaseMessage<TypingIndicatorData>);
          break;
        case WsMessageType.MEMBER_JOIN:
          this.listeners.onMemberJoin?.(data as WsBaseMessage<MemberJoinLeaveData>);
          break;
        case WsMessageType.MEMBER_LEAVE:
          this.listeners.onMemberLeave?.(data as WsBaseMessage<MemberJoinLeaveData>);
          break;
        case WsMessageType.USER_STATUS:
          this.listeners.onUserStatus?.(data as WsBaseMessage<UserStatusData>);
          break;
        case WsMessageType.USER_NOTIFICATION:
          this.listeners.onUserNotification?.(data as WsBaseMessage<UserNotificationData>);
          break;
        case WsMessageType.ERROR:
          console.error('WebSocket error message:', data);
          this.listeners.onError?.(new Event('websocket-error'));
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error, event.data);
    }
  }

  // Message queuing for offline scenarios
  private queueMessage(message: WsBaseMessage): void {
    const queuedMessage: QueuedMessage = {
      message: {
        ...message,
        id: message.id || this.generateMessageId(),
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    };

    this.messageQueue.push(queuedMessage);

    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > this.messageQueueLimit) {
      this.messageQueue.shift(); // Remove oldest message
      console.warn('Message queue limit reached, removing oldest message');
    }
  }

  private flushMessageQueue(): void {
    console.log(`Flushing ${this.messageQueue.length} queued messages`);

    while (this.messageQueue.length > 0 && this.connectionState === ConnectionState.CONNECTED) {
      const queuedItem = this.messageQueue.shift();
      if (queuedItem) {
        try {
          if (this.ws) {
            this.ws.send(JSON.stringify(queuedItem.message));
            console.log('Sent queued message:', queuedItem.message.type);
          }
        } catch (error) {
          console.error('Failed to send queued message:', error);

          // Re-queue if under retry limit
          if (queuedItem.retries < queuedItem.maxRetries) {
            queuedItem.retries++;
            this.messageQueue.unshift(queuedItem);
            console.log(`Re-queued message (retry ${queuedItem.retries}/${queuedItem.maxRetries})`);
          } else {
            console.error('Max retries reached for queued message, dropping:', queuedItem.message);
          }
          break; // Stop processing queue on error
        }
      }
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Heartbeat mechanism
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage(WsMessageType.PING, {});
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Reconnection logic with exponential backoff and jitter
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.setConnectionState(ConnectionState.ERROR);
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState(ConnectionState.RECONNECTING);

    // Exponential backoff with jitter
    const baseDelay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const cappedDelay = Math.min(baseDelay, this.maxReconnectDelay);
    const jitter = this.enableJitter ? Math.random() * 1000 : 0; // Add up to 1 second jitter
    const finalDelay = cappedDelay + jitter;

    console.log(`Reconnecting in ${finalDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        await this.connect(this.url, this.params);
        console.log('Reconnection successful');
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.attemptReconnect();
      }
    }, finalDelay);
  }

  // Utility methods
  private clearTimers(): void {
    this.clearConnectionTimer();
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }
}

// Factory function for Orval compatibility
export const createWebSocketClient = (
  config: { url: string; method: string; params?: Record<string, any> },
  options?: WebSocketClientConfig
): TypeSafeWebSocketClient => {
  const client = new TypeSafeWebSocketClient(options);

  // Auto-connect if URL is provided
  if (config.url && config.params?.userId) {
    client.connect(config.url, config.params).catch(console.error);
  }

  return client;
};
