"use client";

import { memo, useEffect } from "react";
import { useSocketStore } from "@/store/useSocketStore";

interface MessagesWebSocketProviderProps {
  userId: number;
  children: React.ReactNode;
}

function MessagesWebSocketProvider({ userId, children }: MessagesWebSocketProviderProps) {
  const { connect, disconnect, isConnected, error, connectionState } = useSocketStore();

  // Establish WebSocket connection
  useEffect(() => {
    const userIdString = userId.toString();

    console.log("Establishing WebSocket connection for user:", userIdString);

    connect(userIdString).catch((error: any) => {
      console.error("Failed to establish WebSocket connection:", error);
    });

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up WebSocket connection");
      disconnect();
    };
  }, [userId, connect, disconnect]);

  // Log connection state changes for debugging
  useEffect(() => {
    console.log("WebSocket connection state changed:", connectionState);

    if (isConnected()) {
      console.log("✅ WebSocket connected successfully for user:", userId);
    } else if (error) {
      console.error("❌ WebSocket connection error for user:", userId, error);
    }
  }, [isConnected, error, connectionState, userId]);

  return <>{children}</>;
}

// Memoize the component to prevent unnecessary re-renders
export default memo(MessagesWebSocketProvider);
