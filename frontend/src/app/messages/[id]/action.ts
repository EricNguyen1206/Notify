"use client";

import { useScreenDimensions } from "@/hooks/useScreenDimensions";
import { useGetMessagesChannelId } from "@/services/endpoints/chats/chats";
import { ChatServiceInternalModelsChatResponse } from "@/services/schemas";
import { ConnectionState } from "@/services/websocket";
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
      let chan = groupChannels.find(ch => ch.id == channelId)
      if (!chan) {
        directChannels.find(ch => ch.id == channelId)
      }
      setCurrentChannel(chan!)
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
  const storeMessages = useMemo(() =>
    channelId ? channels[String(channelId)] || [] : [], [channels]
  );

  // Transform API data to Message format
  const chats: Message[] = [
    ...Array.isArray(chatsData?.data.items)
      ? chatsData.data.items.map((chat: ChatServiceInternalModelsChatResponse) => (chat as Message))
      : [],
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

// Hook for managing message sending with typing indicators
export const useMessageSending = (
  channelId: number | undefined,
  sessionUser: any,
  setFormData: (data: { message: string }) => void,
  scrollToBottom: () => void
) => {
  const { sendMessage, sendTypingIndicator, isConnected, error } = useSocketStore();
  const [isTyping, setIsTyping] = useState(false);

  // Handle sending messages
  const handleSendMessage = useCallback(async (message: string) => {
    if (sessionUser?.id && message !== "" && channelId && isConnected()) {
      try {
        // Convert channelId to string for the new API
        sendMessage(String(channelId), message);

        // Stop typing indicator when sending message
        if (isTyping) {
          sendTypingIndicator(String(channelId), false);
          setIsTyping(false);
        }

        setFormData({ message: "" });
        scrollToBottom();
      } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message');
      }
    } else if (!isConnected()) {
      toast.warn('Not connected to chat server');
    }
  }, [sessionUser?.id, channelId, isConnected, sendMessage, sendTypingIndicator, isTyping, setFormData, scrollToBottom]);

  // Handle typing indicators
  const handleStartTyping = useCallback(() => {
    if (channelId && isConnected() && !isTyping) {
      sendTypingIndicator(String(channelId), true);
      setIsTyping(true);
    }
  }, [channelId, isConnected, sendTypingIndicator, isTyping]);

  const handleStopTyping = useCallback(() => {
    if (channelId && isConnected() && isTyping) {
      sendTypingIndicator(String(channelId), false);
      setIsTyping(false);
    }
  }, [channelId, isConnected, sendTypingIndicator, isTyping]);

  // Auto-stop typing after 3 seconds of inactivity
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        handleStopTyping();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isTyping, handleStopTyping]);

  // Show error notifications
  useEffect(() => {
    if (error) {
      toast.error(`WebSocket Error: ${error.message}`);
    }
  }, [error]);

  return {
    handleSendMessage,
    handleStartTyping,
    handleStopTyping,
    isTyping,
    isConnected: isConnected(),
    error,
  };
};

// Hook for managing WebSocket connection and channel operations
export const useWebSocketChannelManagement = () => {
  const {
    client,
    isConnected,
    isConnecting,
    isReconnecting,
    connectionState,
    switchChannel,
    getTypingUsersInChannel,
    error
  } = useSocketStore();

  const { activeChannelId } = useChannelStore();

  // Get channel state from channel store
  const {
    getCurrentChannelId,
    isInChannel,
  } = useChannelStore();

  // Single ref to track the current processing state
  const processingRef = useRef<{
    lastActiveChannelId: number | null;
    lastConnectionState: boolean;
    isProcessing: boolean;
  }>({
    lastActiveChannelId: null,
    lastConnectionState: false,
    isProcessing: false
  });

  // Single effect to handle all channel switching logic
  useEffect(() => {
    const currentConnected = Boolean(client?.isConnected() && connectionState === ConnectionState.CONNECTED);
    const currentState = processingRef.current;

    console.log('Channel management effect triggered:', {
      activeChannelId,
      currentConnected,
      lastActiveChannelId: currentState.lastActiveChannelId,
      lastConnectionState: currentState.lastConnectionState,
      isProcessing: currentState.isProcessing
    });

    // Prevent concurrent processing
    if (currentState.isProcessing) {
      console.log('Already processing channel switch, skipping');
      return;
    }

    // Determine if we need to take action
    const channelChanged = currentState.lastActiveChannelId !== activeChannelId;
    const connectionEstablished = !currentState.lastConnectionState && currentConnected;
    const needsChannelSwitch = channelChanged || (connectionEstablished && activeChannelId);
    console.log('TEST 1 Channel changed:', channelChanged);
    if (!needsChannelSwitch) {
      // Update refs even if no action needed
      currentState.lastActiveChannelId = activeChannelId;
      currentState.lastConnectionState = currentConnected;
      return;
    }
    console.log("TEST 2", currentConnected)
    // Only proceed if connected
    if (!currentConnected) {
      console.log('Not connected, updating refs but skipping channel switch');
      currentState.lastActiveChannelId = activeChannelId;
      currentState.lastConnectionState = currentConnected;
      return;
    }
    console.log("TEST 3")

    // Mark as processing to prevent concurrent calls
    currentState.isProcessing = true;

    const targetChannelId = activeChannelId ? String(activeChannelId) : null;
    console.log('Executing single channel switch to:', targetChannelId);

    // Execute the channel switch
    switchChannel(targetChannelId);

    // Update refs and clear processing flag
    currentState.lastActiveChannelId = activeChannelId;
    currentState.lastConnectionState = currentConnected;
    currentState.isProcessing = false;

  }, [activeChannelId, client, connectionState, switchChannel]);

  // Separate cleanup effect for component unmount only
  useEffect(() => {
    return () => {
      // Only leave channel if we're navigating away from chat entirely
      // This cleanup runs when the component unmounts, not when channelId changes
      const currentChannel = getCurrentChannelId();
      if (currentChannel && isConnected()) {
        console.log('Component unmounting - leaving current channel:', currentChannel);
        // Don't use switchChannel here to avoid interference with normal switching
        // Just leave the current channel directly
        const { leaveChannel } = useSocketStore.getState();
        leaveChannel(currentChannel);
      }
    };
  }, []); // Empty dependency array - only runs on mount/unmount

  // Get typing users for current channel
  const typingUsers = activeChannelId ? getTypingUsersInChannel(String(activeChannelId)) : [];

  // Check if we're currently in the target channel
  const isInCurrentChannel = activeChannelId ? isInChannel(String(activeChannelId)) : false;

  return {
    client,
    isConnected: isConnected(),
    isConnecting: isConnecting(),
    isReconnecting: isReconnecting(),
    connectionState,
    isInCurrentChannel,
    currentChannel: getCurrentChannelId(),
    typingUsers,
    error,
  };
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
  const messageSending = useMessageSending(
    channelId,
    sessionUser,
    setFormData,
    scrollToBottom
  );

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
