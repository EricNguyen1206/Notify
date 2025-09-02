"use client";

import { memo, useEffect, useRef } from "react";
import { useSocketStore } from "@/store/useSocketStore";

interface MessagesWebSocketProviderProps {
  userId: number;
  children: React.ReactNode;
}

function MessagesWebSocketProvider({ userId, children }: MessagesWebSocketProviderProps) {
  const { connect, disconnect, isConnected } = useSocketStore();
  const hasConnected = useRef(false);

  // Establish WebSocket connection only once when component mounts
  useEffect(() => {
    const userIdString = userId.toString();

    console.log("TEST Establishing WebSocket connection for user:", userIdString);

    // Only connect if we haven't connected yet and we're not already connected
    if (!hasConnected.current && !isConnected()) {
      hasConnected.current = true;
      connect(userIdString).catch((error: any) => {
        console.error("Failed to establish WebSocket connection:", error);
        // Reset the flag on error so we can try again if needed
        hasConnected.current = false;
      });
    }

    // Cleanup on unmount
    return () => {
      console.log("TEST Cleaning up WebSocket connection");
      hasConnected.current = false;
      disconnect();
    };
  }, [userId]); // Only depend on userId, not connectionState

  return <>{children}</>;
}

// Memoize the component to prevent unnecessary re-renders
export default memo(MessagesWebSocketProvider);
