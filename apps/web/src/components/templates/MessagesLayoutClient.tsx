"use client";

import { useCurrentUserQuery } from "@/services/api/users";
import { ClientProviders } from "./ClientProviders";

export function MessagesLayoutClient({ children }: { children: React.ReactNode }) {
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

  return (
    <ClientProviders userId={user.id}>
      {children}
    </ClientProviders>
  );
}


