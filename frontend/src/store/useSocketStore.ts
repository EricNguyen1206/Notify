import { create } from "zustand";
import {
  ChannelMessageData,
  ErrorData,
  MemberJoinLeaveData,
  MessageType,
  MessageTypeValues,
  TypingIndicatorData,
  UserStatusData,
  WebSocketMessage,
  ConnectionState,
  TypeSafeWebSocketClient,
  WebSocketClientConfig,
  createWebSocketMessage,
  isChannelMessage,
  isTypingIndicator,
  isErrorMessage,
} from "../services/websocket";
import { useChannelStore } from "./useChannelStore";
import { useChatStore } from "./useChatStore";

// Enhanced WebSocket message interface for backward compatibility
export interface WsMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: MessageTypeValues;
  chatId: string;
}

// Typing indicator state
export interface TypingState {
  channelId: string;
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

// Enhanced Socket State with type-safe WebSocket client
interface SocketState {
  // WebSocket client instance
  client: TypeSafeWebSocketClient | null;

  // Connection state
  connectionState: ConnectionState;
  error: ErrorData | null;

  // Configuration
  config: WebSocketClientConfig;

  // Internal state for channel switching
  _channelSwitchState: {
    lastSwitchTime: number;
    pendingChannelId: string | null;
    isProcessing: boolean;
  };

  // Message data
  messages: WebSocketMessage[];
  typingUsers: Record<string, TypingState[]>; // channelId -> typing users

  // User data
  connectedUsers: Record<string, UserStatusData>; // userId -> status

  // Computed functions
  isConnected: () => boolean;
  isConnecting: () => boolean;
  isReconnecting: () => boolean;
  getTypingUsersInChannel: (channelId: string) => TypingState[];

  // Configuration actions
  updateConfig: (config: Partial<WebSocketClientConfig>) => void;

  // Connection actions
  connect: (userId: string) => Promise<void>;
  disconnect: () => void;

  // Channel actions
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  switchChannel: (newChannelId: string | null) => void; // Method for channel switching
  leaveAllChannels: () => void; // Method to leave all channels

  // Message actions
  sendMessage: (channelId: string, msg: string, url?: string, fileName?: string) => void;
  sendTypingIndicator: (channelId: string, isTyping: boolean) => void;

  // Internal event handlers
  setupEventListeners: () => void;
  clearTypingIndicator: (channelId: string, userId: string) => void;
}

// Default WebSocket configuration with improved backoff strategy
const DEFAULT_WS_CONFIG: WebSocketClientConfig = {
  reconnectAttempts: 8, // Increased from 5 to allow more attempts
  reconnectDelay: 1000,
  maxReconnectDelay: 60000, // Cap at 1 minute instead of 30 seconds
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  messageQueueLimit: 100,
  messageCacheSize: 1000,
  enableJitter: true,
};

// Global connection rate limiting
let lastGlobalConnectionAttempt = 0;
const GLOBAL_CONNECTION_RATE_LIMIT = 2000; // 2 seconds between any connection attempts

export const useSocketStore = create<SocketState>((set, get) => ({
  // Initial state
  client: null,
  connectionState: ConnectionState.DISCONNECTED,
  error: null,
  config: DEFAULT_WS_CONFIG,
  _channelSwitchState: {
    lastSwitchTime: 0,
    pendingChannelId: null,
    isProcessing: false,
  },
  messages: [],
  typingUsers: {},
  connectedUsers: {},

  // Computed functions
  isConnected: () => {
    const { client, connectionState } = get();
    console.log("TEST isConnected", connectionState, client?.isConnected());
    return connectionState === ConnectionState.CONNECTED && client?.isConnected() === true;
  },

  isConnecting: () => {
    return get().connectionState === ConnectionState.CONNECTING;
  },

  isReconnecting: () => {
    return get().connectionState === ConnectionState.RECONNECTING;
  },

  getTypingUsersInChannel: (channelId: string) => {
    return get().typingUsers[channelId] || [];
  },

  // Configuration actions
  updateConfig: (newConfig: Partial<WebSocketClientConfig>) => {
    set((state) => ({
      config: { ...state.config, ...newConfig },
    }));
  },

  // Connection actions
  connect: async (userId: string) => {
    const { client, isConnected, isConnecting, isReconnecting, config } = get();
    const now = Date.now();

    // Global rate limiting check
    if (now - lastGlobalConnectionAttempt < GLOBAL_CONNECTION_RATE_LIMIT) {
      const waitTime = GLOBAL_CONNECTION_RATE_LIMIT - (now - lastGlobalConnectionAttempt);
      console.log(`Global connection rate limited, waiting ${waitTime}ms`);
      return;
    }

    // Enhanced connection state validation
    if (isConnected() || isConnecting() || isReconnecting()) {
      console.log(`WebSocket connection attempt skipped - current state: ${get().connectionState}`);
      return;
    }

    // Only run on client side
    if (typeof window === "undefined") {
      console.log("Server side detected, skipping WebSocket connection");
      return;
    }

    // Update global rate limiting timestamp
    lastGlobalConnectionAttempt = now;

    // Clean up existing client if it exists and is not in a valid state
    if (client) {
      const clientConnected = client.isConnected();
      if (clientConnected) {
        console.log("Client already connected, skipping connection attempt");
        return;
      }
      console.log("Cleaning up existing client before creating new one");
      client.disconnect();
      set({ client: null, error: null });
    }

    try {
      const baseWsUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "ws://localhost:8080/api/v1";

      // If an existing client is present, attempt to reuse it based on its state
      if (client) {
        const state = client.getConnectionState();
        if (
          state === ConnectionState.CONNECTED ||
          state === ConnectionState.CONNECTING ||
          state === ConnectionState.RECONNECTING
        ) {
          console.log("Existing client is active or connecting; skipping new connection");
          return;
        }
        // For DISCONNECTED/ERROR, reuse the client instance and reconnect
        console.log("Reusing existing client instance; reconnecting...");
        set({ connectionState: ConnectionState.CONNECTING, error: null });
        get().setupEventListeners();
        await client.connect(`${baseWsUrl}/ws`, { userId });
        const clientState = client.getConnectionState();
        if (get().connectionState !== clientState) set({ connectionState: clientState });
        return;
      }

      console.log("Creating new TypeSafeWebSocketClient for userId:", userId);

      // Create new client with configuration
      const newClient = new TypeSafeWebSocketClient(config);

      // Update state with new client
      set({
        client: newClient,
        connectionState: ConnectionState.CONNECTING,
        error: null,
      });

      // Set up event listeners before connecting
      get().setupEventListeners();

      // Connect to WebSocket
      await newClient.connect(`${baseWsUrl}/ws`, { userId });

      // Manually sync state after connection attempt
      const clientState = newClient.getConnectionState();
      if (get().connectionState !== clientState) {
        console.log(`Syncing connection state: store=${get().connectionState} -> client=${clientState}`);
        set({ connectionState: clientState });
      }
    } catch (error) {
      console.error("Failed to create or connect WebSocket:", error);
      set({
        error: {
          code: "CONNECTION_FAILED",
          message: "Failed to create WebSocket connection",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        client: null,
        connectionState: ConnectionState.ERROR,
      });
    }
  },

  setupEventListeners: () => {
    const { client } = get();
    if (!client) return;

    // Set up event listeners using the proper WebSocketEventListeners interface
    client.setEventListeners({
      // Connection events
      onConnect: () => {
        set({ error: null, connectionState: ConnectionState.CONNECTED });
      },

      onDisconnect: () => {
        set({ connectionState: ConnectionState.DISCONNECTED });
      },

      onError: (error) => {
        set({
          error: {
            code: "WEBSOCKET_ERROR",
            message: "WebSocket connection error",
            details: error.toString(),
          },
          connectionState: ConnectionState.ERROR,
        });
      },

      onConnectionStateChange: (state) => {
        // Mirror client's internal connection state to the store to avoid duplicate connection attempts
        set({ connectionState: state });
      },

      // Message handling
      onMessage: (message: WebSocketMessage) => {
        set((state) => {
          const max = state.config.messageCacheSize ?? 1000;
          const next = [...state.messages, message];
          if (next.length > max) next.splice(0, next.length - max);
          return { messages: next };
        });
      },

      // Channel message handling
      onChannelMessage: (message: WebSocketMessage & { data: ChannelMessageData }) => {
        console.info("Channel message received:", message);

        const channelMessage = message.data;
        const activeChannelId = useChannelStore.getState().activeChannelId;

        // Transform and add to chat store if it's for the active channel
        if (activeChannelId && channelMessage.channel_id === activeChannelId.toString()) {
          const transformedMessage = {
            id: Number(message.id.split("-")[1]) || Date.now(), // Extract numeric ID or use timestamp
            channelId: Number(channelMessage.channel_id),
            createdAt: new Date(message.timestamp).toISOString(),
            senderId: Number(message.user_id),
            senderName: "Unknown", // Will need to be populated from user data
            senderAvatar: "",
            text: channelMessage.text || "",
            type: "channel",
            url: channelMessage.url || undefined,
            fileName: channelMessage.fileName || undefined,
          };

          useChatStore.getState().addMessageToChannel(channelMessage.channel_id.toString(), transformedMessage);
        }
      },

      // Typing indicator handling
      onTypingIndicator: (message: WebSocketMessage & { data: TypingIndicatorData }) => {
        const { channel_id, is_typing } = message.data;
        const userId = message.user_id;

        if (!userId) return; // Skip if no user ID

        if (is_typing) {
          // Add typing indicator
          set((state) => {
            const channelTyping = state.typingUsers[channel_id] || [];
            const existingIndex = channelTyping.findIndex((t) => t.userId === userId);

            const newTypingState: TypingState = {
              channelId: channel_id,
              userId,
              isTyping: true,
              timestamp: message.timestamp,
            };

            if (existingIndex >= 0) {
              channelTyping[existingIndex] = newTypingState;
            } else {
              channelTyping.push(newTypingState);
            }

            return {
              typingUsers: {
                ...state.typingUsers,
                [channel_id]: channelTyping,
              },
            };
          });
        } else {
          // Remove typing indicator
          get().clearTypingIndicator(channel_id, userId);
        }
      },

      // Member join/leave handling
      onMemberJoin: (message: WebSocketMessage & { data: MemberJoinLeaveData }) => {
        console.info("Member joined:", message.data);
        // Could update channel member list here
      },

      onMemberLeave: (message: WebSocketMessage & { data: MemberJoinLeaveData }) => {
        console.info("Member left:", message.data);
        // Could update channel member list here
      },

      // User status handling
      onUserStatus: (message: WebSocketMessage & { data: UserStatusData }) => {
        const userData = message.data;
        if (!message.user_id) return; // Skip if no user ID

        set((state) => ({
          connectedUsers: {
            ...state.connectedUsers,
            [message.user_id!]: userData,
          },
        }));
      },

      // User notification handling
      onUserNotification: (message: WebSocketMessage) => {
        console.info("User notification:", message.data);
        // Could trigger UI notifications here
      },
    });
  },

  // Message actions
  sendMessage: (channelId: string, msg: string, url?: string, fileName?: string) => {
    console.log("Sending message:", msg);
    const { client, isConnected } = get();

    if (!isConnected() || !channelId || !client) {
      console.log("Cannot send message: client not connected or invalid channelId");
      return;
    }

    try {
      client.sendChannelMessage(channelId, msg, url, fileName);
    } catch (error) {
      console.error("Error sending message:", error);
      set({
        error: {
          code: "SEND_MESSAGE_FAILED",
          message: "Failed to send message",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  },

  sendTypingIndicator: (channelId: string, isTyping: boolean) => {
    const { client, isConnected } = get();

    if (!isConnected() || !channelId || !client) {
      return;
    }

    try {
      client.sendTypingIndicator(channelId, isTyping);
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  },

  // Channel actions
  joinChannel: (channelId: string) => {
    const timestamp = Date.now();
    console.log(`[${timestamp}] joinChannel called for:`, channelId);

    const { client, isConnected } = get();
    const channelStore = useChannelStore.getState();

    if (!isConnected() || !channelId || !client) {
      console.log(`[${timestamp}] Cannot join channel: client not connected or invalid channelId`);
      return;
    }

    // Check if already in this channel using channel store
    if (channelStore.isInChannel(channelId)) {
      console.log(`[${timestamp}] Already in channel:`, channelId);
      return;
    }

    try {
      console.log(`[${timestamp}] Sending WebSocket join message for channel:`, channelId);
      client.joinChannel(channelId);

      // Update channel store to track joined channel
      console.log(`[${timestamp}] Updating channel store state for joined channel:`, channelId);
      channelStore.addJoinedChannel(channelId);
      channelStore.setCurrentChannelId(channelId);
      console.log(`[${timestamp}] Successfully joined channel:`, channelId);
    } catch (error) {
      console.error(`[${timestamp}] Error joining channel:`, error);
      set({
        error: {
          code: "JOIN_CHANNEL_FAILED",
          message: "Failed to join channel",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  },

  leaveChannel: (channelId: string) => {
    const timestamp = Date.now();
    console.log(`[${timestamp}] leaveChannel called for:`, channelId);

    const { client, isConnected } = get();
    const channelStore = useChannelStore.getState();

    if (!isConnected() || !channelId || !client) {
      console.log(`[${timestamp}] Cannot leave channel: client not connected or invalid channelId`);
      return;
    }

    // Check if actually in this channel using channel store
    if (!channelStore.isInChannel(channelId)) {
      console.log(`[${timestamp}] Not in channel:`, channelId);
      return;
    }

    try {
      console.log(`[${timestamp}] Sending WebSocket leave message for channel:`, channelId);
      client.sendMessage(MessageType.CHANNEL_LEAVE, { channel_id: channelId });

      // Update channel store to remove from joined channels
      console.log(`[${timestamp}] Updating channel store state for left channel:`, channelId);
      channelStore.removeJoinedChannel(channelId);

      // Clear typing indicators for this channel
      set((state) => {
        const newTypingUsers = { ...state.typingUsers };
        delete newTypingUsers[channelId];
        return { typingUsers: newTypingUsers };
      });

      console.log(`[${timestamp}] Successfully left channel:`, channelId);
    } catch (error) {
      console.error(`[${timestamp}] Error leaving channel:`, error);
      set({
        error: {
          code: "LEAVE_CHANNEL_FAILED",
          message: "Failed to leave channel",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  },

  // New method for proper channel switching with debouncing
  switchChannel: (newChannelId: string | null) => {
    const timestamp = Date.now();
    const state = get();
    const switchState = state._channelSwitchState;

    console.log(`[${timestamp}] switchChannel called with:`, newChannelId, {
      isProcessing: switchState.isProcessing,
      lastSwitchTime: switchState.lastSwitchTime,
      pendingChannelId: switchState.pendingChannelId,
    });

    // Enhanced debouncing with longer delay to prevent rapid switches
    const timeSinceLastSwitch = timestamp - switchState.lastSwitchTime;
    const debounceDelay = 200; // Increased from 100ms to 200ms

    if (switchState.isProcessing || timeSinceLastSwitch < debounceDelay) {
      console.log(
        `[${timestamp}] Debouncing channel switch (${timeSinceLastSwitch}ms since last, need ${debounceDelay}ms)`
      );

      // Update pending channel if it's different
      if (switchState.pendingChannelId !== newChannelId) {
        set((state) => ({
          _channelSwitchState: {
            ...state._channelSwitchState,
            pendingChannelId: newChannelId,
          },
        }));

        // Clear any existing pending timeout
        if (switchState.pendingChannelId !== null) {
          console.log(`[${timestamp}] Clearing previous pending switch`);
        }

        // Schedule the pending switch with longer delay
        setTimeout(() => {
          const currentState = get();
          const currentSwitchState = currentState._channelSwitchState;

          // Only execute if this is still the pending channel and we're not processing
          if (currentSwitchState.pendingChannelId === newChannelId && !currentSwitchState.isProcessing) {
            console.log(`[${Date.now()}] Executing pending channel switch to:`, newChannelId);
            get().switchChannel(newChannelId);
          } else {
            console.log(`[${Date.now()}] Skipping pending switch - state changed`);
          }
        }, debounceDelay + 50); // Additional buffer
      }
      return;
    }

    const channelStore = useChannelStore.getState();
    const currentChannelId = channelStore.getCurrentChannelId();

    if (!state.isConnected()) {
      console.log(`[${timestamp}] Cannot switch channel: not connected`);
      return;
    }

    // If switching to the same channel, do nothing
    if (currentChannelId === newChannelId) {
      console.log(`[${timestamp}] Already in target channel:`, newChannelId);
      return;
    }

    // Mark as processing and update state
    set(() => ({
      _channelSwitchState: {
        lastSwitchTime: timestamp,
        pendingChannelId: null,
        isProcessing: true,
      },
    }));

    console.log(`[${timestamp}] Executing channel switch from "${currentChannelId}" to "${newChannelId}"`);

    try {
      // Leave current channel if we're in one
      if (currentChannelId) {
        console.log(`[${timestamp}] Leaving current channel:`, currentChannelId);
        get().leaveChannel(currentChannelId);
      }

      // Join new channel if specified
      if (newChannelId) {
        console.log(`[${timestamp}] Joining new channel:`, newChannelId);
        get().joinChannel(newChannelId);
      } else {
        // Just update current channel to null if no new channel
        console.log(`[${timestamp}] Setting current channel to null`);
        channelStore.setCurrentChannelId(null);
      }

      console.log(`[${timestamp}] Channel switch completed successfully`);
    } catch (error) {
      console.error(`[${timestamp}] Error during channel switch:`, error);
    } finally {
      // Clear processing flag
      set((state) => ({
        _channelSwitchState: {
          ...state._channelSwitchState,
          isProcessing: false,
        },
      }));
    }
  },

  // New method to leave all channels (useful for disconnect)
  leaveAllChannels: () => {
    console.log("Leaving all channels");
    const channelStore = useChannelStore.getState();
    const joinedChannels = channelStore.getJoinedChannels();

    // Leave each joined channel
    joinedChannels.forEach((channelId: string) => {
      get().leaveChannel(channelId);
    });
  },

  disconnect: () => {
    const { client } = get();
    if (!client) return;

    console.log("Disconnecting WebSocket");

    // Prevent further auto-reconnects and tear down cleanly
    try {
      // Leave all channels before disconnecting
      get().leaveAllChannels();
    } catch {}

    // Clear channel store state
    try {
      const channelStore = useChannelStore.getState();
      channelStore.clearJoinedChannels();
    } catch {}

    client.disconnect();
    set({
      client: null,
      error: null,
      connectionState: ConnectionState.DISCONNECTED,
      messages: [],
      typingUsers: {},
      connectedUsers: {},
    });
  },

  // Utility functions
  clearTypingIndicator: (channelId: string, userId: string) => {
    set((state) => {
      const channelTyping = state.typingUsers[channelId] || [];
      const filteredTyping = channelTyping.filter((t) => t.userId !== userId);

      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: filteredTyping,
        },
      };
    });
  },
}));
