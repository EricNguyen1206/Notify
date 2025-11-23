"use client";

import { useCurrentUserQuery } from "@/services/api/users";
import { ClientProviders } from "./ClientProviders";

export function MessagesLayoutClient({ 
  accessToken,
  children 
}: { 
  accessToken: string | undefined;
  children: React.ReactNode;
}) {
  const { data: user, isLoading, error } = useCurrentUserQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !user || !user.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Unauthorized. Please log in.</p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">No access token. Please log in again.</p>
      </div>
    );
  }

  const userId = user.id;
  return (
    <ClientProviders userId={userId} accessToken={accessToken}>
      {children}
    </ClientProviders>
  );
}


