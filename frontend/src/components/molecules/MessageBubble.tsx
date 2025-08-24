import { Message } from "@/store/useChatStore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function MessageBubble({ message, isGroup, userId }: { message: Message; isGroup: boolean, userId: number }) {
  if (message.senderId == userId) {
    // Sent messages (right side)
    return (
      <div className="flex justify-end mb-chat-gutter">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-chat-primary text-white rounded-chat px-4 py-2">
            <p className="break-words font-normal">{message.text}</p>
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-500 font-normal">{new Date(message.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    )
  }

  // Received messages (left side)
  return (
    <div className="flex items-start mb-chat-gutter">
      {isGroup && (
        <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback className="bg-chat-primary text-white">{message.senderName?.[0]?.toUpperCase() ?? 'A'}</AvatarFallback>
        </Avatar>
      )}
      <div className="max-w-xs lg:max-w-md">
        {isGroup && (
          <p className="text-sm font-medium text-foreground mb-1">{message.senderName ?? "Sender"}</p>
        )}
        <div className="bg-card border border-chat-border rounded-chat px-4 py-2">
          <p className="text-card-foreground break-words font-normal">{message.text}</p>
        </div>
        <div className="flex justify-start mt-1">
          <span className="text-xs text-gray-500 font-normal">{new Date(message.createdAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
