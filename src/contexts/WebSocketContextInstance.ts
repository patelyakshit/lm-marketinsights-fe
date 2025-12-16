import { createContext } from "react";
import { ReadyState } from "../hooks/usePersistentWebSocket";

export interface WebSocketContextType {
  sendJsonMessage: (message: unknown) => void;
  readyState: ReadyState;
  isConnected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(
  null,
);
