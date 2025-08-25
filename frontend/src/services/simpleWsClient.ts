/**
 * Simplified WebSocket client for chat functionality
 * Focuses only on essential features: connect, send messages, receive messages
 */

import {
  ChannelMessageData,
  MessageType,
  WebSocketMessage,
  isWebSocketMessage,
  isChannelMessage,
  isErrorMessage,
  ErrorData,
} from "./types/wsTypes";

// Connection states
export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

// Simple event handlers interface
export interface SimpleWebSocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event | Error) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onChannelMessage?: (message: WebSocketMessage & { data: any }) => void;
}

// Simple WebSocket configuration
export interface SimpleWebSocketConfig {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  connectionTimeout?: number;
}

export class SimpleWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = "";
  private userId: string = "";
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private handlers: SimpleWebSocketEventHandlers = {};
  private config: SimpleWebSocketConfig;
  
  // Reconnection logic
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect = false;
  private connectionPromise: { resolve: () => void; reject: (error: any) => void } | null = null;

  constructor(config: SimpleWebSocketConfig = {}) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      connectionTimeout: 10000,
      ...config,
    };
  }

  setEventHandlers(handlers: SimpleWebSocketEventHandlers) {
    this.handlers = handlers;
  }

  async connect(url: string, params: { userId: string }): Promise<void> {
    this.url = `${url}?userId=${params.userId}`;
    this.userId = params.userId;
    this.isIntentionalDisconnect = false;

    return new Promise((resolve, reject) => {
      try {
        this.setConnectionState(ConnectionState.CONNECTING);
        
        this.ws = new WebSocket(this.url);
        this.connectionPromise = { resolve, reject };

        const connectionTimeout = setTimeout(() => {
          if (this.connectionState === ConnectionState.CONNECTING) {
            this.ws?.close();
            const timeoutError = new Error("Connection timeout");
            if (this.connectionPromise) {
              this.connectionPromise.reject(timeoutError);
              this.connectionPromise = null;
            }
          }
        }, this.config.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log("WebSocket transport connected, waiting for server confirmation...");
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.setConnectionState(ConnectionState.ERROR);
          this.handlers.onError?.(error);
          
          if (this.connectionPromise) {
            this.connectionPromise.reject(error);
            this.connectionPromise = null;
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log("WebSocket closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            intentional: this.isIntentionalDisconnect,
          });

          // If we were still waiting for connection confirmation, reject the promise
          if (this.connectionState === ConnectionState.CONNECTING && this.connectionPromise) {
            const closeError = new Error(`WebSocket closed before confirmation: ${event.reason || event.code}`);
            this.connectionPromise.reject(closeError);
            this.connectionPromise = null;
          }

          if (this.connectionState === ConnectionState.CONNECTED) {
            this.handlers.onDisconnect?.();

            // Only attempt reconnection if disconnect was not intentional
            if (!this.isIntentionalDisconnect) {
              console.log("Unintentional disconnect detected, attempting reconnection");
              this.attemptReconnect();
            }
          }

          this.setConnectionState(ConnectionState.DISCONNECTED);
          this.isIntentionalDisconnect = false;
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage) {
    console.log("Received WebSocket message:", message);

    // Validate message
    if (!isWebSocketMessage(message)) {
      console.warn("Received invalid WebSocket message:", message);
      return;
    }

    // Handle connection confirmation
    if (message.type === MessageType.CONNECT) {
      console.log("Connection confirmed by server");
      this.setConnectionState(ConnectionState.CONNECTED);
      this.reconnectAttempts = 0;
      this.handlers.onConnect?.();
      
      if (this.connectionPromise) {
        this.connectionPromise.resolve();
        this.connectionPromise = null;
      }
      return;
    }

    // Handle error messages
    if (isErrorMessage(message)) {
      console.error("Received error message:", message.data);
      this.handlers.onError?.(new Error((message.data as ErrorData).message));
      return;
    }

    // Handle channel messages
    if (isChannelMessage(message)) {
      this.handlers.onChannelMessage?.(message as WebSocketMessage & { data: any });
    }

    // Emit generic message event
    this.handlers.onMessage?.(message);
  }

  sendMessage(channelId: string, text: string) {
    if (!this.isConnected()) {
      throw new Error("WebSocket not connected");
    }

    const message: WebSocketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: MessageType.CHANNEL_MESSAGE,
      data: {
        channel_id: channelId,
        text,
      } as ChannelMessageData,
      timestamp: Date.now(),
      user_id: this.userId,
    };

    this.ws!.send(JSON.stringify(message));
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.setConnectionState(ConnectionState.DISCONNECTED);
  }

  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED && 
           this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private setConnectionState(state: ConnectionState) {
    if (this.connectionState !== state) {
      this.connectionState = state;
      console.log("Connection state changed:", state);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.log("Max reconnection attempts reached");
      this.setConnectionState(ConnectionState.ERROR);
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.url.split('?')[0], { userId: this.userId })
        .catch((error) => {
          console.error("Reconnection failed:", error);
          this.attemptReconnect();
        });
    }, this.config.reconnectInterval);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
