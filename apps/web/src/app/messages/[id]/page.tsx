"use client";

import ChatHeader from "@/components/molecules/ChatHeader";
import MessageBubble from "@/components/molecules/MessageBubble";
import MessagesSkeleton from "@/components/molecules/MessagesSkeleton";
import MessageInput from "@/components/organisms/MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatPage } from "./action";
import { ConnectionState } from "@/store/useSocketStore";

const DirectMessagesPage = () => {
  const {
    user,
    channelId,
    currentChannel,
    channelData,
    memberCount,
    containerRef,
    mainRef,
    chats,
    chatsLoading,
    handleSendMessage,
    isConnected,
    connectionState,
  } = useChatPage();

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <ChatHeader
        id={String(channelId)}
        name={String(currentChannel?.name)}
        isGroup={currentChannel?.type === "group"}
        avatar={currentChannel?.avatar ?? ""}
        participantCount={memberCount}
        members={channelData?.data?.members}
        ownerId={channelData?.data?.ownerId}
        currentUserId={user?.id}
      />

      {/* Connection status indicator */}
      {connectionState === ConnectionState.CONNECTING && (
        <div className="px-5 py-2 bg-blue-50 border-b border-blue-200">
          <div className="text-sm text-blue-600">Connecting to chat server...</div>
        </div>
      )}

      {connectionState === ConnectionState.ERROR && (
        <div className="px-chat-outer py-2 bg-red-50 border-b border-red-200">
          <div className="text-sm text-chat-error font-normal">Connection error</div>
        </div>
      )}

      <ScrollArea ref={containerRef} className="flex-1 p-chat-outer">
        {chatsLoading ? (
          <MessagesSkeleton isGroup={true} />
        ) : (
          <div className="space-y-0">
            {user?.id &&
              chats.map((message) => (
                <MessageBubble key={message.id} message={message} isGroup={true} userId={user.id} />
              ))}
            <div ref={mainRef} className="h-0" />
          </div>
        )}
      </ScrollArea>

      <MessageInput
        onSendMessage={handleSendMessage}
        // onStartTyping={handleStartTyping}
        // onStopTyping={handleStopTyping}
        isConnected={isConnected}
        disabled={connectionState === ConnectionState.ERROR}
      />
    </div>
  );
};

export default DirectMessagesPage;
