"use client";

import { useWebSocketConnection } from "@/app/messages/action";
import { memo, useEffect } from "react";

interface MessagesWebSocketProviderProps {
  userId: number;
  children: React.ReactNode;
}

function MessagesWebSocketProvider({ userId, children }: MessagesWebSocketProviderProps) {
  // Always establish connection, but the useWebSocketConnection hook handles deduplication
  const connectionState = useWebSocketConnection(userId);

  // Log connection state changes for debugging
  useEffect(() => {
    if (connectionState.isConnected) {
      console.log("WebSocket connected for user:", userId);
    } else if (connectionState.error) {
      console.error("WebSocket connection error for user:", userId, connectionState.error);
    }
  }, [connectionState.isConnected, connectionState.error, userId]);

  return <>{children}</>;
}

// Memoize the component to prevent unnecessary re-renders
export default memo(MessagesWebSocketProvider);
