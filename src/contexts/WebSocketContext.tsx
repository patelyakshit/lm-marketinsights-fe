import React, { ReactNode } from "react";
import { ReadyState } from "../hooks/usePersistentWebSocket";
import { WebSocketContext } from "./WebSocketContextInstance";

export type { WebSocketContextType } from "./WebSocketContextInstance";

interface WebSocketProviderProps {
  children: ReactNode;
  sendJsonMessage: (message: unknown) => void;
  readyState: ReadyState;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  sendJsonMessage,
  readyState,
}) => {
  const isConnected = readyState === ReadyState.OPEN;

  return (
    <WebSocketContext.Provider
      value={{
        sendJsonMessage,
        readyState,
        isConnected,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
