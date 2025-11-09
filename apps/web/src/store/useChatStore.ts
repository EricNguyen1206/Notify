import { create } from "zustand";

export interface Message {
  id: string;
  /** conversation */
  conversationId: string;
  /** timestamp of when the message was created */
  createdAt: string;
  /** optional file name for media */
  fileName?: string;
  /** Relate to type message */
  receiverId?: string;
  /** url string for avatar */
  senderAvatar?: string;
  /** ID of the user who sent the message */
  senderId: string;
  /** Username of the sender */
  senderName?: string;
  /** free text message */
  text?: string;
  /** "direct" | "group" */
  type?: string;
  /** optional URL for media */
  url?: string;
}

export interface ChatState {
  conversations: Record<string, Message[]>;
  addMessageToConversation: (conversationId: string, msg: Message) => void;
  upsertMessageToConversation: (conversationId: string, msg: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: {},

  addMessageToConversation: (conversationId: string, msg: Message) => {
    if (msg.senderId) {
      set((state) => ({
        conversations: {
          ...state.conversations,
          [conversationId]: [...(state.conversations[conversationId] || []), msg],
        },
      }));
    }
  },
  // Insert new or replace near-duplicate (optimistic) messages to prevent duplicates
  upsertMessageToConversation: (conversationId: string, msg: Message) => {
    if (msg.senderId) {
      set((state) => {
        const list = state.conversations[conversationId] || [];
        const incomingTime = new Date(msg.createdAt).getTime();

        // Find exact id match first
        let idx = list.findIndex((m) => m.id === msg.id);

        // If not found, try to match optimistic messages by sender + text within 5s window
        if (idx === -1 && msg.text) {
          idx = list.findIndex(
            (m) =>
              m.senderId === msg.senderId &&
              m.text === msg.text &&
              Math.abs(new Date(m.createdAt).getTime() - incomingTime) < 5000
          );
        }

        let next: Message[];
        if (idx >= 0) {
          next = [...list];
          next[idx] = msg;
        } else {
          next = [...list, msg];
        }

        return {
          conversations: {
            ...state.conversations,
            [conversationId]: next,
          },
        };
      });
    }
  },
}));
