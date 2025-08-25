// Simplified MessageType enum - only core chat functionality
export enum MessageType {
  CONNECT = "connection.connect",
  DISCONNECT = "connection.disconnect",
  CHANNEL_MESSAGE = "channel.message",
  ERROR = "error",
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

// Simplified channel message data interface
export interface ChannelMessageData {
  channel_id: string;
  text: string;
}

// Simplified received message data interface
export interface ChannelMessageDataReceived {
  id: number;
  channelId: number;
  senderId: number;
  text: string;
  created_at: string;
  Sender: {
    id: number;
    name: string;
    avatar: string;
  };
}

// Connection data
export interface ConnectionData {
  client_id?: string;
  status?: string;
}

// Error data
export interface ErrorData {
  code: string;
  message: string;
  details?: string;
  field?: string;
}

// Simplified message types for type safety
export type ConnectMessage = WsBaseMessage<ConnectionData>;
export type DisconnectMessage = WsBaseMessage<ConnectionData>;
export type ChannelMessageMessage = WsBaseMessage<ChannelMessageData>;
export type ChannelMessageReceivedMessage = WsBaseMessage<ChannelMessageDataReceived>;
export type ErrorMessage = WsBaseMessage<ErrorData>;

// Simplified union type for all possible WebSocket messages
export type WebSocketMessage =
  | ConnectMessage
  | DisconnectMessage
  | ChannelMessageMessage
  | ChannelMessageReceivedMessage
  | ErrorMessage;

// Simplified message type mapping for type guards
export type MessageDataMap = {
  [MessageType.CONNECT]: ConnectionData;
  [MessageType.DISCONNECT]: ConnectionData;
  [MessageType.CHANNEL_MESSAGE]: ChannelMessageData;
  [MessageType.ERROR]: ErrorData;
};

// Type guard functions
export function isWebSocketMessage(data: any): data is WebSocketMessage {
  return (
    data &&
    typeof data === "object" &&
    typeof data.id === "string" &&
    typeof data.type === "string" &&
    Object.values(MessageType).includes(data.type) &&
    data.data !== undefined &&
    typeof data.timestamp === "number"
  );
}

export function isChannelMessage(data: any): data is ChannelMessageReceivedMessage {
  return isWebSocketMessage(data) && data.type === MessageType.CHANNEL_MESSAGE;
}

export function isErrorMessage(data: any): data is ErrorMessage {
  return isWebSocketMessage(data) && data.type === MessageType.ERROR;
}

// Message type values for validation
export const MessageTypeValues = Object.values(MessageType);
