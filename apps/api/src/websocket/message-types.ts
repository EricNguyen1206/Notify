// WebSocket Message Types - Migrated from Go version

export enum MessageType {
  // Connection events
  CONNECTION_CONNECT = "connection.connect",
  CONNECTION_DISCONNECT = "connection.disconnect",

  // Conversation events
  CONVERSATION_JOIN = "conversation.join",
  CONVERSATION_LEAVE = "conversation.leave",
  CONVERSATION_MESSAGE = "conversation.message",

  // Error
  ERROR = "error",
}

// Base message structure
export interface WebSocketMessage {
  id: string;
  type: MessageType;
  data: any;
  timestamp: number;
  user_id?: number;
}

// Data structures for different message types
export interface ConnectData {
  user_id: number;
  username: string;
  message: string;
}

export interface ConversationMessageData {
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  text?: string;
  url?: string;
  file_name?: string;
  message_type: "text" | "image" | "file";
}

export interface ConversationJoinLeaveData {
  conversation_id: number;
  user_id: number;
  username: string;
  action: "join" | "leave";
}

export interface ErrorData {
  code: string;
  message: string;
  details?: any;
}

// Message constructors
export function newMessage(type: MessageType, data: any, userId?: number): WebSocketMessage {
  return {
    id: generateMessageId(),
    type,
    data,
    timestamp: Date.now(),
    ...(userId !== undefined && { user_id: userId }),
  };
}

export function newConnectMessage(userId: number, username: string): WebSocketMessage {
  return newMessage(
    MessageType.CONNECTION_CONNECT,
    {
      user_id: userId,
      username,
      message: `User ${username} connected`,
    },
    userId
  );
}

export function newErrorMessage(code: string, message: string, details?: any): WebSocketMessage {
  return newMessage(MessageType.ERROR, {
    code,
    message,
    details,
  });
}

export function newChannelMessage(
  conversationId: number,
  senderId: number,
  senderName: string,
  senderAvatar: string | undefined,
  text?: string,
  url?: string,
  fileName?: string
): WebSocketMessage {
  let messageType: "text" | "image" | "file" = "text";
  if (url && fileName) {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      messageType = "image";
    } else {
      messageType = "file";
    }
  }

  return newMessage(
    MessageType.CONVERSATION_MESSAGE,
    {
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      text,
      url,
      file_name: fileName,
      message_type: messageType,
    },
    senderId
  );
}

export function newJoinChannelMessage(conversationId: number, userId: number, username: string): WebSocketMessage {
  return newMessage(
    MessageType.CONVERSATION_JOIN,
    {
      conversation_id: conversationId,
      user_id: userId,
      username,
      action: "join",
    },
    userId
  );
}

export function newLeaveChannelMessage(conversationId: number, userId: number, username: string): WebSocketMessage {
  return newMessage(
    MessageType.CONVERSATION_LEAVE,
    {
      conversation_id: conversationId,
      user_id: userId,
      username,
      action: "leave",
    },
    userId
  );
}

// Utility function to generate unique message ID
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Type guards for message validation
export function isConnectMessage(message: WebSocketMessage): message is WebSocketMessage & { data: ConnectData } {
  return message.type === MessageType.CONNECTION_CONNECT;
}

export function isChannelMessage(
  message: WebSocketMessage
): message is WebSocketMessage & { data: ConversationMessageData } {
  return message.type === MessageType.CONVERSATION_MESSAGE;
}

export function isChannelJoinMessage(
  message: WebSocketMessage
): message is WebSocketMessage & { data: ConversationJoinLeaveData } {
  return message.type === MessageType.CONVERSATION_JOIN;
}

export function isChannelLeaveMessage(
  message: WebSocketMessage
): message is WebSocketMessage & { data: ConversationJoinLeaveData } {
  return message.type === MessageType.CONVERSATION_LEAVE;
}

export function isErrorMessage(message: WebSocketMessage): message is WebSocketMessage & { data: ErrorData } {
  return message.type === MessageType.ERROR;
}
