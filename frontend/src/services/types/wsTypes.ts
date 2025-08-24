// Re-export as MessageType for backward compatibility and cleaner API
export enum MessageType {
  CONNECT = 'connection.connect',
  DISCONNECT = 'connection.disconnect',
  PING = 'connection.ping',
  PONG = 'connection.pong',
  CHANNEL_JOIN = 'channel.join',
  CHANNEL_LEAVE = 'channel.leave',
  CHANNEL_MESSAGE = 'channel.message',
  CHANNEL_TYPING = 'channel.typing',
  CHANNEL_STOP_TYPING = 'channel.stop_typing',
  MEMBER_JOIN = 'channel.member.join',
  MEMBER_LEAVE = 'channel.member.leave',
  USER_STATUS = 'user.status',
  USER_NOTIFICATION = 'user.notification',
  ERROR = 'error',
}

// Keep the original enum for backward compatibility
export const WsMessageType = MessageType;

// Base message interface that all WebSocket messages follow
export interface WsBaseMessage<T = unknown> {
  id: string;
  type: MessageType;
  data: T;
  timestamp: number;
  user_id: string;
}

// Message wrapper types for different directions
export interface ClientMessage<T = unknown> extends WsBaseMessage<T> {}
export interface ServerMessage<T = unknown> extends WsBaseMessage<T> {}

// Channel-related data interfaces
export interface ChannelJoinData {
  channel_id: string;
}

export interface ChannelLeaveData {
  channel_id: string;
}

export interface ChannelMessageData {
  channel_id: string;
  text: string;
  url?: string | null;
  fileName?: string | null;
}

export interface ChannelMessageDataReceived {
    Channel: any;
    Receiver: any; // Assuming Receiver can be null
    Sender: {
        avatar: string;
        created_at: string;
        deleted_at: null | string;
        email: string;
        id: number;
        name: string;
        updated_at: string;
    };
    channelId: number;
    created_at: string; // ISO 8601 string
    deleted_at: null | string; // Assuming deleted_at can be a string or null
    id: number;
    receiverId: null | number; // Assuming receiverId can be null
    senderId: number;
    text: string;
    updated_at: string; // ISO 8601 string
};

// Typing indicator data
export interface TypingIndicatorData {
  channel_id: string;
  is_typing: boolean;
}

// Member join/leave data
export interface MemberJoinLeaveData {
  channel_id: string;
  user_id: string;
  username: string;
  avatar?: string;
}

// User status data
export interface UserStatusData {
  user_id: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  last_seen?: number;
}

// User notification data
export interface UserNotificationData {
  type: 'message' | 'mention' | 'system' | 'channel_invite';
  title: string;
  message: string;
  channel_id?: string;
  sender_id?: string;
  sender_name?: string;
  action_url?: string;
}

// Error data
export interface ErrorData {
  code: string;
  message: string;
  details?: string;
  field?: string;
}

// Connection data (for connect/disconnect events)
export interface ConnectionData {
  user_id: string;
  session_id?: string;
  timestamp: number;
}

// Ping/Pong data (usually empty but can contain metadata)
export interface PingPongData {
  timestamp?: number;
  server_time?: number;
}

// Specific message types for type safety
export type ConnectMessage = WsBaseMessage<ConnectionData>;
export type DisconnectMessage = WsBaseMessage<ConnectionData>;
export type PingMessage = WsBaseMessage<PingPongData>;
export type PongMessage = WsBaseMessage<PingPongData>;
export type ChannelJoinMessage = WsBaseMessage<ChannelJoinData>;
export type ChannelLeaveMessage = WsBaseMessage<ChannelLeaveData>;
export type ChannelMessageMessage = WsBaseMessage<ChannelMessageData>;
export type ChannelMessageReceivedMessage = WsBaseMessage<ChannelMessageDataReceived>;
export type TypingIndicatorMessage = WsBaseMessage<TypingIndicatorData>;
export type MemberJoinMessage = WsBaseMessage<MemberJoinLeaveData>;
export type MemberLeaveMessage = WsBaseMessage<MemberJoinLeaveData>;
export type UserStatusMessage = WsBaseMessage<UserStatusData>;
export type UserNotificationMessage = WsBaseMessage<UserNotificationData>;
export type ErrorMessage = WsBaseMessage<ErrorData>;

// Union type for all possible WebSocket messages
export type WebSocketMessage =
  | ConnectMessage
  | DisconnectMessage
  | PingMessage
  | PongMessage
  | ChannelJoinMessage
  | ChannelLeaveMessage
  | ChannelMessageMessage
  | TypingIndicatorMessage
  | MemberJoinMessage
  | MemberLeaveMessage
  | UserStatusMessage
  | UserNotificationMessage
  | ErrorMessage;

// Message type mapping for type guards
export type MessageDataMap = {
  [MessageType.CONNECT]: ConnectionData;
  [MessageType.DISCONNECT]: ConnectionData;
  [MessageType.PING]: PingPongData;
  [MessageType.PONG]: PingPongData;
  [MessageType.CHANNEL_JOIN]: ChannelJoinData;
  [MessageType.CHANNEL_LEAVE]: ChannelLeaveData;
  [MessageType.CHANNEL_MESSAGE]: ChannelMessageData;
  [MessageType.CHANNEL_TYPING]: TypingIndicatorData;
  [MessageType.CHANNEL_STOP_TYPING]: TypingIndicatorData;
  [MessageType.MEMBER_JOIN]: MemberJoinLeaveData;
  [MessageType.MEMBER_LEAVE]: MemberJoinLeaveData;
  [MessageType.USER_STATUS]: UserStatusData;
  [MessageType.USER_NOTIFICATION]: UserNotificationData;
  [MessageType.ERROR]: ErrorData;
};
