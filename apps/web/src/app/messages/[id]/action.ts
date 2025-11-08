"use client";

import { useScreenDimensions } from "@/hooks/useScreenDimensions";
import { useGetMessagesChannelId } from "@/services/endpoints/chats/chats";
import { useGetChannelsId } from "@/services/endpoints/channels/channels";
import { ChatServiceInternalModelsChatResponse } from "@/services/schemas";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationStore } from "@/store/useConversationStore";
import { Message, useChatStore } from "@/store/useChatStore";
import { ChatMessage, ConnectionState, useSocketStore } from "@/store/useSocketStore";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

// Hook for managing conversation navigation and validation
export const useConversationNavigation = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { groupConversations, directConversations, currentConversation, setCurrentConversation } = useConversationStore();
  const { connectionState, joinConversation, leaveConversation } = useSocketStore();
  const conversationId = params.id ? Number(params.id) : undefined;

  // Memoize conversation lookup to avoid recomputation and noisy effects
  const resolvedConversation = useMemo(() => {
    if (!conversationId) return undefined;
    return groupConversations.find((conv) => conv.id == conversationId) || directConversations.find((conv) => conv.id == conversationId);
  }, [conversationId, groupConversations, directConversations]);

  // Avoid redundant setCurrentConversation calls across renders/StrictMode
  const lastSetConversationIdRef = useRef<number | undefined>(undefined);
  const lastRedirectedForIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!conversationId) return;

    if (!resolvedConversation) {
      // Redirect only once per conversationId that resolves to no conversation
      if (lastRedirectedForIdRef.current !== conversationId) {
        lastRedirectedForIdRef.current = conversationId;
        router.replace("/messages");
      }
      return;
    }

    // Only update store when conversation truly changes
    if (lastSetConversationIdRef.current !== resolvedConversation.id) {
      lastSetConversationIdRef.current = resolvedConversation.id;
      setCurrentConversation(resolvedConversation);
    }
  }, [conversationId, resolvedConversation, router, setCurrentConversation]);

  // Serialized leave -> ack -> join
  const joinedConversationIdRef = useRef<number | undefined>(undefined);
  const pendingJoinConversationIdRef = useRef<number | undefined>(undefined);
  const awaitingLeaveAckRef = useRef<boolean>(false);

  useEffect(() => {
    if (connectionState !== ConnectionState.CONNECTED) return;

    const nextId = currentConversation?.id;
    const prevId = joinedConversationIdRef.current;

    // If there is no change, do nothing
    if (prevId === nextId) return;

    // If switching conversations, send a single leave for the previous conversation
    if (prevId && prevId !== nextId && !awaitingLeaveAckRef.current) {
      try {
        awaitingLeaveAckRef.current = true;
        pendingJoinConversationIdRef.current = nextId;
        leaveConversation(String(prevId));
      } catch {}
      return; // wait for ack
    }

    // If there was no previous joined conversation (first join)
    if (!prevId && nextId && !awaitingLeaveAckRef.current) {
      try {
        joinConversation(String(nextId));
        joinedConversationIdRef.current = nextId;
      } catch {}
    }
  }, [connectionState, currentConversation?.id, joinConversation, leaveConversation]);

  // Listen for leave ack, then perform the pending join exactly once
  useEffect(() => {
    const handleLeaveAck = (e: Event) => {
      const detail = (e as CustomEvent).detail as { conversationId: number; userId?: string };
      const prevId = joinedConversationIdRef.current;
      if (!awaitingLeaveAckRef.current || !prevId) return;
      if (Number(detail?.conversationId) !== Number(prevId)) return;

      awaitingLeaveAckRef.current = false;
      joinedConversationIdRef.current = undefined;

      const nextId = pendingJoinConversationIdRef.current;
      pendingJoinConversationIdRef.current = undefined;
      if (connectionState === ConnectionState.CONNECTED && nextId) {
        try {
          joinConversation(String(nextId));
          joinedConversationIdRef.current = nextId;
        } catch {}
      }
    };

    window.addEventListener("ws-conversation-leave-ack", handleLeaveAck as EventListener);
    return () => window.removeEventListener("ws-conversation-leave-ack", handleLeaveAck as EventListener);
  }, [connectionState, joinConversation]);

  return {
    conversationId,
    currentConversation,
    connectionState,
  };
};

// Hook for managing chat data and messages
export const useChatData = (conversationId: number | undefined) => {
  const { data: chatsData, isLoading: chatsLoading } = useGetMessagesChannelId(conversationId ?? 0);
  const [optimisticChats, setOptimisticChats] = useState<Message[]>([]);
  const { addMessageToConversation, conversations } = useChatStore();

  // Get messages from chat store for current conversation
  const storeMessages = useMemo(() => (conversationId ? conversations[String(conversationId)] || [] : []), [conversations]);
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
    addMessageToConversation,
  };
};

// Hook for getting conversation details including member count
export const useConversationDetails = (conversationId: number | undefined) => {
  const { data: conversationData, isLoading: conversationLoading } = useGetChannelsId(conversationId ?? 0, {
    query: {
      enabled: !!conversationId,
    },
  });

  const memberCount = useMemo(() => {
    if (!conversationData?.data?.members) return 0;
    return conversationData.data.members.length;
  }, [conversationData?.data?.members]);

  return {
    conversationData,
    conversationLoading,
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
  conversationId: number | undefined,
  sessionUser: any,
  setFormData: (data: { message: string }) => void,
  scrollToBottom: () => void
) => {
  const { sendMessage, isConnected, error } = useSocketStore();

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (sessionUser?.id && message !== "" && conversationId && isConnected()) {
        try {
          // Convert conversationId to string for the new API
          sendMessage(String(conversationId), message);
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
    [sessionUser?.id, conversationId, isConnected, sendMessage, setFormData, scrollToBottom]
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
export const useWebSocketMessageHandler = (conversationId: number | undefined) => {
  const { upsertMessageToConversation } = useChatStore();

  useEffect(() => {
    const handleChatMessage = (event: CustomEvent<ChatMessage>) => {
      const chatMessage = event.detail;

      // Only process messages for the current conversation
      if (conversationId && chatMessage.conversationId === conversationId) {
        // Transform ChatMessage to Message format
        const message: Message = {
          id: chatMessage.id,
          conversationId: chatMessage.conversationId,
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
        upsertMessageToConversation(String(conversationId), message);
      }
    };

    // Listen for chat messages from WebSocket
    window.addEventListener("chat-message", handleChatMessage as EventListener);

    return () => {
      window.removeEventListener("chat-message", handleChatMessage as EventListener);
    };
  }, [conversationId, upsertMessageToConversation]);
};

// Main hook that combines all other hooks
export const useChatPage = () => {
  const sessionUser = useAuthStore((state) => state.user);
  const user = useAuthStore((state) => state.user);

  const { screenHeight, isOverFlow, updateOverflow } = useScreenDimensions(720);
  const { conversationId, currentConversation, connectionState } = useConversationNavigation();
  const { chats, chatsLoading } = useChatData(conversationId);
  const { conversationData, conversationLoading, memberCount } = useConversationDetails(conversationId);
  const { containerRef, mainRef, scrollToBottom, scrollToBottomOnUpdate } = useScrollBehavior();
  const { formData, setFormData } = useFormState();
  const messageSending = useMessageSending(conversationId, sessionUser, setFormData, scrollToBottom);

  // Handle incoming WebSocket messages
  useWebSocketMessageHandler(conversationId);

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

    // Conversation data (keeping channelId/currentChannel for backward compatibility with page component)
    channelId: conversationId,
    currentChannel: currentConversation,
    conversationId,
    currentConversation,
    channelData: conversationData,
    conversationData,
    channelLoading: conversationLoading,
    conversationLoading,
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
