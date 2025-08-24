# WebSocket Reconnection Fixes

## Overview
This document outlines the comprehensive fixes implemented to address excessive WebSocket reconnection attempts in the Notify application.

## Issues Identified

### 1. Page Visibility Reconnection Logic
**Problem**: The `handlePageVisible()` method attempted to reconnect even when already connected.
**Location**: `frontend/src/services/wsMutator.ts:163-171`

### 2. Network Event Handlers
**Problem**: Online event handler attempted reconnection without checking current state.
**Location**: `frontend/src/services/wsMutator.ts:147-161`

### 3. Channel Management Effect Loop
**Problem**: Effect runs on every connection state change, causing cascading reconnections.
**Location**: `frontend/src/app/messages/[id]/action.ts:254-307`

### 4. Insufficient Connection State Guards
**Problem**: Multiple places call `connect()` without proper state validation.
**Location**: Various files

### 5. Component Lifecycle Issues
**Problem**: WebSocket connection initiated on every render without proper deduplication.
**Location**: `frontend/src/app/messages/action.ts` and `MessagesWebSocketProvider.tsx`

## Fixes Implemented

### 1. Enhanced Page Visibility Logic
- Added proper connection state validation before attempting reconnection
- Verify WebSocket readyState before resuming heartbeat
- Added reconnection timer checks to prevent concurrent attempts

```typescript
private handlePageVisible(): void {
  // Only attempt reconnection if we're actually disconnected and not already trying to connect
  if (this.connectionState === ConnectionState.DISCONNECTED || this.connectionState === ConnectionState.ERROR) {
    // Additional check: ensure we're not already in a reconnection process
    if (!this.reconnectTimer) {
      console.log("Page became visible, reconnecting...");
      this.connect(this.url, this.params).catch((error) => {
        console.error("Failed to reconnect on page visible:", error);
      });
    } else {
      console.log("Page became visible, but reconnection already in progress");
    }
  } else if (this.connectionState === ConnectionState.CONNECTED) {
    // Verify the connection is actually alive before resuming heartbeat
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("Page became visible, resuming heartbeat for active connection");
      this.startHeartbeat();
    } else {
      // Connection appears dead, trigger reconnection
      console.log("Page became visible, connection appears dead, reconnecting...");
      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.attemptReconnect();
    }
  } else if (
    this.connectionState === ConnectionState.CONNECTING ||
    this.connectionState === ConnectionState.RECONNECTING
  ) {
    console.log("Page became visible, connection attempt already in progress");
  }
}
```

### 2. Improved Network Monitoring
- Enhanced online event handler with proper state validation
- Added reconnection timer checks
- Only update offline state when actually connected

### 3. Enhanced Connection State Validation
- Added comprehensive state checks in the main `connect()` method
- Clear existing reconnection timers to prevent conflicts
- Enhanced validation in socket store

```typescript
// Prevent multiple simultaneous connection attempts
if (
  this.connectionState === ConnectionState.CONNECTING ||
  this.connectionState === ConnectionState.RECONNECTING ||
  (this.connectionState === ConnectionState.CONNECTED && this.ws?.readyState === WebSocket.OPEN)
) {
  console.log(`Connection attempt skipped - current state: ${this.connectionState}`);
  return Promise.resolve();
}

// Clear any existing reconnection timer to prevent conflicts
if (this.reconnectTimer) {
  clearTimeout(this.reconnectTimer);
  this.reconnectTimer = null;
}
```

### 4. Improved Channel Switching Debouncing
- Increased debounce delay from 100ms to 200ms
- Enhanced pending channel management
- Added timeout cleanup for better state management

### 5. Circuit Breaker Pattern Implementation
- Added circuit breaker states: CLOSED, OPEN, HALF_OPEN
- Failure threshold: 5 failures before opening circuit
- Circuit breaker timeout: 5 minutes before allowing retry
- Automatic success/failure recording

```typescript
enum CircuitBreakerState {
  CLOSED = "closed",     // Normal operation
  OPEN = "open",         // Failing, stop attempts
  HALF_OPEN = "half_open" // Testing if service recovered
}
```

### 6. Enhanced Reconnection Backoff Strategy
- Increased max reconnection attempts from 5 to 8
- Increased max reconnection delay to 60 seconds
- Improved exponential backoff with jitter
- Circuit breaker integration

### 7. Component Lifecycle Improvements
- Added mount state tracking to prevent state updates after unmount
- Connection attempt deduplication using refs
- Improved cleanup logic in useWebSocketConnection
- Memoized MessagesWebSocketProvider to prevent unnecessary re-renders

## Configuration Changes

### Updated Default WebSocket Configuration
```typescript
const DEFAULT_WS_CONFIG: WebSocketClientConfig = {
  reconnectAttempts: 8, // Increased from 5
  reconnectDelay: 1000,
  maxReconnectDelay: 60000, // Increased from 30000
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  messageQueueLimit: 100,
  messageCacheSize: 1000,
  enableJitter: true,
};
```

## Benefits

1. **Reduced Network Overhead**: Eliminated unnecessary reconnection attempts
2. **Improved Performance**: Prevented cascading reconnections and effect loops
3. **Better User Experience**: More stable connection with intelligent retry logic
4. **Resource Conservation**: Circuit breaker prevents excessive failed attempts
5. **Enhanced Debugging**: Better logging and state tracking

## Testing Recommendations

1. Test page visibility changes (tab switching)
2. Test network connectivity changes (offline/online)
3. Test rapid channel switching
4. Test component mounting/unmounting
5. Test server disconnections and reconnections
6. Verify circuit breaker behavior under sustained failures

## Monitoring

Monitor the following metrics to ensure the fixes are effective:
- Connection attempt frequency
- Reconnection success rate
- Circuit breaker state transitions
- Page visibility event handling
- Channel switching performance
