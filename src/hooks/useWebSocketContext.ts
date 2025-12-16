import { useContext } from "react";
import { ReadyState } from "./usePersistentWebSocket";
import { WebSocketContext } from "../contexts/WebSocketContextInstance";

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    return {
      sendJsonMessage: () => {
        console.warn("WebSocket context not available");
      },
      readyState: ReadyState.CLOSED,
      isConnected: false,
    };
  }
  return context;
};
