/**
 * Simplified WebSocket store for chat functionality
 * Focuses only on essential features: connection management and message handling
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { SimpleWebSocketClient, ConnectionState } from "../services/simpleWsClient";
import { WebSocketMessage } from "../services/types/wsTypes";
import { useChatStore } from "./useChatStore";

// Simple socket store state
interface SimpleSocketState {
  // Connection state
  connectionState: ConnectionState;
  error: string | null;
  client: SimpleWebSocketClient | null;

  // Actions
  connect: (userId: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (channelId: string, text: string) => void;
  isConnected: () => boolean;

  // Event handlers
  setupEventListeners: () => void;
}

export const useSocketStore = create<SimpleSocketState>()(
  devtools(
    (set, get) => ({
      // Initial state
      connectionState: ConnectionState.DISCONNECTED,
      error: null,
      client: null,

      // Connect to WebSocket
      connect: async (userId: string) => {
        const { client } = get();

        try {
          set({ connectionState: ConnectionState.CONNECTING, error: null });

          const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost";

          // Create new client if none exists
          let wsClient = client;
          if (!wsClient) {
            wsClient = new SimpleWebSocketClient({
              reconnectInterval: 3000,
              maxReconnectAttempts: 5,
              connectionTimeout: 10000,
            });
            set({ client: wsClient });
          }

          // Setup event listeners
          get().setupEventListeners();

          // Connect to WebSocket
          await wsClient.connect(`${baseWsUrl}/ws`, { userId });

          // Update state after successful connection
          const clientState = wsClient.getConnectionState();
          set({ connectionState: clientState });
        } catch (error) {
          console.error("Failed to connect to WebSocket:", error);
          set({
            connectionState: ConnectionState.ERROR,
            error: error instanceof Error ? error.message : "Connection failed",
          });
          throw error;
        }
      },

      // Disconnect from WebSocket
      disconnect: () => {
        const { client } = get();
        if (client) {
          client.disconnect();
        }
        set({
          connectionState: ConnectionState.DISCONNECTED,
          error: null,
        });
      },

      // Send a message
      sendMessage: (channelId: string, text: string) => {
        const { client } = get();
        if (!client || !get().isConnected()) {
          throw new Error("WebSocket not connected");
        }

        try {
          client.sendMessage(channelId, text);
        } catch (error) {
          console.error("Failed to send message:", error);
          set({ error: error instanceof Error ? error.message : "Failed to send message" });
          throw error;
        }
      },

      // Check if connected
      isConnected: () => {
        const { client, connectionState } = get();
        return connectionState === ConnectionState.CONNECTED && client?.isConnected() === true;
      },

      // Setup event listeners for the WebSocket client
      setupEventListeners: () => {
        const { client } = get();
        if (!client) return;

        client.setEventHandlers({
          onConnect: () => {
            console.log("WebSocket connected");
            set({ connectionState: ConnectionState.CONNECTED, error: null });
          },

          onDisconnect: () => {
            console.log("WebSocket disconnected");
            set({ connectionState: ConnectionState.DISCONNECTED });
          },

          onError: (error) => {
            console.error("WebSocket error:", error);
            set({
              connectionState: ConnectionState.ERROR,
              error: error instanceof Error ? error.message : "WebSocket error",
            });
          },

          onMessage: (message: WebSocketMessage) => {
            console.log("Received WebSocket message:", message);
            // Handle generic messages if needed
          },

          onChannelMessage: (message: WebSocketMessage & { data: any }) => {
            console.log("Received channel message:", message);

            // Extract message data
            const messageData = message.data;

            // Basic validation
            if (!messageData || typeof messageData.ID !== "number") {
              console.error("Invalid channel message data:", messageData);
              return;
            }

            // Transform to chat message format
            const chatMessage = {
              id: messageData.ID,
              channelId: messageData.channelId || messageData.ChannelID,
              senderId: messageData.senderId || messageData.SenderID,
              senderName: messageData.Sender?.username || messageData.Sender?.Username || "Unknown",
              senderAvatar: messageData.Sender?.avatar || messageData.Sender?.Avatar || "",
              text: messageData.text || messageData.Text || "",
              createdAt: messageData.CreatedAt || new Date().toISOString(),
              type: "group",
            };

            console.log("Processed chat message:", chatMessage);

            // Add message to chat store
            const chatStore = useChatStore.getState();
            chatStore.upsertMessageToChannel(String(chatMessage.channelId), chatMessage);

            // Dispatch custom event for components to listen to
            window.dispatchEvent(
              new CustomEvent("chat-message", {
                detail: { message: chatMessage, channelId: chatMessage.channelId },
              })
            );
          },
        });
      },
    }),
    {
      name: "simple-socket-store",
    }
  )
);

// Helper function to get connection status
export const getConnectionStatus = () => {
  const store = useSocketStore.getState();
  return {
    state: store.connectionState,
    isConnected: store.isConnected(),
    error: store.error,
  };
};

// Helper function for testing
export const testConnection = async (userId: string = "3") => {
  const store = useSocketStore.getState();

  try {
    // Disconnect if already connected
    if (store.client) {
      store.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Connect
    await store.connect(userId);
    console.log("✅ Connection test successful!");

    return true;
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    return false;
  }
};

// Make test function available globally for browser console
if (typeof window !== "undefined") {
  (window as any).testSimpleConnection = testConnection;
  (window as any).getSimpleConnectionStatus = getConnectionStatus;
}
