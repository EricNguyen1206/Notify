import { Paperclip, Send, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  isConnected?: boolean;
  disabled?: boolean;
}

export default function MessageInput({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  isConnected = true,
  disabled = false,
}: MessageInputProps) {
  const messageRef = useRef<HTMLInputElement>(null);
  //   const [hasTyped, setHasTyped] = useState(false);

  const handleSend = () => {
    const messageValue = messageRef.current?.value || "";
    if (messageValue.trim() && isConnected && !disabled) {
      onSendMessage(messageValue.trim());
      if (messageRef.current) {
        messageRef.current.value = "";
      }
      //   setHasTyped(false);

      // // Stop typing indicator when sending
      // if (onStopTyping) {
      //     onStopTyping()
      // }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;

    // // Handle typing indicators
    // if (newMessage.length > 0 && !hasTyped && onStartTyping) {
    //   onStartTyping();
    //   setHasTyped(true);
    // } else if (newMessage.length === 0 && hasTyped && onStopTyping) {
    //   onStopTyping();
    //   setHasTyped(false);
    // }
  };

  //   // Auto-stop typing after 3 seconds of inactivity
  //   useEffect(() => {
  //     if (hasTyped && onStopTyping) {
  //       const timer = setTimeout(() => {
  //         onStopTyping();
  //         setHasTyped(false);
  //       }, 3000);

  //       return () => clearTimeout(timer);
  //     }
  //   }, [hasTyped, onStopTyping]);

  const getMessageValue = () => {
    return messageRef.current?.value || "";
  };

  return (
    <div className="p-chat-outer bg-background border-t border-chat-border">
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="mb-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-chat px-3 py-1 font-normal">
          Not connected to chat server
        </div>
      )}

      <div className="h-[40px] flex items-center space-x-3">
        <div className="flex-1 w-full">
          <div className="h-[40px] flex items-center space-x-2 bg-input-background border border-chat-border rounded-chat px-3 py-2 w-full focus-within:border-chat-primary transition-colors">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-chat-accent/10 cursor-not-allowed">
              <Paperclip className="w-4 h-4 text-muted-foreground" />
            </Button>
            <input
              type="text"
              ref={messageRef}
              placeholder={disabled ? "Chat disabled" : !isConnected ? "Connecting..." : "Type a message..."}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={disabled || !isConnected}
              className="flex-1 bg-transparent outline-none resize-none disabled:cursor-not-allowed disabled:text-gray-400 font-normal text-base"
            />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-chat-accent/10 cursor-not-allowed">
              <Smile className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={!getMessageValue().trim() || disabled || !isConnected}
          className="h-10 w-10 p-0 bg-chat-primary hover:bg-chat-secondary disabled:bg-gray-300 rounded-chat"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
