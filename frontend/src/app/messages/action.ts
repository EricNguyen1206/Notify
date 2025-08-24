import { useGetChannels } from "@/services/endpoints/channels/channels";
import { EnhancedChannel, useChannelStore } from "@/store/useChannelStore";
import { useSocketStore } from "@/store/useSocketStore";
import { useEffect, useMemo, useState } from "react";

/**
 * Hook for managing channel search functionality
 */
export const useChannelSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const clearSearch = () => setSearchQuery('');

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
  };
};

/**
 * Transforms API channel data to EnhancedChannel format
 */
const transformChannelData = (channels: any[], type: 'group' | 'direct'): EnhancedChannel[] => {
  return channels?.map((ch) => ({
    id: ch.id ?? 0,
    name: ch.name,
    ownerId: ch.ownerId,
    createdAt: new Date(),
    type: type,
    avatar: ch.avatar || "",
    lastActivity: new Date(),
    unreadCount: 0,
    members: [],
  } as EnhancedChannel)) ?? [];
};

/**
 * Hook for managing channel data fetching and transformation
 */
export const useChannelData = () => {
  const { setGroupChannels, setDirectChannels } = useChannelStore();

  // Fetch channels data
  const {
    data: channelsData,
    isLoading: isChannelsLoading,
    error: channelsError,
    refetch: refetchChannels
  } = useGetChannels();

  // Transform and set channel data when it changes
  useEffect(() => {
    if (channelsData?.data) {
      const groupChannels = transformChannelData(
        channelsData.data.group || [],
        'group'
      );
      const directChannels = transformChannelData(
        channelsData.data.direct || [],
        'direct'
      );

      setGroupChannels(groupChannels);
      setDirectChannels(directChannels);
    } else {
      setGroupChannels([]);
      setDirectChannels([]);
    }
  }, [channelsData, setGroupChannels, setDirectChannels]);

  return {
    isChannelsLoading,
    channelsError,
    refetchChannels,
  };
};

/**
 * Hook for filtering channels based on search query
 */
export const useChannelFiltering = (searchQuery: string) => {
  const { groupChannels, directChannels } = useChannelStore();

  const filteredChannels = useMemo(() =>
    groupChannels.filter(chan =>
      chan.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [groupChannels, searchQuery]
  );

  const filteredDirectMessages = useMemo(() =>
    directChannels.filter(chat =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [directChannels, searchQuery]
  );

  return {
    filteredChannels,
    filteredDirectMessages,
  };
};

/**
 * Hook for managing WebSocket connection
 * This ensures the connection is established only once
 */
export const useWebSocketConnection = (userId: number | null) => {
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    isReconnecting,
    connectionState,
    error,
    client
  } = useSocketStore();

  useEffect(() => {
    if (userId && !isConnected() && !isConnecting()) {
      // Convert userId to string for the new API
      connect(String(userId)).catch((err) => {
        console.error('Failed to connect WebSocket:', err);
      });
    }

    // Cleanup on unmount or when userId changes
    return () => {
      // Only disconnect if we're changing users, not on every render
      if (!userId) {
        disconnect();
      }
    };
  }, [userId, connect, disconnect, isConnected, isConnecting]);

  return {
    isConnected: isConnected(),
    isConnecting: isConnecting(),
    isReconnecting: isReconnecting(),
    connectionState,
    error,
    client,
  };
};

/**
 * Main hook that combines all sidebar functionality
 * This is the primary hook that components should use
 */
export const useSidebarActions = (userId?: number) => {
  // Search functionality
  const { searchQuery, setSearchQuery, clearSearch } = useChannelSearch();

  // Channel data management
  const { isChannelsLoading, channelsError, refetchChannels } = useChannelData();

  // Channel filtering
  const { filteredChannels, filteredDirectMessages } = useChannelFiltering(searchQuery);

  // WebSocket connection (optional - only if userId provided)
  const webSocketConnection = userId ? useWebSocketConnection(userId) : null;

  return {
    // Search
    searchQuery,
    setSearchQuery,
    clearSearch,

    // Channel data
    filteredChannels,
    filteredDirectMessages,
    isChannelsLoading,
    channelsError,
    refetchChannels,

    // WebSocket (if applicable)
    webSocketConnection,
  };
};

/**
 * Utility functions for channel operations
 */
export const channelUtils = {
  /**
   * Get channel by ID from store
   */
  getChannelById: (channelId: number): EnhancedChannel | null => {
    const { groupChannels, directChannels } = useChannelStore.getState();
    return [...groupChannels, ...directChannels].find(ch => ch.id === channelId) || null;
  },

  /**
   * Format channel name for display
   */
  formatChannelName: (channel: EnhancedChannel): string => {
    return channel.type === 'group' ? `#${channel.name}` : channel.name;
  },

  /**
   * Get unread count for a channel
   */
  getUnreadCount: (channelId: number): number => {
    const { unreadCounts } = useChannelStore.getState();
    return unreadCounts[channelId] || 0;
  },
};
