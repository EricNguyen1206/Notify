import {
  ChannelJoinData,
  ChannelMessageData,
  MessageType,
  MessageTypeValues,
  WebSocketMessage,
  createWebSocketMessage,
  isChannelMessage,
  isTypingIndicator,
  isErrorMessage,
  TypingIndicatorData,
  ErrorData,
  UserStatusData,
  MemberJoinLeaveData,
} from "./websocket";

// Connection states
export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

// Note: WebSocket message types are now imported from generated types

// Type guards for message validation
export const isValidMessageType = (type: string): type is MessageTypeValues => {
  return Object.values(MessageType).includes(type as MessageTypeValues);
};

export const isWebSocketMessage = (data: unknown): data is WebSocketMessage => {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    typeof msg.id === "string" &&
    typeof msg.type === "string" &&
    isValidMessageType(msg.type) &&
    typeof msg.timestamp === "number" &&
    typeof msg.user_id === "string" &&
    msg.data !== undefined
  );
};

// Message queue item interface
export interface QueuedMessage {
  message: WebSocketMessage;
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
  onMessage?: (message: WebSocketMessage) => void;
  onChannelMessage?: (message: WebSocketMessage & { data: ChannelMessageData }) => void;
  onTypingIndicator?: (message: WebSocketMessage & { data: TypingIndicatorData }) => void;
  onMemberJoin?: (message: WebSocketMessage & { data: MemberJoinLeaveData }) => void;
  onMemberLeave?: (message: WebSocketMessage & { data: MemberJoinLeaveData }) => void;
  onUserStatus?: (message: WebSocketMessage & { data: UserStatusData }) => void;
  onUserNotification?: (message: WebSocketMessage) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

// Circuit breaker states for connection management
enum CircuitBreakerState {
  CLOSED = "closed", // Normal operation
  OPEN = "open", // Failing, stop attempts
  HALF_OPEN = "half_open", // Testing if service recovered
}

// Enhanced WebSocket client class with circuit breaker pattern
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

  // Circuit breaker properties
  private circuitBreakerState: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private circuitBreakerTimeout = 300000; // 5 minutes before trying again
  private failureThreshold = 5; // Number of failures before opening circuit

  // Connection management flags
  private intentionalDisconnect = false; // Flag to track intentional disconnects
  private lastConnectionAttempt = 0; // Timestamp of last connection attempt
  private connectionRateLimit = 1000; // Minimum time between connection attempts (1 second)
  private autoReconnect = true; // Gate auto-reconnect triggers from visibility/network events

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
  private url = "";
  private params: Record<string, any> = {};
  private isPageVisible = true;

  // Bound global event handlers for cleanup
  private visibilityChangeHandler?: () => void;
  private beforeUnloadHandler?: () => void;
  private onlineHandler?: () => void;
  private offlineHandler?: () => void;

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
    if (typeof document !== "undefined") {
      this.visibilityChangeHandler = () => {
        this.isPageVisible = document.visibilityState === "visible";
        if (this.isPageVisible) {
          this.handlePageVisible();
        } else {
          this.handlePageHidden();
        }
      };
      document.addEventListener("visibilitychange", this.visibilityChangeHandler);
    }

    if (typeof window !== "undefined") {
      this.beforeUnloadHandler = () => {
        this.disconnect();
      };
      window.addEventListener("beforeunload", this.beforeUnloadHandler);
    }
  }

  private teardownPageVisibilityHandling(): void {
    if (typeof document !== "undefined" && this.visibilityChangeHandler) {
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
      this.visibilityChangeHandler = undefined;
    }
    if (typeof window !== "undefined" && this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = undefined;
    }
  }

  private setupNetworkMonitoring(): void {
    if (typeof window !== "undefined") {
      this.onlineHandler = () => {
        console.log("Network came back online");
        if (!this.autoReconnect) {
          console.log("Auto-reconnect disabled; ignoring online event");
          return;
        }
        // Only attempt reconnection if we're disconnected or in error and not already trying to connect
        if (this.connectionState === ConnectionState.DISCONNECTED || this.connectionState === ConnectionState.ERROR) {
          if (!this.reconnectTimer) {
            console.log("Network online, attempting reconnection...");
            this.connect(this.url, this.params).catch((error) => {
              console.error("Failed to reconnect on network online:", error);
            });
          } else {
            console.log("Network online, but reconnection already in progress");
          }
        } else {
          console.log("Network online, but connection is already active or connecting");
        }
      };

      this.offlineHandler = () => {
        console.log("Network went offline");
        // Stop heartbeat to conserve resources
        this.stopHeartbeat();
      };

      window.addEventListener("online", this.onlineHandler);
      window.addEventListener("offline", this.offlineHandler);
    }
  }

  private teardownNetworkMonitoring(): void {
    if (typeof window !== "undefined") {
      if (this.onlineHandler) {
        window.removeEventListener("online", this.onlineHandler);
        this.onlineHandler = undefined;
      }
      if (this.offlineHandler) {
        window.removeEventListener("offline", this.offlineHandler);
        this.offlineHandler = undefined;
      }
    }
  }

  private handlePageVisible(): void {
    if (!this.autoReconnect) {
      console.log("Auto-reconnect disabled; ignoring visibility event");
      return;
    }
    // Only attempt reconnection if we're actually disconnected and not already trying to connect
    if (this.connectionState === ConnectionState.DISCONNECTED || this.connectionState === ConnectionState.ERROR) {
      if (!this.reconnectTimer) {
        console.log("Page became visible, reconnecting...");
        this.connect(this.url, this.params).catch((error) => {
          console.error("Failed to reconnect on page visible:", error);
        });
      } else {
        console.log("Page became visible, but reconnection already in progress");
      }
    } else if (this.connectionState === ConnectionState.CONNECTED) {
      // Verify the connection is actually alive before resuming heartbeat
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log("Page became visible, resuming heartbeat for active connection");
        this.startHeartbeat();
      } else {
        console.log("Page became visible, connection appears dead, reconnecting...");
        this.attemptReconnect();
      }
    } else if (
      this.connectionState === ConnectionState.CONNECTING ||
      this.connectionState === ConnectionState.RECONNECTING
    ) {
      console.log("Page became visible, connection attempt already in progress");
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
    const now = Date.now();

    // Rate limiting: prevent too frequent connection attempts
    if (now - this.lastConnectionAttempt < this.connectionRateLimit) {
      const waitTime = this.connectionRateLimit - (now - this.lastConnectionAttempt);
      console.log(`Connection rate limited, waiting ${waitTime}ms`);
      return Promise.resolve();
    }

    // Prevent multiple simultaneous connection attempts
    if (
      this.connectionState === ConnectionState.CONNECTING ||
      this.connectionState === ConnectionState.RECONNECTING ||
      (this.connectionState === ConnectionState.CONNECTED && this.ws?.readyState === WebSocket.OPEN)
    ) {
      console.log(`Connection attempt skipped - current state: ${this.connectionState}`);
      return Promise.resolve();
    }

    // Update last connection attempt timestamp
    this.lastConnectionAttempt = now;

    // Clear any existing reconnection timer to prevent conflicts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.url = url;
    this.params = params || {};
    this.autoReconnect = true; // Allow auto-reconnect for this session

    return new Promise((resolve, reject) => {
      try {
        this.setConnectionState(ConnectionState.CONNECTING);

        const query = this.params ? "?" + new URLSearchParams(this.params).toString() : "";
        const wsUrl = url.replace(/^http/, "ws") + query;

        this.ws = new WebSocket(wsUrl);

        // Connection timeout
        this.connectionTimer = setTimeout(() => {
          if (this.connectionState === ConnectionState.CONNECTING) {
            this.ws?.close();
            reject(new Error("Connection timeout"));
          }
        }, this.connectionTimeout);

        this.ws.onopen = () => {
          this.clearConnectionTimer();
          this.setConnectionState(ConnectionState.CONNECTED);
          this.reconnectAttempts = 0;
          this.connectionStartTime = Date.now();
          this.recordConnectionSuccess(); // Reset circuit breaker
          this.startHeartbeat();
          this.flushMessageQueue(); // Send any queued messages
          this.listeners.onConnect?.();
          resolve();
        };

        this.ws.onerror = (error) => {
          this.clearConnectionTimer();
          this.recordConnectionFailure(); // Record failure for circuit breaker
          this.setConnectionState(ConnectionState.ERROR);
          this.listeners.onError?.(error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          this.clearConnectionTimer();
          this.stopHeartbeat();

          console.log("WebSocket closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            intentional: this.intentionalDisconnect,
          });

          if (this.connectionState === ConnectionState.CONNECTED) {
            // this.setConnectionState(ConnectionState.DISCONNECTED);
            this.listeners.onDisconnect?.();

            // Only attempt reconnection if disconnect was not intentional and autoReconnect is enabled
            if (!this.intentionalDisconnect && this.autoReconnect) {
              console.log("Unintentional disconnect detected, attempting reconnection");
              this.attemptReconnect();
            } else {
              console.log("Reconnect suppressed (intentional disconnect or autoReconnect disabled)");
            }
          }

          // Reset the intentional disconnect flag for next connection
          this.intentionalDisconnect = false;
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
    console.log("Intentional disconnect initiated");
    this.intentionalDisconnect = true; // Mark as intentional
    this.autoReconnect = false; // Disable auto-reconnect triggers
    this.clearTimers();
    this.setConnectionState(ConnectionState.DISCONNECTED);
    // Remove global listeners before closing
    this.teardownPageVisibilityHandling();
    this.teardownNetworkMonitoring();
    try {
      this.ws?.close();
    } finally {
      this.ws = null;
    }
  }

  // Message sending methods with queuing support
  sendMessage<T>(type: MessageTypeValues, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const message = createWebSocketMessage(type, data, this.params.userId);

      if (this.isConnected() && this.ws) {
        try {
          this.ws.send(JSON.stringify(message));
          resolve();
        } catch (error) {
          console.error("Failed to send message, queuing:", error);
          this.queueMessage(message);
          reject(error);
        }
      } else {
        // Queue message when not connected
        console.log("Not connected, queuing message:", type);
        this.queueMessage(message);
        // Resolve immediately for queued messages (optimistic response)
        resolve();
      }
    });
  }

  joinChannel(channelId: string): void {
    this.sendMessage(MessageType.CHANNEL_JOIN, {
      channel_id: channelId,
    });
  }

  leaveChannel(channelId: string): void {
    this.sendMessage(MessageType.CHANNEL_LEAVE, {
      channel_id: channelId,
    });
  }

  sendChannelMessage(channelId: string, text: string, url?: string, fileName?: string): void {
    this.sendMessage(MessageType.CHANNEL_MESSAGE, {
      channel_id: channelId,
      text,
      url: url || null,
      fileName: fileName || null,
    });
  }

  sendTypingIndicator(channelId: string, isTyping: boolean): void {
    const type = isTyping ? MessageType.CHANNEL_TYPING : MessageType.CHANNEL_STOP_TYPING;
    this.sendMessage(type, {
      channel_id: channelId,
      is_typing: isTyping,
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
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Connection state changed: ${this.connectionState} -> ${state}`, {
        url: this.url,
        reconnectAttempts: this.reconnectAttempts,
        circuitBreakerState: this.circuitBreakerState,
        intentionalDisconnect: this.intentionalDisconnect,
        wsReadyState: this.ws?.readyState,
      });
      this.connectionState = state;
      this.listeners.onConnectionStateChange?.(state);
    }
  }

  // Message handling with deduplication
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      if (!isWebSocketMessage(data)) {
        console.warn("Received invalid WebSocket message:", data);
        return;
      }

      // Message deduplication
      if (data.id && this.processedMessages.has(data.id)) {
        console.log("Duplicate message ignored:", data.id);
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
      if (data.type === MessageType.PONG) {
        console.log("Received pong response");
        return; // Heartbeat response, no need to emit
      }

      // Handle connection success message
      if (data.type === "connection.connect") {
        console.log("Connection established:", data);
        this.connectionStartTime = Date.now();
        return;
      }

      // Emit generic message event
      this.listeners.onMessage?.(data);

      // Emit specific message type events
      switch (data.type) {
        case MessageType.CHANNEL_MESSAGE:
          if (isChannelMessage(data)) {
            this.listeners.onChannelMessage?.(data);
          }
          break;
        case MessageType.CHANNEL_TYPING:
        case MessageType.CHANNEL_STOP_TYPING:
          if (isTypingIndicator(data)) {
            this.listeners.onTypingIndicator?.(data);
          }
          break;
        case MessageType.MEMBER_JOIN:
          this.listeners.onMemberJoin?.(data as WebSocketMessage & { data: MemberJoinLeaveData });
          break;
        case MessageType.MEMBER_LEAVE:
          this.listeners.onMemberLeave?.(data as WebSocketMessage & { data: MemberJoinLeaveData });
          break;
        case MessageType.USER_STATUS:
          this.listeners.onUserStatus?.(data as WebSocketMessage & { data: UserStatusData });
          break;
        case MessageType.USER_NOTIFICATION:
          this.listeners.onUserNotification?.(data);
          break;
        case MessageType.ERROR:
          if (isErrorMessage(data)) {
            console.error("WebSocket error message:", data);
            this.listeners.onError?.(new Event("websocket-error"));
          }
          break;
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error, event.data);
    }
  }

  // Message queuing for offline scenarios
  private queueMessage(message: WebSocketMessage): void {
    const queuedMessage: QueuedMessage = {
      message: {
        ...message,
        id: message.id || this.generateMessageId(),
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
    };

    this.messageQueue.push(queuedMessage);

    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > this.messageQueueLimit) {
      this.messageQueue.shift(); // Remove oldest message
      console.warn("Message queue limit reached, removing oldest message");
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
            console.log("Sent queued message:", queuedItem.message.type);
          }
        } catch (error) {
          console.error("Failed to send queued message:", error);

          // Re-queue if under retry limit
          if (queuedItem.retries < queuedItem.maxRetries) {
            queuedItem.retries++;
            this.messageQueue.unshift(queuedItem);
            console.log(`Re-queued message (retry ${queuedItem.retries}/${queuedItem.maxRetries})`);
          } else {
            console.error("Max retries reached for queued message, dropping:", queuedItem.message);
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
        this.sendMessage(MessageType.PING, {});
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Circuit breaker logic
  private canAttemptConnection(): boolean {
    const now = Date.now();

    switch (this.circuitBreakerState) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        // Check if enough time has passed to try again
        if (now - this.lastFailureTime >= this.circuitBreakerTimeout) {
          console.log("Circuit breaker: Moving to HALF_OPEN state");
          this.circuitBreakerState = CircuitBreakerState.HALF_OPEN;
          return true;
        }
        console.log(
          `Circuit breaker: OPEN - waiting ${Math.round((this.circuitBreakerTimeout - (now - this.lastFailureTime)) / 1000)}s before retry`
        );
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  private recordConnectionFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      console.log(`Circuit breaker: Opening circuit after ${this.failureCount} failures`);
      this.circuitBreakerState = CircuitBreakerState.OPEN;
    }
  }

  private recordConnectionSuccess(): void {
    console.log("Circuit breaker: Connection successful, resetting");
    this.failureCount = 0;
    this.circuitBreakerState = CircuitBreakerState.CLOSED;
  }

  // Reconnection logic with exponential backoff, jitter, and circuit breaker
  private attemptReconnect(): void {
    // Prevent multiple reconnection attempts
    if (this.reconnectTimer) {
      console.log("Reconnection already in progress, skipping");
      return;
    }

    // Check circuit breaker
    if (!this.canAttemptConnection()) {
      console.log("Circuit breaker preventing reconnection attempt");
      this.setConnectionState(ConnectionState.ERROR);
      return;
    }

    // Check if we've exceeded max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.recordConnectionFailure();
      this.setConnectionState(ConnectionState.ERROR);
      return;
    }

    // Don't attempt reconnection if we're already connected or connecting
    if (this.connectionState === ConnectionState.CONNECTED || this.connectionState === ConnectionState.CONNECTING) {
      console.log("Skipping reconnection - already connected or connecting");
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
      // Clear the timer reference
      this.reconnectTimer = null;

      try {
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        await this.connect(this.url, this.params);
        console.log("Reconnection successful");
        // Success is handled in the onopen callback via recordConnectionSuccess()
      } catch (error) {
        console.error("Reconnection failed:", error);
        this.recordConnectionFailure(); // Record failure for circuit breaker

        // Only attempt another reconnection if we haven't exceeded max attempts and circuit breaker allows
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.canAttemptConnection()) {
          this.attemptReconnect();
        } else {
          this.setConnectionState(ConnectionState.ERROR);
        }
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
