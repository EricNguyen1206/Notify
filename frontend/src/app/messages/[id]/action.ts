"use client";

import { useScreenDimensions } from "@/hooks/useScreenDimensions";
import { useGetMessagesChannelId } from "@/services/endpoints/chats/chats";
import { ChatServiceInternalModelsChatResponse } from "@/services/schemas";
import { ChatMessage } from "@/services/simpleWebSocket";
import { useAuthStore } from "@/store/useAuthStore";
import { useChannelStore } from "@/store/useChannelStore";
import { Message, useChatStore } from "@/store/useChatStore";
import { useSocketStore } from "@/store/useSocketStore";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

// Hook for managing channel navigation and validation
export const useChannelNavigation = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { activeChannelId, groupChannels, directChannels, setCurrentChannel, setActiveChannel } = useChannelStore();

  const channelId = params.id ? Number(params.id) : undefined;

  useEffect(() => {
    if (!channelId) {
      router.replace("/messages");
      return;
    }

    if (activeChannelId !== channelId) {
      setActiveChannel(channelId);
      let chan = groupChannels.find((ch) => ch.id == channelId);
      if (!chan) {
        directChannels.find((ch) => ch.id == channelId);
      }
      setCurrentChannel(chan!);
    }
  }, [channelId, activeChannelId, groupChannels, directChannels, router]);

  return {
    channelId,
    activeChannelId,
  };
};

// Hook for managing chat data and messages
export const useChatData = (channelId: number | undefined) => {
  const { data: chatsData, isLoading: chatsLoading } = useGetMessagesChannelId(channelId ?? 0);
  const [optimisticChats, setOptimisticChats] = useState<Message[]>([]);
  const { addMessageToChannel, channels } = useChatStore();

  // Get messages from chat store for current channel
  const storeMessages = useMemo(() => (channelId ? channels[String(channelId)] || [] : []), [channels]);

  // Transform API data to Message format
  const chats: Message[] = [
    ...(Array.isArray(chatsData?.data.items)
      ? chatsData.data.items.map((chat: ChatServiceInternalModelsChatResponse) => chat as Message)
      : []),
    ...optimisticChats,
    ...storeMessages, // Include messages from WebSocket
  ] as Message[];

  return {
    chats,
    chatsLoading,
    optimisticChats,
    setOptimisticChats,
    addMessageToChannel,
  };
};

// Hook for managing scroll behavior
export const useScrollBehavior = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    mainRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollToBottomOnUpdate = () => {
    mainRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return {
    containerRef,
    mainRef,
    scrollToBottom,
    scrollToBottomOnUpdate,
  };
};

// Hook for managing form state and notifications
export const useFormState = () => {
  const [formData, setFormData] = useState<{ message: string }>({ message: "" });
  const [noti, setNoti] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // Show notification toast
  useEffect(() => {
    if (noti) {
      toast.warn(message);
      setMessage("");
      setNoti(false);
    }
  }, [noti, message]);

  // Clean up effect
  useEffect(() => {
    return () => {
      setFile(null);
      setFileName("");
      setFormData({ message: "" });
      setNoti(false);
      setMessage("");
    };
  }, []);

  return {
    formData,
    setFormData,
    noti,
    setNoti,
    message,
    setMessage,
    file,
    setFile,
    fileName,
    setFileName,
  };
};

// Hook for managing message sending (simplified - no typing indicators)
export const useMessageSending = (
  channelId: number | undefined,
  sessionUser: any,
  setFormData: (data: { message: string }) => void,
  scrollToBottom: () => void
) => {
  const { sendMessage, isConnected, error } = useSocketStore();

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (sessionUser?.id && message !== "" && channelId && isConnected()) {
        try {
          // Convert channelId to string for the new API
          sendMessage(String(channelId), message);
          setFormData({ message: "" });
          scrollToBottom();
        } catch (error) {
          console.error("Failed to send message:", error);
          toast.error("Failed to send message");
        }
      } else if (!isConnected()) {
        toast.warn("Not connected to chat server");
      }
    },
    [sessionUser?.id, channelId, isConnected, sendMessage, setFormData, scrollToBottom]
  );

  // Simplified typing handlers (no-op for now)
  const handleStartTyping = useCallback(() => {
    // Typing indicators removed for simplicity
  }, []);

  const handleStopTyping = useCallback(() => {
    // Typing indicators removed for simplicity
  }, []);

  // Show error notifications
  useEffect(() => {
    if (error) {
      toast.error(`WebSocket Error: ${error}`);
    }
  }, [error]);

  return {
    handleSendMessage,
    handleStartTyping,
    handleStopTyping,
    isTyping: false, // Always false since we removed typing indicators
    isConnected: isConnected(),
    error,
  };
};

// Hook for managing WebSocket connection and channel operations (simplified)
export const useWebSocketChannelManagement = () => {
  const { client, isConnected, connectionState, error, connect, disconnect, sendMessage } = useSocketStore();

  const { activeChannelId } = useChannelStore();

  // Simple connection management - no complex channel joining/leaving
  useEffect(() => {
    if (activeChannelId) {
      console.log("Active channel:", activeChannelId);
    }
  }, [activeChannelId]);

  return {
    client,
    isConnected: isConnected(),
    isConnecting: connectionState === "connecting",
    isReconnecting: false, // Simplified - no separate reconnecting state
    connectionState,
    isInCurrentChannel: true, // Simplified - always consider in current channel
    currentChannel: String(activeChannelId),
    typingUsers: [], // Simplified - no typing indicators
    error,
    sendMessage,
    connect,
    disconnect,
  };
};

// Hook for handling incoming WebSocket messages
export const useWebSocketMessageHandler = (channelId: number | undefined) => {
  const { upsertMessageToChannel } = useChatStore();

  useEffect(() => {
    const handleChatMessage = (event: CustomEvent<ChatMessage>) => {
      const chatMessage = event.detail;

      // Only process messages for the current channel
      if (channelId && chatMessage.channelId === channelId) {
        // Transform ChatMessage to Message format
        const message: Message = {
          id: chatMessage.id,
          channelId: chatMessage.channelId,
          senderId: chatMessage.senderId,
          senderName: chatMessage.senderName,
          senderAvatar: chatMessage.senderAvatar,
          text: chatMessage.text,
          createdAt: chatMessage.createdAt,
          type: chatMessage.type,
          url: chatMessage.url,
          fileName: chatMessage.fileName,
        };

        // Add message to chat store
        upsertMessageToChannel(String(channelId), message);
        console.log("Added incoming message to channel:", channelId, message);
      }
    };

    // Listen for chat messages from WebSocket
    window.addEventListener("chat-message", handleChatMessage as EventListener);

    return () => {
      window.removeEventListener("chat-message", handleChatMessage as EventListener);
    };
  }, [channelId, upsertMessageToChannel]);
};

// Main hook that combines all other hooks
export const useChatPage = () => {
  const sessionUser = useAuthStore((state) => state.user);
  const user = useAuthStore((state) => state.user);

  const { screenHeight, isOverFlow, updateOverflow } = useScreenDimensions(720);
  const { channelId, activeChannelId } = useChannelNavigation();
  const webSocketState = useWebSocketChannelManagement();
  const { chats, chatsLoading } = useChatData(channelId);
  const { containerRef, mainRef, scrollToBottom, scrollToBottomOnUpdate } = useScrollBehavior();
  const { formData, setFormData } = useFormState();
  const messageSending = useMessageSending(channelId, sessionUser, setFormData, scrollToBottom);

  // Handle incoming WebSocket messages
  useWebSocketMessageHandler(channelId);

  // Scroll effects
  useEffect(() => {
    if (chats !== undefined && chats?.length) {
      scrollToBottom();
    }
  }, [chats?.length, scrollToBottom]);

  useEffect(() => {
    scrollToBottomOnUpdate();
  }, [chats, scrollToBottomOnUpdate]);

  useEffect(() => {
    scrollToBottomOnUpdate();
  }, [chatsLoading, scrollToBottomOnUpdate]);

  return {
    // User data
    sessionUser,
    user,

    // Channel data
    channelId,
    activeChannelId,

    // Chat data
    chats,
    chatsLoading,

    // WebSocket state
    webSocketState,

    // Message sending
    ...messageSending,

    // Form state
    formData,
    setFormData,

    // Screen dimensions
    screenHeight,
    isOverFlow,
    updateOverflow,

    // Refs
    containerRef,
    mainRef,

    // Handlers (for backward compatibility)
    handleSendMessage: messageSending.handleSendMessage,
  };
};
