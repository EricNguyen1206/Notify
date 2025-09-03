import { Phone, Users, Video } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface ChatHeaderProps {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  participantCount?: number;
  isOnline?: boolean;
}

export default function ChatHeader(chat: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-chat-outer bg-background border-b border-t border-chat-border">
      <div className="flex items-center space-x-3">
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
      </div>

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
  );
}
