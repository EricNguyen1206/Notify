"use client";

import { Hash, Plus, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import CreateNewConversationDialog from "../organisms/CreateNewConversationDialog";
import ConversationsSkeleton from "./ConversationsSkeleton";

export function SidebarConversations({ items, loading }: { items: any[]; loading: boolean }) {
  const [openCreateConversation, setOpenCreateConversation] = useState(false);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Conversations</SidebarGroupLabel>
      <div className="flex gap-1">
        <CreateNewConversationDialog openCreateConversation={openCreateConversation} setOpenCreateConversation={setOpenCreateConversation}>
          <SidebarGroupAction onClick={() => setOpenCreateConversation(true)}>
            <Plus /> <span className="sr-only">Add Conversation</span>
          </SidebarGroupAction>
        </CreateNewConversationDialog>
      </div>

      <SidebarMenu>
        {loading ? (
          <ConversationsSkeleton />
        ) : (
          items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton tooltip={item.name}>
                <Hash />
                <Link href={`/messages/${item.id}`}>
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

