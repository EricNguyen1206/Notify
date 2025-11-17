/**
 * Centralized WebSocket store for chat functionality
 * All WebSocket logic is handled directly in this hook for simplicity and maintainability
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useChatStore } from "./useChatStore";
import { useConversationStore } from "./useConversationStore";

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
  CONVERSATION_JOIN = "conversation.join",
  CONVERSATION_LEAVE = "conversation.leave",
  CONVERSATION_MESSAGE = "conversation.message",
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

export interface ConversationMessageData {
  conversation_id: string;
  text?: string | null;
  url?: string | null;
  fileName?: string | null;
}

export interface ConversationJoinLeaveData {
  conversation_id: string;
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
  conversationId: number;
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
  sendMessage: (conversationId: string, text: string, url?: string, fileName?: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
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
                  // Failed to parse WebSocket message
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
      sendMessage: (conversationId: string, text: string, url?: string, fileName?: string) => {
        const { ws, connectionState } = get();
        if (!ws || connectionState !== ConnectionState.CONNECTED || ws.readyState !== WebSocket.OPEN) {
          throw new Error("WebSocket not connected");
        }

        try {
          const message: WebSocketMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: MessageType.CONVERSATION_MESSAGE,
            data: {
              conversation_id: conversationId,
              text,
              url: url || null,
              fileName: fileName || null,
            } as ConversationMessageData,
            timestamp: Date.now(),
            user_id: get().userId,
          };

          ws.send(JSON.stringify(message));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to send message" });
          throw error;
        }
      },

      // Join a conversation
      joinConversation: (conversationId: string) => {
        const { ws, connectionState } = get();
        if (!ws || connectionState !== ConnectionState.CONNECTED || ws.readyState !== WebSocket.OPEN) {
          throw new Error("WebSocket not connected");
        }

        try {
          const message: WebSocketMessage = {
            id: `join-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: MessageType.CONVERSATION_JOIN,
            data: { conversation_id: conversationId },
            timestamp: Date.now(),
            user_id: get().userId,
          };

          ws.send(JSON.stringify(message));

          // Track joined conversation for automatic re-join on reconnect
          try {
            const conversationStore = useConversationStore.getState();
            conversationStore.addJoinedConversation(conversationId);
          } catch {}
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to join conversation" });
          throw error;
        }
      },

      // Leave a conversation
      leaveConversation: (conversationId: string) => {
        const { ws, connectionState } = get();
        if (!ws || connectionState !== ConnectionState.CONNECTED) {
          return; // Don't throw error on disconnect
        }

        try {
          const message: WebSocketMessage = {
            id: `leave-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: MessageType.CONVERSATION_LEAVE,
            data: { conversation_id: conversationId },
            timestamp: Date.now(),
            user_id: get().userId,
          };

          ws.send(JSON.stringify(message));

          // Untrack joined conversation so it isn't auto re-joined later
          try {
            const conversationStore = useConversationStore.getState();
            conversationStore.removeJoinedConversation(conversationId);
          } catch {}
        } catch (error) {
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

          // After reconnect, automatically re-join previously joined conversations
          try {
            const conversationStore = useConversationStore.getState();
            const conversationsToRejoin = conversationStore.getJoinedConversations();
            if (conversationsToRejoin.length > 0) {
              const { ws } = get();
              if (ws && ws.readyState === WebSocket.OPEN) {
                conversationsToRejoin.forEach((conversationId) => {
                  const joinMsg: WebSocketMessage = {
                    id: `rejoin-${conversationId}-${Date.now()}`,
                    type: MessageType.CONVERSATION_JOIN,
                    data: { conversation_id: conversationId },
                    timestamp: Date.now(),
                    user_id: get().userId,
                  };
                  try {
                    ws.send(JSON.stringify(joinMsg));
                  } catch (err) {
                    // Failed to auto re-join conversation
                  }
                });
              }
            }
          } catch (err) {
            // Auto re-join conversations failed
          }
          return;
        }

        // Handle error messages
        if (message.type === MessageType.ERROR) {
          set({ error: (message.data as ErrorData).message });
          return;
        }

        // Handle conversation messages
        if (message.type === MessageType.CONVERSATION_MESSAGE) {
          const messageData = message.data;

          if (!messageData) {
            return;
          }

          const chatMessage: ChatMessage = {
            id: messageData.id,
            conversationId: messageData.ConversationID || messageData.conversationId,
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
          chatStore.upsertMessageToConversation(String(chatMessage.conversationId), chatMessage);

          // Dispatch custom event for components to listen to
          window.dispatchEvent(
            new CustomEvent("chat-message", {
              detail: { message: chatMessage, conversationId: chatMessage.conversationId },
            })
          );
        }

        // Dispatch ack events for join/leave to coordinate UI flows
        if (message.type === MessageType.CONVERSATION_LEAVE) {
          const convId = Number(message.data?.conversation_id ?? message.data?.ConversationID ?? message.data?.conversationId);
          if (!Number.isNaN(convId)) {
            window.dispatchEvent(
              new CustomEvent("ws-conversation-leave-ack", {
                detail: { conversationId: convId, userId: message.user_id },
              })
            );
          }
          return;
        }

        if (message.type === MessageType.CONVERSATION_JOIN) {
          const convId = Number(message.data?.conversation_id ?? message.data?.ConversationID ?? message.data?.conversationId);
          if (!Number.isNaN(convId)) {
            window.dispatchEvent(
              new CustomEvent("ws-conversation-join-ack", {
                detail: { conversationId: convId, userId: message.user_id },
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
            get()
              .connect(userId)
              .catch(() => {
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
