import { EnhancedChannel } from "@/store/useChannelStore";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { SidebarGroup, SidebarGroupAction, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from "../ui/sidebar";
import ChannelsSkeleton from "./ChannelsSkeleton";
import CreateNewDirectMessageDialog from "../organisms/CreateNewDirectMessageDialog";
import { useState } from "react";

type SidebarDirectMessagesProps = {
  items: EnhancedChannel[];
  loading: boolean;
};

const SidebarDirectMessages = ({ items, loading }: SidebarDirectMessagesProps) => {
  const [openDirectMessage, setOpenDirectMessage] = useState(false);

  // Helper function to extract username from email-based channel name
  const getDisplayName = (channelName: string) => {
    // If channel name looks like an email, extract username part
    if (channelName.includes("@")) {
      return channelName.split("@")[0];
    }
    return channelName;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Direct Messages</SidebarGroupLabel>
      <div className="flex gap-1">
        <CreateNewDirectMessageDialog openDirectMessage={openDirectMessage} setOpenDirectMessage={setOpenDirectMessage}>
          <SidebarGroupAction onClick={() => setOpenDirectMessage(true)}>
            <Plus /> <span className="sr-only">Direct Message</span>
          </SidebarGroupAction>
        </CreateNewDirectMessageDialog>
      </div>
      <SidebarMenu>
        {loading ? (
          <ChannelsSkeleton />
        ) : (
          items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <Link
                href={`/messages/${item.id}`}
                className="flex items-center cursor-pointer transition-colors rounded-md p-2 mb-1"
              >
                <div className="relative mr-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback color="#8B5CF6">
                      {getDisplayName(item.name)
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground text-sm truncate">{getDisplayName(item.name)}</h4>
                  </div>
                </div>
              </Link>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default SidebarDirectMessages;
