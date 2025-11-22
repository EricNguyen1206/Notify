import { ConversationResponse, MessageResponse } from '@notify/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ChatState {
  conversations: ConversationResponse[];
  messages: Record<
    string,
    {
      items: MessageResponse[];
      hasMore: boolean; // infinite scroll
      nextCursor: string | null;
    }
  >;
  activeConversationId: string | null;
  loading: boolean;

  reset: () => void;
  setActiveConversation: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      loading: false,
      reset: () =>
        set({ conversations: [], messages: {}, activeConversationId: null, loading: false }),
      setActiveConversation: (conversationId: string) =>
        set({ activeConversationId: conversationId }),
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        // INFO: Do Not store message for security reason
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
