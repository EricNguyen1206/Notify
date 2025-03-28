import { useEffect } from "react";

export function useWebSocket<T>(url: string, onMessage: (data: T) => void) {
  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => console.log("WebSocket connected");
    socket.onmessage = (event) => {
      try {
        const data: T = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error("WebSocket message parsing error:", error);
      }
    };

    socket.onerror = (error) => console.error("WebSocket error:", error);
    socket.onclose = () => console.log("WebSocket disconnected");

    return () => socket.close();
  }, [url, onMessage]);
}
