"use client";

import { useScreenDimensions } from "@/hooks/useScreenDimensions";
import { useGetMessagesChannelId } from "@/services/endpoints/chats/chats";
import { useGetChannelsId } from "@/services/endpoints/channels/channels";
import { ChatServiceInternalModelsChatResponse } from "@/services/schemas";
import { useAuthStore } from "@/store/useAuthStore";
import { useChannelStore } from "@/store/useChannelStore";
import { Message, useChatStore } from "@/store/useChatStore";
import { ChatMessage, ConnectionState, useSocketStore } from "@/store/useSocketStore";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

// Hook for managing channel navigation and validation
export const useChannelNavigation = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { groupChannels, directChannels, currentChannel, setCurrentChannel } = useChannelStore();
  const { connectionState, joinChannel, leaveChannel } = useSocketStore();
  const channelId = params.id ? Number(params.id) : undefined;

  // Memoize channel lookup to avoid recomputation and noisy effects
  const resolvedChannel = useMemo(() => {
    if (!channelId) return undefined;
    return groupChannels.find((ch) => ch.id == channelId) || directChannels.find((ch) => ch.id == channelId);
  }, [channelId, groupChannels, directChannels]);

  // Avoid redundant setCurrentChannel calls across renders/StrictMode
  const lastSetChannelIdRef = useRef<number | undefined>(undefined);
  const lastRedirectedForIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!channelId) return;

    if (!resolvedChannel) {
      // Redirect only once per channelId that resolves to no channel
      if (lastRedirectedForIdRef.current !== channelId) {
        lastRedirectedForIdRef.current = channelId;
        router.replace("/messages");
      }
      return;
    }

    // Only update store when channel truly changes
    if (lastSetChannelIdRef.current !== resolvedChannel.id) {
      lastSetChannelIdRef.current = resolvedChannel.id;
      setCurrentChannel(resolvedChannel);
    }
  }, [channelId, resolvedChannel, router, setCurrentChannel]);

  // Serialized leave -> ack -> join
  const joinedChannelIdRef = useRef<number | undefined>(undefined);
  const pendingJoinChannelIdRef = useRef<number | undefined>(undefined);
  const awaitingLeaveAckRef = useRef<boolean>(false);

  useEffect(() => {
    if (connectionState !== ConnectionState.CONNECTED) return;

    const nextId = currentChannel?.id;
    const prevId = joinedChannelIdRef.current;

    // If there is no change, do nothing
    if (prevId === nextId) return;

    // If switching channels, send a single leave for the previous channel
    if (prevId && prevId !== nextId && !awaitingLeaveAckRef.current) {
      try {
        awaitingLeaveAckRef.current = true;
        pendingJoinChannelIdRef.current = nextId;
        leaveChannel(String(prevId));
      } catch {}
      return; // wait for ack
    }

    // If there was no previous joined channel (first join)
    if (!prevId && nextId && !awaitingLeaveAckRef.current) {
      try {
        joinChannel(String(nextId));
        joinedChannelIdRef.current = nextId;
      } catch {}
    }
  }, [connectionState, currentChannel?.id, joinChannel, leaveChannel]);

  // Listen for leave ack, then perform the pending join exactly once
  useEffect(() => {
    const handleLeaveAck = (e: Event) => {
      const detail = (e as CustomEvent).detail as { channelId: number; userId?: string };
      const prevId = joinedChannelIdRef.current;
      if (!awaitingLeaveAckRef.current || !prevId) return;
      if (Number(detail?.channelId) !== Number(prevId)) return;

      awaitingLeaveAckRef.current = false;
      joinedChannelIdRef.current = undefined;

      const nextId = pendingJoinChannelIdRef.current;
      pendingJoinChannelIdRef.current = undefined;
      if (connectionState === ConnectionState.CONNECTED && nextId) {
        try {
          joinChannel(String(nextId));
          joinedChannelIdRef.current = nextId;
        } catch {}
      }
    };

    window.addEventListener("ws-channel-leave-ack", handleLeaveAck as EventListener);
    return () => window.removeEventListener("ws-channel-leave-ack", handleLeaveAck as EventListener);
  }, [connectionState, joinChannel]);

  return {
    channelId,
    currentChannel,
    connectionState,
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
    // ...optimisticChats,
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

// Hook for getting channel details including member count
export const useChannelDetails = (channelId: number | undefined) => {
  const { data: channelData, isLoading: channelLoading } = useGetChannelsId(channelId ?? 0, {
    query: {
      enabled: !!channelId,
    },
  });

  const memberCount = useMemo(() => {
    if (!channelData?.data?.members) return 0;
    return channelData.data.members.length;
  }, [channelData?.data?.members]);

  return {
    channelData,
    channelLoading,
    memberCount,
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

  // Show error notifications
  useEffect(() => {
    if (error) {
      toast.error(`WebSocket Error: ${error}`);
    }
  }, [error]);

  return {
    handleSendMessage,
    isConnected: isConnected(),
    error,
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
  const { channelId, currentChannel, connectionState } = useChannelNavigation();
  const { chats, chatsLoading } = useChatData(channelId);
  const { channelData, channelLoading, memberCount } = useChannelDetails(channelId);
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
    currentChannel,
    channelData,
    channelLoading,
    memberCount,

    // Chat data
    chats,
    chatsLoading,

    // WebSocket state
    connectionState,

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
