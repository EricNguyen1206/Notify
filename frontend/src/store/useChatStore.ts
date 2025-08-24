import { create } from 'zustand';


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
}

export const useChatStore = create<ChatState>((set) => ({
  channels: {},
  addMessageToChannel: (channelId: string, msg: Message) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [channelId]: [...(state.channels[channelId] || []), msg],
      },
    })),
}));
