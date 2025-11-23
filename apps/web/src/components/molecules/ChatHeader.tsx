import { useState } from "react";
import { Users, Video, MoreHorizontal, Eye, Trash2, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import ViewMembersDialog from "./ViewMembersDialog";
import { useLeaveConversationMutation, useDeleteConversationMutation } from "@/services/api/conversations";
import { useRouter } from "next/navigation";
import { useConversationStore } from "@/store/useConversationStore";
import { useSocketStore } from "@/store/useSocketStore";
import { toast } from "react-toastify";

interface ChatHeaderProps {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  participantCount?: number;
  isOnline?: boolean;
  members?: Array<{
    id?: string;
    username?: string;
    email?: string;
    avatar?: string;
  }>;
  ownerId?: string;
  currentUserId?: string;
}

export default function ChatHeader(chat: ChatHeaderProps) {
  const [isViewMembersOpen, setIsViewMembersOpen] = useState(false);
  const router = useRouter();
  const { removeConversation } = useConversationStore();
  const { leaveConversation: leaveConversationFromSocket } = useSocketStore();

  const isOwner = chat.currentUserId === chat.ownerId;

  const leaveConversationMutation = useLeaveConversationMutation({
    onSuccess: () => {
      // Remove conversation from store
      const conversationType = chat.isGroup ? "group" : "direct";
      removeConversation(chat.id, conversationType);

      // Leave conversation from WebSocket
      try {
        leaveConversationFromSocket(chat.id);
      } catch (error) {
        // Error handled silently
      }

      // Show success message
      toast.success("Successfully left the conversation");

      // Redirect to messages page
      router.push("/messages");
    },
    onError: () => {
      toast.error("Failed to leave conversation. Please try again.");
    },
  });

  const deleteConversationMutation = useDeleteConversationMutation({
    onSuccess: () => {
      // Remove conversation from store
      const conversationType = chat.isGroup ? "group" : "direct";
      removeConversation(chat.id, conversationType);

      // Leave conversation from WebSocket (cleanup)
      try {
        leaveConversationFromSocket(chat.id);
      } catch (error) {
        // Error handled silently
      }

      // Show success message
      toast.success("Conversation deleted successfully");

      // Redirect to messages page
      router.push("/messages");
    },
    onError: () => {
      toast.error("Failed to delete conversation. Please try again.");
    },
  });

  const handleViewMembers = () => {
    setIsViewMembersOpen(true);
  };

  const handleDeleteConversation = () => {
    const conversationName = chat.name;
    const isGroup = chat.isGroup;

    const confirmMessage = isGroup
      ? `Are you sure you want to delete the group conversation "#${conversationName}"? This action cannot be undone and all members will lose access to this conversation.`
      : `Are you sure you want to delete the direct message with "${conversationName}"? This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      deleteConversationMutation.mutate(chat.id);
    }
  };

  const handleLeaveConversation = () => {
    if (confirm("Are you sure you want to leave this conversation?")) {
      leaveConversationMutation.mutate(chat.id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-chat-outer bg-background border-b border-t border-chat-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent focus:bg-transparent">
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-colors">
                <div>
                  <h2 className="font-medium text-foreground">{`#${chat.name}`}</h2>
                  {chat.isGroup ? (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span className="font-normal">{chat.participantCount} members</span>
                    </div>
                  ) : (
                    <p className="text-sm text-chat-accent font-normal">{chat.isOnline ? "Online" : "Offline"}</p>
                  )}
                </div>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={handleViewMembers}>
              <Eye className="mr-2 h-4 w-4" />
              <span>View members</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {isOwner ? (
              <DropdownMenuItem
                onClick={handleDeleteConversation}
                className="text-red-600 focus:text-red-600"
                disabled={deleteConversationMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{deleteConversationMutation.isPending ? "Deleting..." : "Delete conversation"}</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handleLeaveConversation}
                className="text-orange-600 focus:text-orange-600"
                disabled={leaveConversationMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{leaveConversationMutation.isPending ? "Leaving..." : "Leave conversation"}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-chat-accent/10 cursor-not-allowed">
                  <Video className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upcomming feature</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* View Members Dialog */}
      <ViewMembersDialog
        isOpen={isViewMembersOpen}
        onClose={() => setIsViewMembersOpen(false)}
        members={chat.members || []}
        channelName={chat.name}
      />
    </>
  );
}
