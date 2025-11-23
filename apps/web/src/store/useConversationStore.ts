import { ConversationDto } from '@notify/types';
import { create } from 'zustand';

// stores/conversationStore.ts
export interface ConversationState {
  // Existing state
  unreadCounts: Record<string, number>;
  activeConversationId: string | null;
  currentConversation: ConversationDto | null;
  groupConversations: ConversationDto[];
  directConversations: ConversationDto[];

  // New WebSocket conversation tracking state
  currentConversationId: string | null; // Track current WebSocket conversation (string for WebSocket API)
  joinedConversations: Set<string>; // Track all joined WebSocket conversations

  // Existing methods
  setUnreadCount: (conversationId: string, count: number) => void;
  setActiveConversation: (conversationId: string) => void;
  setCurrentConversation: (conversation: ConversationDto) => void;
  markAsRead: (conversationId: string) => void;
  setGroupConversations: (conversations: ConversationDto[]) => void;
  setDirectConversations: (conversations: ConversationDto[]) => void;
  addGroupConversation: (conversation: ConversationDto) => void;
  addDirectConversation: (conversation: ConversationDto) => void;
  removeConversation: (conversationId: string, type: 'group' | 'direct') => void;

  // New WebSocket conversation management methods
  setCurrentConversationId: (conversationId: string | null) => void;
  addJoinedConversation: (conversationId: string) => void;
  removeJoinedConversation: (conversationId: string) => void;
  clearJoinedConversations: () => void;

  // New computed functions
  getCurrentConversationId: () => string | null;
  isInConversation: (conversationId: string) => boolean;
  getJoinedConversations: () => string[];
  isCurrentConversation: (conversationId: string) => boolean;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  // Existing state
  unreadCounts: {},
  activeConversationId: null,
  currentConversation: null,
  groupConversations: [],
  directConversations: [],

  // New WebSocket conversation tracking state
  currentConversationId: null,
  joinedConversations: new Set<string>(),

  // Existing methods
  setUnreadCount: (conversationId, count) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: count },
    })),
  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  markAsRead: (conversationId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    })),
  setGroupConversations: (conversations: ConversationDto[]) =>
    set({ groupConversations: conversations }),
  setDirectConversations: (conversations: ConversationDto[]) =>
    set({ directConversations: conversations }),
  addGroupConversation: (conversation: ConversationDto) =>
    set((state) => ({
      groupConversations: [...state.groupConversations, conversation],
    })),
  addDirectConversation: (conversation: ConversationDto) =>
    set((state) => ({
      directConversations: [...state.directConversations, conversation],
    })),
  removeConversation: (conversationId: string, type: 'group' | 'direct') =>
    set((state) => ({
      groupConversations:
        type === 'group'
          ? state.groupConversations.filter((ch) => ch.id !== conversationId)
          : state.groupConversations,
      directConversations:
        type === 'direct'
          ? state.directConversations.filter((ch) => ch.id !== conversationId)
          : state.directConversations,
    })),

  // New WebSocket conversation management methods
  setCurrentConversationId: (conversationId: string | null) => {
    set({ currentConversationId: conversationId });
  },

  addJoinedConversation: (conversationId: string) => {
    set((state) => {
      const newJoinedConversations = new Set(state.joinedConversations);
      newJoinedConversations.add(conversationId);
      return { joinedConversations: newJoinedConversations };
    });
  },

  removeJoinedConversation: (conversationId: string) => {
    set((state) => {
      const newJoinedConversations = new Set(state.joinedConversations);
      newJoinedConversations.delete(conversationId);
      return {
        joinedConversations: newJoinedConversations,
        // Clear current conversation if we're leaving it
        currentConversationId:
          state.currentConversationId === conversationId ? null : state.currentConversationId,
      };
    });
  },

  clearJoinedConversations: () => {
    set({
      joinedConversations: new Set<string>(),
      currentConversationId: null,
    });
  },

  // New computed functions
  getCurrentConversationId: () => {
    return get().currentConversationId;
  },

  isInConversation: (conversationId: string) => {
    return get().joinedConversations.has(conversationId);
  },

  getJoinedConversations: () => {
    return Array.from(get().joinedConversations);
  },

  isCurrentConversation: (conversationId: string) => {
    return get().currentConversationId === conversationId;
  },
}));
