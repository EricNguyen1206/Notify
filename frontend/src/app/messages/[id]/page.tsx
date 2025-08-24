"use client";

import ChatHeader from "@/components/molecules/ChatHeader";
import MessageBubble from "@/components/molecules/MessageBubble";
import MessagesSkeleton from "@/components/molecules/MessagesSkeleton";
import MessageInput from "@/components/organisms/MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConnectionState } from "@/services/wsMutator";
import { useChatPage } from "./action";

const DirectMessagesPage = () => {
    const {
        user,
        channelId,
        containerRef,
        mainRef,
        chats,
        chatsLoading,
        handleSendMessage,
        handleStartTyping,
        handleStopTyping,
        isConnected,
        webSocketState,
    } = useChatPage();

    // Get connection status for UI feedback
    const connectionStatus = webSocketState?.connectionState;
    const typingUsers = webSocketState?.typingUsers || [];

    return (
        <div className="w-full h-full flex flex-col bg-background">
            <ChatHeader
                id={String(channelId)}
                name={String(channelId)}
                isGroup={true}
                avatar=""
                participantCount={10}
            />

            {/* Connection status indicator */}
            {connectionStatus === ConnectionState.CONNECTING && (
                <div className="px-5 py-2 bg-blue-50 border-b border-blue-200">
                    <div className="text-sm text-blue-600">Connecting to chat server...</div>
                </div>
            )}

            {connectionStatus === ConnectionState.RECONNECTING && (
                <div className="px-5 py-2 bg-amber-50 border-b border-amber-200">
                    <div className="text-sm text-amber-600">Reconnecting to chat server...</div>
                </div>
            )}

            {connectionStatus === ConnectionState.ERROR && webSocketState?.error && (
                <div className="px-chat-outer py-2 bg-red-50 border-b border-red-200">
                    <div className="text-sm text-chat-error font-normal">
                        Connection error: {webSocketState.error.message}
                    </div>
                </div>
            )}

            <ScrollArea ref={containerRef} className="flex-1 p-chat-outer">
                {chatsLoading ? (
                    <MessagesSkeleton isGroup={true} />
                ) : (
                    <div className="space-y-0">
                        {user?.id && chats.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isGroup={true}
                                userId={user.id}
                            />
                        ))}

                        {/* Typing indicators */}
                        {typingUsers.length > 0 && (
                            <div className="flex items-center space-x-2 py-2 px-4 text-sm text-muted-foreground">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-chat-accent rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-chat-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-chat-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="font-normal">
                                    {typingUsers.length === 1
                                        ? `${typingUsers[0].userId} is typing...`
                                        : `${typingUsers.length} people are typing...`
                                    }
                                </span>
                            </div>
                        )}

                        {/* Invisible element to scroll to */}
                        <div ref={mainRef} className="h-0" />
                    </div>)}
            </ScrollArea>

            <MessageInput
                onSendMessage={handleSendMessage}
                onStartTyping={handleStartTyping}
                onStopTyping={handleStopTyping}
                isConnected={isConnected}
                disabled={connectionStatus === ConnectionState.ERROR}
            />
        </div>
    );
};

export default DirectMessagesPage;
