import { io } from "socket.io-client";

const socket = io("http://localhost:8000");

export default socket;

import { useEffect, useRef, useState } from "react";

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (
  url: string,
  options: UseWebSocketOptions = {}
) => {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const webSocketRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);

  const connectWebSocket = () => {
    setIsReconnecting(false);
    attemptsRef.current = 0;

    const ws = new WebSocket(url);
    webSocketRef.current = ws;

    ws.onopen = (event) => {
      setIsConnected(true);
      setIsReconnecting(false);
      if (onOpen) onOpen(event);
    };

    ws.onmessage = (event) => {
      if (onMessage) onMessage(event);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      if (onClose) onClose(event);

      // Attempt reconnection if allowed
      if (attemptsRef.current < reconnectAttempts) {
        setIsReconnecting(true);
        attemptsRef.current++;
        setTimeout(connectWebSocket, reconnectInterval);
      }
    };

    ws.onerror = (event) => {
      if (onError) onError(event);
    };
  };

  useEffect(() => {
    connectWebSocket();

    // Cleanup on component unmount
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [url]);

  const sendMessage = (message: string) => {
    if (
      webSocketRef.current &&
      webSocketRef.current.readyState === WebSocket.OPEN
    ) {
      webSocketRef.current.send(message);
    } else {
      console.error("WebSocket is not open. Unable to send message.");
    }
  };

  return { isConnected, isReconnecting, sendMessage };
};

class WebSocketPool {
  private pool: Map<string, WebSocket> = new Map();

  connect(url: string): WebSocket {
      if (this.pool.has(url)) {
          return this.pool.get(url)!;
      }

      const ws = new WebSocket(url);
      this.pool.set(url, ws);

      ws.onclose = () => {
          console.log(`Connection to ${url} closed.`);
          this.pool.delete(url);
      };

      return ws;
  }

  sendMessage(url: string, message: string) {
      const ws = this.pool.get(url);
      if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(message);
      } else {
          console.error(`WebSocket to ${url} is not open.`);
      }
  }

  closeConnection(url: string) {
      const ws = this.pool.get(url);
      if (ws) {
          ws.close();
          this.pool.delete(url);
      }
  }

  closeAll() {
      this.pool.forEach((ws) => ws.close());
      this.pool.clear();
  }
}

export const webSocketPool = new WebSocketPool();
