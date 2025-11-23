'use client'

import MessagesWebSocketProvider from "./MessagesWebSocketProvider"

export function ClientProviders({ userId, accessToken, children }: { 
  userId: string | number;
  accessToken: string;
  children: React.ReactNode;
}) {
  return (
    <MessagesWebSocketProvider userId={userId} token={accessToken}>
      {children}
    </MessagesWebSocketProvider>
  )
}