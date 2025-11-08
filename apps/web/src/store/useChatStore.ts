import { create } from "zustand";

export interface Message {
  id: number;
  /** channel */
  channelId: number;
  /** timestamp of when the message was created */
  createdAt: string;
  /** optional file name for media */
  fileName?: string;
  /** Relate to type message */
  receiverId?: number;
  /** url string for avatar */
  senderAvatar?: string;
  /** ID of the user who sent the message */
  senderId: number;
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
  channels: Record<string, Message[]>;
  addMessageToChannel: (channelId: string, msg: Message) => void;
  upsertMessageToChannel: (channelId: string, msg: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  channels: {},

  addMessageToChannel: (channelId: string, msg: Message) => {
    if (msg.senderId) {
      set((state) => ({
        channels: {
          ...state.channels,
          [channelId]: [...(state.channels[channelId] || []), msg],
        },
      }));
    }
  },
  // Insert new or replace near-duplicate (optimistic) messages to prevent duplicates
  upsertMessageToChannel: (channelId: string, msg: Message) => {
    if (msg.senderId) {
      set((state) => {
        const list = state.channels[channelId] || [];
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
          channels: {
            ...state.channels,
            [channelId]: next,
          },
        };
      });
    }
  },
}));
