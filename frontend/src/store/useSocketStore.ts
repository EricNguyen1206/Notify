/**
 * Centralized WebSocket store for chat functionality
 * All WebSocket logic is handled directly in this hook for simplicity and maintainability
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useChatStore } from "./useChatStore";
import { useChannelStore } from "./useChannelStore";

// WebSocket connection states
export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

// WebSocket message types - aligned with backend
export enum MessageType {
  CONNECT = "connection.connect",
  DISCONNECT = "connection.disconnect",
  CHANNEL_JOIN = "channel.join",
  CHANNEL_LEAVE = "channel.leave",
  CHANNEL_MESSAGE = "channel.message",
  ERROR = "error",
}

// WebSocket message interfaces - aligned with backend
export interface WebSocketMessage {
  id: string;
  type: MessageType;
  data: any;
  timestamp: number;
  user_id?: string;
}

export interface ChannelMessageData {
  channel_id: string;
  text?: string | null;
  url?: string | null;
  fileName?: string | null;
}

export interface ChannelJoinLeaveData {
  channel_id: string;
}

export interface ErrorData {
  code: string;
  message: string;
}

export interface ConnectionData {
  client_id?: string;
  status?: string;
}

// Chat message interface for internal use
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

// WebSocket configuration
export interface WebSocketConfig {
  reconnectInterval: number;
  maxReconnectAttempts: number;
  connectionTimeout: number;
}

// Main socket store state interface
interface SocketState {
  // Connection state
  connectionState: ConnectionState;
  error: string | null;
  isConnecting: boolean;

  // WebSocket instance
  ws: WebSocket | null;
  userId: string;
  url: string;

  // Reconnection logic
  reconnectAttempts: number;
  reconnectTimer: NodeJS.Timeout | null;
  isIntentionalDisconnect: boolean;
  connectionPromise: { resolve: () => void; reject: (error: any) => void } | null;

  // Configuration
  config: WebSocketConfig;

  // Actions
  connect: (userId: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (channelId: string, text: string, url?: string, fileName?: string) => void;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  isConnected: () => boolean;

  // Internal methods
  handleMessage: (message: WebSocketMessage) => void;
  attemptReconnect: () => void;
}

export const useSocketStore = create<SocketState>()(
  devtools(
    (set, get) => ({
      // Initial state
      connectionState: ConnectionState.DISCONNECTED,
      error: null,
      isConnecting: false,

      // WebSocket instance
      ws: null,
      userId: "",
      url: "",

      // Reconnection logic
      reconnectAttempts: 0,
      reconnectTimer: null,
      isIntentionalDisconnect: false,
      connectionPromise: null,

      // Configuration
      config: {
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
        connectionTimeout: 10000,
      },

      // Connect to WebSocket
      connect: async (userId: string) => {
        const { ws, connectionState, config } = get();

        // Prevent multiple connection attempts
        if (connectionState === ConnectionState.CONNECTING) {
          throw new Error("Connection already in progress");
        }

        if (connectionState === ConnectionState.CONNECTED && ws?.readyState === WebSocket.OPEN) {
          return;
        }

        try {
          set({
            connectionState: ConnectionState.CONNECTING,
            error: null,
            isConnecting: true,
            userId,
            isIntentionalDisconnect: false,
          });

          const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
          const url = `${baseWsUrl}/ws?userId=${userId}`;

          set({ url });

          return new Promise<void>((resolve, reject) => {
            try {
              const wsInstance = new WebSocket(url);
              set({ ws: wsInstance, connectionPromise: { resolve, reject } });

              const connectionTimeout = setTimeout(() => {
                if (get().connectionState === ConnectionState.CONNECTING) {
                  wsInstance.close();
                  const timeoutError = new Error("Connection timeout");
                  const { connectionPromise } = get();
                  if (connectionPromise) {
                    connectionPromise.reject(timeoutError);
                    set({ connectionPromise: null });
                  }
                }
              }, config.connectionTimeout);

              wsInstance.onopen = () => {
                clearTimeout(connectionTimeout);
              };

              wsInstance.onmessage = (event) => {
                try {
                  const message: WebSocketMessage = JSON.parse(event.data);
                  get().handleMessage(message);
                } catch (error) {
                  console.error("Failed to parse WebSocket message:", error);
                }
              };

              wsInstance.onerror = (error) => {
                clearTimeout(connectionTimeout);
                set({
                  connectionState: ConnectionState.ERROR,
                  connectionPromise: null,
                });

                const { connectionPromise } = get();
                if (connectionPromise) {
                  connectionPromise.reject(error);
                }
              };

              wsInstance.onclose = (event) => {
                clearTimeout(connectionTimeout);

                const { connectionState, connectionPromise, isIntentionalDisconnect } = get();

                // If we were still waiting for connection confirmation, reject the promise
                if (connectionState === ConnectionState.CONNECTING && connectionPromise) {
                  const closeError = new Error(`WebSocket closed before confirmation: ${event.reason || event.code}`);
                  connectionPromise.reject(closeError);
                  set({ connectionPromise: null });
                }

                if (connectionState === ConnectionState.CONNECTED) {
                  // Only attempt reconnection if disconnect was not intentional
                  if (!isIntentionalDisconnect) {
                    get().attemptReconnect();
                  }
                }

                set({
                  connectionState: ConnectionState.DISCONNECTED,
                  ws: null,
                  isIntentionalDisconnect: false,
                });
              };
            } catch (error) {
              reject(error);
            }
          });
        } catch (error) {
          console.error("Failed to connect to WebSocket:", error);
          set({
            connectionState: ConnectionState.ERROR,
            error: error instanceof Error ? error.message : "Connection failed",
            isConnecting: false,
          });
          throw error;
        }
      },

      // Disconnect from WebSocket
      disconnect: () => {
        const { ws, reconnectTimer } = get();

        set({ isIntentionalDisconnect: true });

        // Clear reconnection timer
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          set({ reconnectTimer: null });
        }

        // Clear connection promise if exists
        const { connectionPromise } = get();
        if (connectionPromise) {
          connectionPromise.reject(new Error("Connection cancelled"));
          set({ connectionPromise: null });
        }

        if (ws) {
          ws.close();
        }

        set({
          connectionState: ConnectionState.DISCONNECTED,
          error: null,
          isConnecting: false,
          ws: null,
          reconnectAttempts: 0,
        });
      },

      // Send a message
      sendMessage: (channelId: string, text: string, url?: string, fileName?: string) => {
        const { ws, connectionState } = get();
        if (!ws || connectionState !== ConnectionState.CONNECTED || ws.readyState !== WebSocket.OPEN) {
          throw new Error("WebSocket not connected");
        }

        try {
          const message: WebSocketMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: MessageType.CHANNEL_MESSAGE,
            data: {
              channel_id: channelId,
              text,
              url: url || null,
              fileName: fileName || null,
            } as ChannelMessageData,
            timestamp: Date.now(),
            user_id: get().userId,
          };

          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error("Failed to send message:", error);
          set({ error: error instanceof Error ? error.message : "Failed to send message" });
          throw error;
        }
      },

      // Join a channel
      joinChannel: (channelId: string) => {
        const { ws, connectionState } = get();
        if (!ws || connectionState !== ConnectionState.CONNECTED || ws.readyState !== WebSocket.OPEN) {
          throw new Error("WebSocket not connected");
        }

        try {
          const message: WebSocketMessage = {
            id: `join-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: MessageType.CHANNEL_JOIN,
            data: { channel_id: channelId },
            timestamp: Date.now(),
            user_id: get().userId,
          };

          ws.send(JSON.stringify(message));

          // Track joined channel for automatic re-join on reconnect
          try {
            const channelStore = useChannelStore.getState();
            channelStore.addJoinedChannel(channelId);
          } catch {}
        } catch (error) {
          console.error("Failed to join channel:", error);
          set({ error: error instanceof Error ? error.message : "Failed to join channel" });
          throw error;
        }
      },

      // Leave a channel
      leaveChannel: (channelId: string) => {
        const { ws, connectionState } = get();
        if (!ws || connectionState !== ConnectionState.CONNECTED) {
          return; // Don't throw error on disconnect
        }

        try {
          const message: WebSocketMessage = {
            id: `leave-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: MessageType.CHANNEL_LEAVE,
            data: { channel_id: channelId },
            timestamp: Date.now(),
            user_id: get().userId,
          };

          ws.send(JSON.stringify(message));

          // Untrack joined channel so it isn't auto re-joined later
          try {
            const channelStore = useChannelStore.getState();
            channelStore.removeJoinedChannel(channelId);
          } catch {}
        } catch (error) {
          console.error("Failed to leave channel:", error);
          // Don't set error for leave operations as they're not critical
        }
      },

      // Check if connected
      isConnected: () => {
        const { ws, connectionState } = get();
        return connectionState === ConnectionState.CONNECTED && ws?.readyState === WebSocket.OPEN;
      },

      // Handle incoming WebSocket messages
      handleMessage: (message: WebSocketMessage) => {
        // Handle connection confirmation
        if (message.type === MessageType.CONNECT) {
          set({
            connectionState: ConnectionState.CONNECTED,
            reconnectAttempts: 0,
            isConnecting: false,
          });

          const { connectionPromise } = get();
          if (connectionPromise) {
            connectionPromise.resolve();
            set({ connectionPromise: null });
          }

          // After reconnect, automatically re-join previously joined channels
          try {
            const channelStore = useChannelStore.getState();
            const channelsToRejoin = channelStore.getJoinedChannels();
            if (channelsToRejoin.length > 0) {
              const { ws } = get();
              if (ws && ws.readyState === WebSocket.OPEN) {
                channelsToRejoin.forEach((channelId) => {
                  const joinMsg: WebSocketMessage = {
                    id: `rejoin-${channelId}-${Date.now()}`,
                    type: MessageType.CHANNEL_JOIN,
                    data: { channel_id: channelId },
                    timestamp: Date.now(),
                    user_id: get().userId,
                  };
                  try {
                    ws.send(JSON.stringify(joinMsg));
                  } catch (err) {
                    console.error("Failed to auto re-join channel", channelId, err);
                  }
                });
              }
            }
          } catch (err) {
            console.error("Auto re-join channels failed:", err);
          }
          return;
        }

        // Handle error messages
        if (message.type === MessageType.ERROR) {
          console.error("Received error message:", message.data);
          set({ error: (message.data as ErrorData).message });
          return;
        }

        // Handle channel messages
        if (message.type === MessageType.CHANNEL_MESSAGE) {
          const messageData = message.data;

          if (!messageData) {
            console.error("Invalid channel message data:", messageData);
            return;
          }

          const chatMessage: ChatMessage = {
            id: messageData.id,
            channelId: messageData.ChannelID || messageData.channelId,
            senderId: messageData.SenderID || messageData.senderId,
            senderName: messageData.Sender?.Username || messageData.Sender?.username || "Unknown",
            senderAvatar: messageData.Sender?.Avatar || messageData.Sender?.avatar || "",
            text: messageData.Text || messageData.text || "",
            createdAt: messageData.CreatedAt || new Date().toISOString(),
            type: "group",
            url: messageData.URL || undefined,
            fileName: messageData.FileName || undefined,
          };

          // Add message to chat store
          const chatStore = useChatStore.getState();
          chatStore.upsertMessageToChannel(String(chatMessage.channelId), chatMessage);

          // Dispatch custom event for components to listen to
          window.dispatchEvent(
            new CustomEvent("chat-message", {
              detail: { message: chatMessage, channelId: chatMessage.channelId },
            })
          );
        }

        // Dispatch ack events for join/leave to coordinate UI flows
        if (message.type === MessageType.CHANNEL_LEAVE) {
          const chanId = Number(message.data?.channel_id ?? message.data?.ChannelID ?? message.data?.channelId);
          if (!Number.isNaN(chanId)) {
            window.dispatchEvent(
              new CustomEvent("ws-channel-leave-ack", {
                detail: { channelId: chanId, userId: message.user_id },
              })
            );
          }
          return;
        }

        if (message.type === MessageType.CHANNEL_JOIN) {
          const chanId = Number(message.data?.channel_id ?? message.data?.ChannelID ?? message.data?.channelId);
          if (!Number.isNaN(chanId)) {
            window.dispatchEvent(
              new CustomEvent("ws-channel-join-ack", {
                detail: { channelId: chanId, userId: message.user_id },
              })
            );
          }
          return;
        }
      },

      // Attempt reconnection with exponential backoff
      attemptReconnect: () => {
        const { reconnectAttempts, config, userId } = get();

        if (reconnectAttempts >= config.maxReconnectAttempts) {
          set({ connectionState: ConnectionState.ERROR });
          return;
        }

        const newAttempts = reconnectAttempts + 1;
        set({ reconnectAttempts: newAttempts });

        // Add exponential backoff to prevent aggressive reconnection
        const delay = config.reconnectInterval * Math.pow(2, newAttempts - 1);

        const reconnectTimer = setTimeout(() => {
          // Only attempt reconnection if we're still disconnected
          if (get().connectionState === ConnectionState.DISCONNECTED) {
            console.log("TEST Reconnect attempt", userId);
            get()
              .connect(userId)
              .catch((error) => {
                console.error("Reconnection failed:", error);
                // Don't immediately retry, let the timer handle it
              });
          }
        }, delay);

        set({ reconnectTimer });
      },
    }),
    {
      name: "socket-store",
    }
  )
);
