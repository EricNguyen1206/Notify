"use client";

import { useScreenDimensions } from "@/hooks/useScreenDimensions";
import { useConversationMessagesQuery } from "@/services/api/messages";
import { useConversationQuery } from "@/services/api/conversations";
import { useCurrentUserQuery } from "@/services/api/users";
import { MessageResponse } from "@notify/types";
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
  const conversationId = params.id ?? undefined;

  // Memoize conversation lookup to avoid recomputation and noisy effects
  const resolvedConversation = useMemo(() => {
    if (!conversationId) return undefined;
    return groupConversations.find((conv) => conv.id === conversationId) || directConversations.find((conv) => conv.id === conversationId);
  }, [conversationId, groupConversations, directConversations]);

  // Avoid redundant setCurrentConversation calls across renders/StrictMode
  const lastSetConversationIdRef = useRef<string | undefined>(undefined);
  const lastRedirectedForIdRef = useRef<string | undefined>(undefined);

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
  const joinedConversationIdRef = useRef<string | undefined>(undefined);
  const pendingJoinConversationIdRef = useRef<string | undefined>(undefined);
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
      const detail = (e as CustomEvent).detail as { conversationId: string; userId?: string };
      const prevId = joinedConversationIdRef.current;
      if (!awaitingLeaveAckRef.current || !prevId) return;
      if (detail?.conversationId !== prevId) return;

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
export const useChatData = (conversationId: string | undefined) => {
  const { data: chatsData, isLoading: chatsLoading } = useConversationMessagesQuery(conversationId);
  const { addMessageToConversation, conversations } = useChatStore();

  const storeMessages = useMemo(() => (conversationId ? conversations[conversationId] || [] : []), [conversations, conversationId]);

  const apiMessages = useMemo(() => {
    if (!Array.isArray(chatsData?.data)) return [];

    return chatsData.data.map(
      (chat: MessageResponse): Message => ({
        id: String(chat.id ?? ""),
        conversationId: String(chat.conversationId ?? conversationId ?? ""),
        createdAt: chat.createdAt ? new Date(chat.createdAt).toISOString() : new Date().toISOString(),
        ...(chat.fileName !== undefined && { fileName: chat.fileName }),
        ...(chat.receiverId !== undefined && { receiverId: String(chat.receiverId) }),
        ...(chat.senderAvatar !== undefined && { senderAvatar: chat.senderAvatar }),
        senderId: String(chat.senderId ?? ""),
        ...(chat.senderName !== undefined && { senderName: chat.senderName }),
        ...(chat.text !== undefined && { text: chat.text }),
        ...(chat.type !== undefined && { type: chat.type }),
        ...(chat.url !== undefined && { url: chat.url }),
      })
    );
  }, [chatsData?.data, conversationId]);

  const chats: Message[] = [...apiMessages, ...storeMessages];

  return {
    chats,
    chatsLoading,
    addMessageToConversation,
  };
};

// Hook for getting conversation details including member count
export const useConversationDetails = (conversationId: string | undefined) => {
  const { data: conversationData, isLoading: conversationLoading } = useConversationQuery(conversationId, {
    enabled: Boolean(conversationId),
  });

  const memberCount = useMemo(() => {
    if (!conversationData?.members) return 0;
    return conversationData.members.length;
  }, [conversationData?.members]);

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
  conversationId: string | undefined,
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
          sendMessage(conversationId, message);
          setFormData({ message: "" });
          scrollToBottom();
        } catch (error) {
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
export const useWebSocketMessageHandler = (conversationId: string | undefined) => {
  const { upsertMessageToConversation } = useChatStore();

  useEffect(() => {
    const handleChatMessage = (event: CustomEvent<ChatMessage>) => {
      const chatMessage = event.detail;

      // Only process messages for the current conversation
      if (conversationId && String(chatMessage.conversationId) === String(conversationId)) {
        // Transform ChatMessage to Message format
        const message: Message = {
          id: String(chatMessage.id),
          conversationId: String(chatMessage.conversationId),
          senderId: String(chatMessage.senderId),
          ...(chatMessage.senderName !== undefined && { senderName: chatMessage.senderName }),
          ...(chatMessage.senderAvatar !== undefined && { senderAvatar: chatMessage.senderAvatar }),
          ...(chatMessage.text !== undefined && { text: chatMessage.text }),
          createdAt: chatMessage.createdAt,
          ...(chatMessage.type !== undefined && { type: chatMessage.type }),
          ...(chatMessage.url !== undefined && { url: chatMessage.url }),
          ...(chatMessage.fileName !== undefined && { fileName: chatMessage.fileName }),
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
  const { data: sessionUser } = useCurrentUserQuery();
  const { data: user } = useCurrentUserQuery();

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

    // Conversation data
    conversationId,
    currentConversation,
    conversationData,
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

    // Handlers
    handleSendMessage: messageSending.handleSendMessage,
  };
};
