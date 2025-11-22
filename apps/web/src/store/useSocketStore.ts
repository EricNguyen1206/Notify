/**
 * Centralized Socket.IO store for chat functionality
 * Uses Socket.IO client with centralized message types from @notify/types
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { useConversationStore } from "./useConversationStore";
import {
  ConnectionState,
  SocketEvent,
  AuthenticatedPayload,
  JoinedConversationPayload,
  LeftConversationPayload,
  UserJoinedPayload,
  UserLeftPayload,
  ErrorPayload,
  createAuthenticatePayload,
  createJoinConversationPayload,
  createLeaveConversationPayload,
  createSendMessagePayload,
  ServerToClientEvents,
  ClientToServerEvents,
  MessageDto,
} from "@notify/types";

// Main socket store state interface
interface SocketState {
  // Connection state
  connectionState: ConnectionState;
  error: string | null;
  isConnecting: boolean;

  // Socket instance
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  userId: string;
  username: string;

  // Configuration
  url: string;

  // Actions
  connect: (userId: string, token: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (conversationId: string, text: string, url?: string, fileName?: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  isConnected: () => boolean;

  // Internal methods
  setupEventHandlers: () => void;
}

export const useSocketStore = create<SocketState>()(
  devtools(
    (set, get) => ({
      // Initial state
      connectionState: ConnectionState.DISCONNECTED,
      error: null,
      isConnecting: false,

      // Socket instance
      socket: null,
      userId: "",
      username: "",

      // Configuration
      url: "",

      // Connect to Socket.IO server
      connect: async (userId: string, token: string) => {
        const { socket, connectionState } = get();

        // Prevent multiple connection attempts
        if (connectionState === ConnectionState.CONNECTING) {
          throw new Error("Connection already in progress");
        }

        if (connectionState === ConnectionState.CONNECTED && socket?.connected) {
          return;
        }

        // Disconnect existing socket if any
        if (socket) {
          socket.disconnect();
        }

        try {
          set({
            connectionState: ConnectionState.CONNECTING,
            error: null,
            isConnecting: true,
            userId,
          });

          const baseUrl = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:8080";
          const url = baseUrl;

          set({ url });

          return new Promise<void>((resolve, reject) => {
            // Create Socket.IO client
            const socketInstance = io(url, {
              transports: ["websocket", "polling"],
              reconnection: true,
              reconnectionAttempts: 5,
              reconnectionDelay: 3000,
              timeout: 10000,
            });

            set({ socket: socketInstance });

            // Handle successful connection
            socketInstance.on(SocketEvent.CONNECT, () => {
              console.log("Socket.IO connected, authenticating...");
              
              // Authenticate with token
              const authPayload = createAuthenticatePayload(token);
              socketInstance.emit(SocketEvent.AUTHENTICATE, authPayload);
            });

            // Handle authentication success
            socketInstance.on(SocketEvent.AUTHENTICATED, (payload: AuthenticatedPayload) => {
              console.log("Authenticated successfully", payload);
              
              set({
                connectionState: ConnectionState.CONNECTED,
                isConnecting: false,
                username: payload.username,
              });

              // Setup event handlers after authentication
              get().setupEventHandlers();

              // Auto re-join previously joined conversations
              try {
                const conversationStore = useConversationStore.getState();
                const conversationsToRejoin = conversationStore.getJoinedConversations();
                
                if (conversationsToRejoin.length > 0) {
                  console.log("Re-joining conversations:", conversationsToRejoin);
                  conversationsToRejoin.forEach((conversationId) => {
                    get().joinConversation(conversationId);
                  });
                }
              } catch (err) {
                console.error("Auto re-join conversations failed:", err);
              }

              resolve();
            });

            // Handle connection errors
            socketInstance.on(SocketEvent.CONNECTION_ERROR, (error: any) => {
              console.error("Socket.IO connection error:", error);
              set({
                connectionState: ConnectionState.ERROR,
                error: error.message || "Connection failed",
                isConnecting: false,
              });
              reject(error);
            });

            // Handle disconnect
            socketInstance.on(SocketEvent.DISCONNECT, (reason: string) => {
              console.log("Socket.IO disconnected:", reason);
              set({
                connectionState: ConnectionState.DISCONNECTED,
                isConnecting: false,
              });

              // Auto-reconnect is handled by Socket.IO automatically
              // We just need to re-authenticate when reconnected
            });

            // Handle errors
            socketInstance.on(SocketEvent.ERROR, (payload: ErrorPayload) => {
              console.error("Socket.IO error:", payload);
              set({
                error: payload.message,
              });

              // If authentication failed, reject the connection promise
              if (payload.code === "AUTH_FAILED" || payload.code === "AUTH_ERROR") {
                set({
                  connectionState: ConnectionState.ERROR,
                  isConnecting: false,
                });
                reject(new Error(payload.message));
              }
            });

            // Timeout handling
            setTimeout(() => {
              if (get().connectionState === ConnectionState.CONNECTING) {
                socketInstance.disconnect();
                const timeoutError = new Error("Connection timeout");
                set({
                  connectionState: ConnectionState.ERROR,
                  error: "Connection timeout",
                  isConnecting: false,
                });
                reject(timeoutError);
              }
            }, 15000); // 15 second timeout for full auth flow
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

      // Setup event handlers for socket events
      setupEventHandlers: () => {
        const { socket } = get();
        if (!socket) return;

        // Handle new messages
        socket.on(SocketEvent.NEW_MESSAGE, (payload: MessageDto) => {
          console.log("New message received:", payload);

          // MessageDto is already in the right format, just dispatch the event
          // TODO: Add upsertMessageToConversation method to useChatStore
          // const chatStore = useChatStore.getState();
          // chatStore.upsertMessageToConversation(payload.conversationId, payload);

          // Dispatch custom event for components to listen to
          window.dispatchEvent(
            new CustomEvent("chat-message", {
              detail: { message: payload, conversationId: payload.conversationId },
            })
          );
        });

        // Handle joined conversation
        socket.on(SocketEvent.JOINED_CONVERSATION, (payload: JoinedConversationPayload) => {
          console.log("Joined conversation:", payload);
          
          window.dispatchEvent(
            new CustomEvent("ws-conversation-join-ack", {
              detail: { conversationId: payload.conversation_id, userId: payload.user_id },
            })
          );
        });

        // Handle left conversation
        socket.on(SocketEvent.LEFT_CONVERSATION, (payload: LeftConversationPayload) => {
          console.log("Left conversation:", payload);
          
          window.dispatchEvent(
            new CustomEvent("ws-conversation-leave-ack", {
              detail: { conversationId: payload.conversation_id, userId: payload.user_id },
            })
          );
        });

        // Handle user joined
        socket.on(SocketEvent.USER_JOINED, (payload: UserJoinedPayload) => {
          console.log("User joined conversation:", payload);
          
          window.dispatchEvent(
            new CustomEvent("ws-user-joined", {
              detail: payload,
            })
          );
        });

        // Handle user left
        socket.on(SocketEvent.USER_LEFT, (payload: UserLeftPayload) => {
          console.log("User left conversation:", payload);
          
          window.dispatchEvent(
            new CustomEvent("ws-user-left", {
              detail: payload,
            })
          );
        });
      },

      // Disconnect from Socket.IO server
      disconnect: () => {
        const { socket } = get();

        if (socket) {
          socket.disconnect();
        }

        set({
          connectionState: ConnectionState.DISCONNECTED,
          error: null,
          isConnecting: false,
          socket: null,
        });
      },

      // Send a message
      sendMessage: (conversationId: string, text: string, url?: string, fileName?: string) => {
        const { socket, connectionState } = get();
        
        if (!socket || connectionState !== ConnectionState.CONNECTED || !socket.connected) {
          throw new Error("Socket.IO not connected");
        }

        try {
          const payload = createSendMessagePayload(
            parseInt(conversationId),
            text || null,
            url || null,
            fileName || null
          );

          socket.emit(SocketEvent.SEND_MESSAGE, payload);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to send message" });
          throw error;
        }
      },

      // Join a conversation
      joinConversation: (conversationId: string) => {
        const { socket, connectionState } = get();
        
        if (!socket || connectionState !== ConnectionState.CONNECTED || !socket.connected) {
          throw new Error("Socket.IO not connected");
        }

        try {
          const payload = createJoinConversationPayload(parseInt(conversationId));
          socket.emit(SocketEvent.JOIN_CONVERSATION, payload);

          // Track joined conversation for automatic re-join on reconnect
          try {
            const conversationStore = useConversationStore.getState();
            conversationStore.addJoinedConversation(conversationId);
          } catch (err) {
            console.error("Failed to track joined conversation:", err);
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to join conversation" });
          throw error;
        }
      },

      // Leave a conversation
      leaveConversation: (conversationId: string) => {
        const { socket, connectionState } = get();
        
        if (!socket || connectionState !== ConnectionState.CONNECTED) {
          return; // Don't throw error on disconnect
        }

        try {
          const payload = createLeaveConversationPayload(parseInt(conversationId));
          socket.emit(SocketEvent.LEAVE_CONVERSATION, payload);

          // Untrack joined conversation so it isn't auto re-joined later
          try {
            const conversationStore = useConversationStore.getState();
            conversationStore.removeJoinedConversation(conversationId);
          } catch (err) {
            console.error("Failed to untrack joined conversation:", err);
          }
        } catch (error) {
          console.error("Failed to leave conversation:", error);
          // Don't set error for leave operations as they're not critical
        }
      },

      // Check if connected
      isConnected: () => {
        const { socket, connectionState } = get();
        return connectionState === ConnectionState.CONNECTED && socket?.connected === true;
      },
    }),
    {
      name: "socket-store",
    }
  )
);

// Export types for convenience
export { ConnectionState, SocketEvent };
