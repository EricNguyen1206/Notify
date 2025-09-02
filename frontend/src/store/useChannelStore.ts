import { UserType } from "@/types";
import { create } from "zustand";

export interface EnhancedChannel {
  id: number;
  name: string;
  ownerId: number;
  type: "group" | "direct";
  avatar: string;
  lastActivity: Date;
  unreadCount: number;
  members?: UserType[]; // load lazy khi cần
}

// stores/channelStore.ts
export interface ChannelState {
  // Existing state
  unreadCounts: Record<number, number>;
  activeChannelId: number | null;
  currentChannel: EnhancedChannel | null;
  groupChannels: EnhancedChannel[];
  directChannels: EnhancedChannel[];

  // New WebSocket channel tracking state
  currentChannelId: string | null; // Track current WebSocket channel (string for WebSocket API)
  joinedChannels: Set<string>; // Track all joined WebSocket channels

  // Existing methods
  setUnreadCount: (channelId: number, count: number) => void;
  setActiveChannel: (channelId: number) => void;
  setCurrentChannel: (channel: EnhancedChannel) => void;
  markAsRead: (channelId: number) => void;
  setGroupChannels: (channels: EnhancedChannel[]) => void;
  setDirectChannels: (channels: EnhancedChannel[]) => void;
  addGroupChannel: (channel: EnhancedChannel) => void;
  addDirectChannel: (channel: EnhancedChannel) => void;
  removeChannel: (channelId: number, type: "group" | "direct") => void;

  // New WebSocket channel management methods
  setCurrentChannelId: (channelId: string | null) => void;
  addJoinedChannel: (channelId: string) => void;
  removeJoinedChannel: (channelId: string) => void;
  clearJoinedChannels: () => void;

  // New computed functions
  getCurrentChannelId: () => string | null;
  isInChannel: (channelId: string) => boolean;
  getJoinedChannels: () => string[];
  isCurrentChannel: (channelId: string) => boolean;
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  // Existing state
  unreadCounts: {},
  activeChannelId: null,
  currentChannel: null,
  groupChannels: [],
  directChannels: [],

  // New WebSocket channel tracking state
  currentChannelId: null,
  joinedChannels: new Set<string>(),

  // Existing methods
  setUnreadCount: (channelId, count) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [channelId]: count },
    })),
  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  markAsRead: (channelId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [channelId]: 0 },
    })),
  setGroupChannels: (channels: EnhancedChannel[]) => set({ groupChannels: channels }),
  setDirectChannels: (channels: EnhancedChannel[]) => set({ directChannels: channels }),
  addGroupChannel: (channel: EnhancedChannel) =>
    set((state) => ({
      groupChannels: [...state.groupChannels, channel],
    })),
  addDirectChannel: (channel: EnhancedChannel) =>
    set((state) => ({
      directChannels: [...state.directChannels, channel],
    })),
  removeChannel: (channelId: number, type: "group" | "direct") =>
    set((state) => ({
      groupChannels: type === "group" ? state.groupChannels.filter((ch) => ch.id !== channelId) : state.groupChannels,
      directChannels:
        type === "direct" ? state.directChannels.filter((ch) => ch.id !== channelId) : state.directChannels,
    })),

  // New WebSocket channel management methods
  setCurrentChannelId: (channelId: string | null) => {
    set({ currentChannelId: channelId });
  },

  addJoinedChannel: (channelId: string) => {
    set((state) => {
      const newJoinedChannels = new Set(state.joinedChannels);
      newJoinedChannels.add(channelId);
      return { joinedChannels: newJoinedChannels };
    });
  },

  removeJoinedChannel: (channelId: string) => {
    set((state) => {
      const newJoinedChannels = new Set(state.joinedChannels);
      newJoinedChannels.delete(channelId);
      return {
        joinedChannels: newJoinedChannels,
        // Clear current channel if we're leaving it
        currentChannelId: state.currentChannelId === channelId ? null : state.currentChannelId,
      };
    });
  },

  clearJoinedChannels: () => {
    set({
      joinedChannels: new Set<string>(),
      currentChannelId: null,
    });
  },

  // New computed functions
  getCurrentChannelId: () => {
    return get().currentChannelId;
  },

  isInChannel: (channelId: string) => {
    return get().joinedChannels.has(channelId);
  },

  getJoinedChannels: () => {
    return Array.from(get().joinedChannels);
  },

  isCurrentChannel: (channelId: string) => {
    return get().currentChannelId === channelId;
  },
}));
