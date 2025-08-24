"use client";

import { useSidebarActions } from "@/app/messages/action";
import { Separator } from "@radix-ui/react-context-menu";
import { Search } from "lucide-react";
import NavUser from "../molecules/NavUser";
import { SidebarChannels } from "../molecules/SidebarChannels";
import SidebarDirectMessages from "../molecules/SidebarDirectMessages";
import { Input } from "../ui/input";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "../ui/sidebar";

const AppSidebar = () => {
  // Use centralized business logic from actions
  const {
    searchQuery,
    setSearchQuery,
    filteredChannels,
    filteredDirectMessages,
    isChannelsLoading,
  } = useSidebarActions();

  return (
    <Sidebar className="border-chat-border">
      {/* Search Section*/}
      <SidebarHeader className="p-chat-outer">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-chat-border rounded-chat focus:border-chat-primary transition-colors"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-chat-gutter">
        {/* Channels Section */}
        <SidebarChannels items={filteredChannels} loading={isChannelsLoading} />

        <Separator className="mx-4 bg-chat-border" />

        {/* Direct Messages Section */}
        <SidebarDirectMessages items={filteredDirectMessages} loading={isChannelsLoading} />
      </SidebarContent>

      {/* User Profile Section */}
      <SidebarFooter className="p-chat-outer border-t border-chat-border">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
