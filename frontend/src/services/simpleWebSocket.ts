/**
 * Simplified WebSocket client for chat functionality
 * Focuses only on essential features: connect, send messages, receive messages
 */

export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting", 
  CONNECTED = "connected",
  ERROR = "error",
}

export interface ChatMessage {
  id: number;
  channelId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
  type: string;
  url?: string;
  fileName?: string;
}

export interface WebSocketMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  user_id?: string;
}

export interface SimpleWebSocketConfig {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface WebSocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onMessage?: (message: ChatMessage) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

export class SimpleWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = "";
  private userId: string = "";
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private handlers: WebSocketEventHandlers = {};
  private config: SimpleWebSocketConfig;
  
  // Reconnection logic
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect = false;

  constructor(config: SimpleWebSocketConfig = {}) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  setEventHandlers(handlers: WebSocketEventHandlers) {
    this.handlers = handlers;
  }

  async connect(baseUrl: string, userId: string): Promise<void> {
    this.userId = userId;
    this.url = `${baseUrl}/ws?userId=${userId}`;
    this.isIntentionalDisconnect = false;

    return new Promise((resolve, reject) => {
      try {
        this.setConnectionState(ConnectionState.CONNECTING);
        
        this.ws = new WebSocket(this.url);

        const connectionTimeout = setTimeout(() => {
          if (this.connectionState === ConnectionState.CONNECTING) {
            this.ws?.close();
            reject(new Error("Connection timeout"));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log("WebSocket transport connected, waiting for server confirmation...");
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message, resolve, reject);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error("WebSocket error:", error);
          this.setConnectionState(ConnectionState.ERROR);
          this.handlers.onError?.(error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log("WebSocket closed:", event.code, event.reason);
          
          if (this.connectionState === ConnectionState.CONNECTING) {
            reject(new Error(`Connection failed: ${event.reason || event.code}`));
          }
          
          this.setConnectionState(ConnectionState.DISCONNECTED);
          this.stopHeartbeat();
          this.handlers.onDisconnect?.();
          
          // Auto-reconnect if not intentional
          if (!this.isIntentionalDisconnect && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect();
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage, resolve?: () => void, reject?: (error: any) => void) {
    console.log("Received WebSocket message:", message);

    // Handle connection confirmation
    if (message.type === "connection.connect") {
      console.log("Connection confirmed by server");
      this.setConnectionState(ConnectionState.CONNECTED);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.handlers.onConnect?.();
      resolve?.();
      return;
    }

    // Handle chat messages
    if (message.type === "channel.message") {
      const chatData = message.data;
      
      if (!chatData || typeof chatData.ID !== 'number') {
        console.error("Invalid chat message data:", chatData);
        return;
      }

      const chatMessage: ChatMessage = {
        id: chatData.ID,
        channelId: chatData.ChannelID,
        senderId: chatData.SenderID,
        senderName: chatData.Sender?.Username || "Unknown",
        senderAvatar: chatData.Sender?.Avatar || "",
        text: chatData.Text || "",
        createdAt: chatData.CreatedAt || new Date().toISOString(),
        type: "group",
        url: chatData.URL || undefined,
        fileName: chatData.FileName || undefined,
      };

      this.handlers.onMessage?.(chatMessage);
      return;
    }

    // Handle errors
    if (message.type === "error") {
      console.error("Server error:", message.data);
      this.handlers.onError?.(message.data);
      return;
    }

    // Handle pong responses
    if (message.type === "connection.pong") {
      console.log("Received pong from server");
      return;
    }

    console.log("Unhandled message type:", message.type);
  }

  sendMessage(channelId: string, text: string, url?: string, fileName?: string) {
    if (!this.isConnected()) {
      throw new Error("WebSocket not connected");
    }

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "channel.message",
      data: {
        channel_id: channelId,
        text,
        url: url || null,
        fileName: fileName || null,
      },
      timestamp: Date.now(),
      user_id: this.userId,
    };

    this.ws!.send(JSON.stringify(message));
  }

  joinChannel(channelId: string) {
    if (!this.isConnected()) {
      throw new Error("WebSocket not connected");
    }

    const message = {
      id: `join-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "channel.join",
      data: { channel_id: channelId },
      timestamp: Date.now(),
      user_id: this.userId,
    };

    this.ws!.send(JSON.stringify(message));
  }

  leaveChannel(channelId: string) {
    if (!this.isConnected()) {
      return; // Don't throw error on disconnect
    }

    const message = {
      id: `leave-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "channel.leave", 
      data: { channel_id: channelId },
      timestamp: Date.now(),
      user_id: this.userId,
    };

    this.ws!.send(JSON.stringify(message));
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    
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
      this.handlers.onConnectionStateChange?.(state);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        const ping = {
          id: `ping-${Date.now()}`,
          type: "connection.ping",
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
          user_id: this.userId,
        };
        this.ws!.send(JSON.stringify(ping));
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    this.clearReconnectTimer();
    this.reconnectAttempts++;
    
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnect attempt ${this.reconnectAttempts}`);
      this.connect(this.url.split('/ws')[0], this.userId).catch((error) => {
        console.error("Reconnect failed:", error);
      });
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
