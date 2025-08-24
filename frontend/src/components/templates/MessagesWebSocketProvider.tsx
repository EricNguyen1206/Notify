"use client";

import { useWebSocketConnection } from "@/app/messages/action";

interface MessagesWebSocketProviderProps {
    userId: number;
    children: React.ReactNode;
}

export default function MessagesWebSocketProvider({ userId, children }: MessagesWebSocketProviderProps) {
    useWebSocketConnection(userId);

    return <>{children}</>;
}
