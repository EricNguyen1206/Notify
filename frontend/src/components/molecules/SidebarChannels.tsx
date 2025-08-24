"use client"

import { Hash, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import CreateNewChannelDialog from "../organisms/CreateNewChannelDialog"
import ChannelsSkeleton from "./ChannelsSkeleton"

export function SidebarChannels({
  items,
  loading
}: {
  items: any[],
  loading: boolean
}) {
  const [openCreateChannel, setOpenCreateChannel] = useState(false);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Channels</SidebarGroupLabel>
      <CreateNewChannelDialog
        openCreateChannel={openCreateChannel}
        setOpenCreateChannel={setOpenCreateChannel}
      >
        <SidebarGroupAction onClick={() => setOpenCreateChannel(true)}>
          <Plus /> <span className="sr-only">Add Channel</span>
        </SidebarGroupAction>
      </CreateNewChannelDialog>
      <SidebarMenu>
        {loading ? (
          <ChannelsSkeleton />
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
          )))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
