package models

// WebSocket message types and data structures for API documentation
// These models are used for Swagger/OpenAPI generation and should match
// the types defined in internal/websocket/message_type.go

// WebSocketMessage represents the base structure for all WebSocket messages
// @Description Base WebSocket message structure that all messages follow
type WebSocketMessage struct {
	// Unique message identifier
	ID string `json:"id" example:"msg-123" validate:"required"`
	
	// Message type enum - see WebSocketMessageType for valid values
	Type string `json:"type" example:"channel.message" validate:"required" enums:"connection.connect,connection.disconnect,connection.ping,connection.pong,channel.join,channel.leave,channel.message,channel.typing,channel.stop_typing,channel.member.join,channel.member.leave,user.status,user.notification,error"`
	
	// Message payload data - structure depends on message type
	Data interface{} `json:"data" validate:"required"`
	
	// Unix timestamp when message was created
	Timestamp int64 `json:"timestamp" example:"1234567890" validate:"required"`
	
	// ID of the user who sent the message
	UserID string `json:"user_id" example:"user-456"`
}

// WebSocketMessageType represents the enum of valid WebSocket message types
// @Description Enum of valid WebSocket message types
type WebSocketMessageType struct {
	// Connection events
	Connect    string `json:"connection.connect" example:"connection.connect"`
	Disconnect string `json:"connection.disconnect" example:"connection.disconnect"`
	Ping       string `json:"connection.ping" example:"connection.ping"`
	Pong       string `json:"connection.pong" example:"connection.pong"`
	
	// Channel events
	ChannelJoin    string `json:"channel.join" example:"channel.join"`
	ChannelLeave   string `json:"channel.leave" example:"channel.leave"`
	ChannelMessage string `json:"channel.message" example:"channel.message"`
	ChannelTyping  string `json:"channel.typing" example:"channel.typing"`
	ChannelStopTyping string `json:"channel.stop_typing" example:"channel.stop_typing"`
	
	// Channel member events
	MemberJoin  string `json:"channel.member.join" example:"channel.member.join"`
	MemberLeave string `json:"channel.member.leave" example:"channel.member.leave"`
	
	// User events
	UserStatus      string `json:"user.status" example:"user.status"`
	UserNotification string `json:"user.notification" example:"user.notification"`
	
	// Error events
	Error string `json:"error" example:"error"`
}

// ChannelJoinData represents data for joining a channel
// @Description Data structure for channel.join message type
type ChannelJoinData struct {
	// ID of the channel to join
	ChannelID string `json:"channel_id" example:"channel-123" validate:"required"`
}

// ChannelLeaveData represents data for leaving a channel
// @Description Data structure for channel.leave message type
type ChannelLeaveData struct {
	// ID of the channel to leave
	ChannelID string `json:"channel_id" example:"channel-123" validate:"required"`
}

// ChannelMessageData represents data for channel messages
// @Description Data structure for channel.message message type
type ChannelMessageData struct {
	// ID of the channel where message is sent
	ChannelID string `json:"channel_id" example:"channel-123" validate:"required"`
	
	// Text content of the message
	Text *string `json:"text,omitempty" example:"Hello world!"`
	
	// Optional URL attachment
	URL *string `json:"url,omitempty" example:"https://example.com/image.jpg"`
	
	// Optional file name for attachments
	FileName *string `json:"fileName,omitempty" example:"document.pdf"`
	
	// Optional ID of message being replied to
	ReplyToID *string `json:"reply_to_id,omitempty" example:"msg-456"`
}

// TypingIndicatorData represents data for typing indicators
// @Description Data structure for channel.typing and channel.stop_typing message types
type TypingIndicatorData struct {
	// ID of the channel where typing is happening
	ChannelID string `json:"channel_id" example:"channel-123" validate:"required"`
	
	// Whether user is currently typing
	IsTyping bool `json:"is_typing" example:"true"`
}

// MemberJoinLeaveData represents data for member join/leave events
// @Description Data structure for channel.member.join and channel.member.leave message types
type MemberJoinLeaveData struct {
	// ID of the channel
	ChannelID string `json:"channel_id" example:"channel-123" validate:"required"`
	
	// ID of the user joining/leaving
	UserID string `json:"user_id" example:"user-789" validate:"required"`
	
	// Username of the user joining/leaving
	Username string `json:"username" example:"john_doe"`
}

// UserStatusData represents data for user status updates
// @Description Data structure for user.status message type
type UserStatusData struct {
	// Current status of the user
	Status string `json:"status" example:"online" validate:"required" enums:"online,offline,away,busy"`
	
	// Unix timestamp of last seen time
	LastSeen int64 `json:"last_seen" example:"1234567890"`
}

// UserNotificationData represents data for user notifications
// @Description Data structure for user.notification message type
type UserNotificationData struct {
	// Type of notification
	Type string `json:"type" example:"mention" validate:"required"`
	
	// Notification title
	Title string `json:"title" example:"New mention" validate:"required"`
	
	// Notification message
	Message string `json:"message" example:"You were mentioned in #general" validate:"required"`
	
	// Optional URL to navigate to
	URL *string `json:"url,omitempty" example:"/channels/general"`
}

// ErrorData represents data for error messages
// @Description Data structure for error message type
type ErrorData struct {
	// Error code
	Code string `json:"code" example:"INVALID_MESSAGE" validate:"required"`
	
	// Human-readable error message
	Message string `json:"message" example:"Invalid message format" validate:"required"`
	
	// Optional additional error details
	Details *string `json:"details,omitempty" example:"Field 'channel_id' is required"`
}

// ConnectionData represents data for connection events
// @Description Data structure for connection.connect and connection.disconnect message types
type ConnectionData struct {
	// Client connection ID
	ClientID string `json:"client_id" example:"client-abc123"`
	
	// Connection status
	Status string `json:"status" example:"connected" enums:"connected,disconnected"`
}

// PingPongData represents data for ping/pong messages
// @Description Data structure for connection.ping and connection.pong message types
type PingPongData struct {
	// Timestamp for ping/pong
	Timestamp int64 `json:"timestamp" example:"1234567890"`
	
	// Optional ping ID for pong responses
	PingID *string `json:"ping_id,omitempty" example:"ping-123"`
}

// WebSocketExampleMessages provides example messages for documentation
// @Description Example WebSocket messages for different message types
type WebSocketExampleMessages struct {
	// Example channel join message
	ChannelJoin WebSocketMessage `json:"channel_join_example"`
	
	// Example channel message
	ChannelMessage WebSocketMessage `json:"channel_message_example"`
	
	// Example typing indicator
	TypingIndicator WebSocketMessage `json:"typing_indicator_example"`
	
	// Example error message
	Error WebSocketMessage `json:"error_example"`
}
