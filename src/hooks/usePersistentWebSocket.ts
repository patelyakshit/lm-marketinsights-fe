import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { updateLastActivity } from "../utils/chatStorage";

interface UsePersistentWebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: () => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

// WebSocket ReadyState enum
export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

// Global WebSocket manager - true singleton
class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private websocket: WebSocket | null = null;
  private url: string | null = null;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectInterval = 2000;
  private maxReconnectInterval = 30000;
  private pingIntervalId: NodeJS.Timeout | null = null;
  private pongTimeoutId: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private isSwitching = false; // Flag to prevent auto-reconnect during switching

  // Configurable timing settings
  private pingInterval = 30000; // Check for idle state every 30 seconds
  private idleTimeBeforePing = 60000; // Send PING only after 1 minute of inactivity
  private pongTimeout = 5000; // Wait 5 seconds for PONG response

  private messageHandlers: Set<(event: MessageEvent) => void> = new Set();
  private openHandlers: Set<() => void> = new Set();
  private closeHandlers: Set<(event: CloseEvent) => void> = new Set();
  private errorHandlers: Set<(error: Event) => void> = new Set();

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private startHeartbeat() {
    this.stopHeartbeat();

    this.pingIntervalId = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivityTime;

        // Only send PING if idle time exceeds configured threshold
        if (timeSinceLastActivity >= this.idleTimeBeforePing) {
          console.log(
            `Connection idle for ${timeSinceLastActivity}ms, sending PING...`,
          );

          // Send ping message
          this.websocket.send(JSON.stringify({ type: "CHAT/PING" }));

          // Set timeout for pong response
          this.pongTimeoutId = setTimeout(() => {
            console.warn(
              "No pong received, connection may be stale. Reconnecting...",
            );
            // Connection is stale, close and reconnect
            this.websocket?.close();
          }, this.pongTimeout);
        }
      }
    }, this.pingInterval);
  }

  private stopHeartbeat() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
    if (this.pongTimeoutId) {
      clearTimeout(this.pongTimeoutId);
      this.pongTimeoutId = null;
    }
  }

  // Disconnect current connection cleanly
  disconnect() {
    console.log("Disconnecting current WebSocket connection");
    this.isSwitching = true; // Set flag to prevent auto-reconnect
    this.stopHeartbeat();

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.websocket) {
      // Remove all event listeners before closing
      this.websocket.onopen = null;
      this.websocket.onmessage = null;
      this.websocket.onclose = null;
      this.websocket.onerror = null;

      if (
        this.websocket.readyState === WebSocket.OPEN ||
        this.websocket.readyState === WebSocket.CONNECTING
      ) {
        this.websocket.close(1000, "Switching connection");
      }

      this.websocket = null;
    }

    this.url = null;
    this.reconnectAttempts = 0;
  }

  connect(url: string, forceReconnect = false) {
    // If force reconnect, disconnect existing connection first
    if (forceReconnect && this.websocket) {
      console.log("Switching WebSocket to new URL:", url);
      this.disconnect();
    }

    // Reset switching flag when starting new connection
    this.isSwitching = false;

    // If already connected to the same URL, don't reconnect
    if (
      this.websocket &&
      this.url === url &&
      this.websocket.readyState === WebSocket.OPEN &&
      !forceReconnect
    ) {
      console.log("Already connected to:", url);
      return;
    }

    // If already connecting to the same URL, don't reconnect
    if (
      this.websocket &&
      this.websocket.readyState === WebSocket.CONNECTING &&
      !forceReconnect
    ) {
      console.log("Already connecting to:", url);
      return;
    }

    this.url = url;
    console.log("Establishing new WebSocket connection to:", url);

    try {
      this.websocket = new WebSocket(url);

      this.websocket.onopen = () => {
        this.reconnectAttempts = 0;
        this.lastActivityTime = Date.now(); // Reset activity time on connection
        updateLastActivity();
        this.startHeartbeat();
        this.openHandlers.forEach((handler) => handler());
      };

      this.websocket.onmessage = (event) => {
        updateLastActivity();
        this.lastActivityTime = Date.now(); // Track received messages as activity

        // Handle pong response
        try {
          const data = JSON.parse(event.data);
          if (data.type === "CHAT/PONG") {
            // Clear the pong timeout since we received a response
            if (this.pongTimeoutId) {
              clearTimeout(this.pongTimeoutId);
              this.pongTimeoutId = null;
            }
            return; // Don't pass pong messages to handlers
          }
        } catch {
          // Not JSON or parsing failed, continue normally
        }

        this.messageHandlers.forEach((handler) => handler(event));
      };

      this.websocket.onclose = (event) => {
        this.stopHeartbeat();
        this.closeHandlers.forEach((handler) => handler(event));

        // Auto-reconnect logic - but NOT if we're switching connections
        if (
          !this.isSwitching &&
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          console.log(
            "Connection closed unexpectedly, attempting reconnect...",
          );
          this.scheduleReconnect();
        } else if (this.isSwitching) {
          console.log("Connection closed for switching, not reconnecting");
        }
      };

      this.websocket.onerror = (error) => {
        this.errorHandlers.forEach((handler) => handler(error));
      };
    } catch {
      // WebSocket creation failed, will retry
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.reconnectAttempts++;

    // Exponential backoff: 2s, 4s, 8s, 16s, 30s (max)
    const delay = Math.min(
      this.baseReconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectInterval,
    );

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimeoutId = setTimeout(() => {
      if (this.url) {
        this.connect(this.url);
      }
    }, delay);
  }

  sendMessage(data: unknown) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.lastActivityTime = Date.now(); // Track last activity
      this.websocket.send(JSON.stringify(data));
    }
  }

  addMessageHandler(handler: (event: MessageEvent) => void) {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: (event: MessageEvent) => void) {
    this.messageHandlers.delete(handler);
  }

  addOpenHandler(handler: () => void) {
    this.openHandlers.add(handler);
  }

  removeOpenHandler(handler: () => void) {
    this.openHandlers.delete(handler);
  }

  addCloseHandler(handler: (event: CloseEvent) => void) {
    this.closeHandlers.add(handler);
  }

  removeCloseHandler(handler: (event: CloseEvent) => void) {
    this.closeHandlers.delete(handler);
  }

  addErrorHandler(handler: (error: Event) => void) {
    this.errorHandlers.add(handler);
  }

  removeErrorHandler(handler: (error: Event) => void) {
    this.errorHandlers.delete(handler);
  }

  getReadyState(): ReadyState {
    return this.websocket ? this.websocket.readyState : ReadyState.CLOSED;
  }

  getWebSocket(): WebSocket | null {
    return this.websocket;
  }

  close() {
    this.stopHeartbeat();
    if (this.websocket) {
      this.websocket.close(1000, "Normal closure");
    }
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  destroy() {
    this.close();
    this.messageHandlers.clear();
    this.openHandlers.clear();
    this.closeHandlers.clear();
    this.errorHandlers.clear();
    this.websocket = null;
    this.url = null;
    WebSocketManager.instance = null;
  }
}

// Global WebSocket state
let globalSessionId: string | null = null;

export const usePersistentWebSocket = (
  socketUrl: string,
  options: UsePersistentWebSocketOptions = {},
) => {
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.CLOSED);
  const wsManager = useRef<WebSocketManager | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Use refs to store callbacks to prevent handler recreation
  const onMessageRef = useRef(options.onMessage);
  const onOpenRef = useRef(options.onOpen);
  const onCloseRef = useRef(options.onClose);
  const onErrorRef = useRef(options.onError);

  // Update refs when options change
  useEffect(() => {
    onMessageRef.current = options.onMessage;
    onOpenRef.current = options.onOpen;
    onCloseRef.current = options.onClose;
    onErrorRef.current = options.onError;
  }, [options]);

  useEffect(() => {
    // Generate or reuse session ID
    if (!globalSessionId) {
      globalSessionId = uuidv4();
      sessionIdRef.current = globalSessionId;
    } else {
      sessionIdRef.current = globalSessionId;
    }

    // Append session_id to the WebSocket URL as a query parameter
    const urlWithSession = `${socketUrl}${socketUrl.includes("?") ? "&" : "?"}session_id=${sessionIdRef.current}`;

    wsManager.current = WebSocketManager.getInstance();

    // Only force reconnect if the URL has actually changed from the current connection
    const currentUrl = wsManager.current.getWebSocket()?.url;
    const shouldForceReconnect = !!(
      currentUrl && currentUrl !== urlWithSession
    );

    wsManager.current.connect(urlWithSession, shouldForceReconnect);
    setReadyState(wsManager.current.getReadyState());
  }, [socketUrl]);

  // Message handler
  const handleMessage = useCallback((event: MessageEvent) => {
    console.log(" event message is: ", event);
    onMessageRef.current?.(event);
  }, []);

  const handleOpen = useCallback(() => {
    setReadyState(ReadyState.OPEN);
    onOpenRef.current?.();
  }, []);

  // Close handler
  const handleClose = useCallback((event: CloseEvent) => {
    setReadyState(ReadyState.CLOSED);
    onCloseRef.current?.(event);
  }, []);

  // Error handler
  const handleError = useCallback((error: Event) => {
    onErrorRef.current?.(error);
  }, []);

  useEffect(() => {
    if (wsManager.current) {
      wsManager.current.addMessageHandler(handleMessage);
      wsManager.current.addOpenHandler(handleOpen);
      wsManager.current.addCloseHandler(handleClose);
      wsManager.current.addErrorHandler(handleError);
      setReadyState(wsManager.current.getReadyState());

      return () => {
        wsManager.current?.removeMessageHandler(handleMessage);
        wsManager.current?.removeOpenHandler(handleOpen);
        wsManager.current?.removeCloseHandler(handleClose);
        wsManager.current?.removeErrorHandler(handleError);
      };
    }
  }, [handleMessage, handleOpen, handleClose, handleError]);

  // Enhanced send message function
  const sendJsonMessage = useCallback((message: unknown) => {
    if (wsManager.current) {
      const messageWithTimestamp = {
        ...(message as Record<string, unknown>),
        timestamp: Date.now(),
      };
      wsManager.current.sendMessage(messageWithTimestamp);
    }
  }, []);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    updateLastActivity();
  }, []);

  // Get current session ID
  const getSessionId = useCallback(() => {
    return sessionIdRef.current;
  }, []);

  return {
    sendJsonMessage,
    updateActivity,
    getSessionId,
    readyState,
    lastMessage: null,
    lastJsonMessage: null,
    getWebSocket: () => wsManager.current?.getWebSocket() || null,
  };
};

// WebSocket cleanup on page unload/refresh
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    // Clear global session ID on page unload
    globalSessionId = null;
  });
}
