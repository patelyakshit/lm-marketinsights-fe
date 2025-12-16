interface ChatSession {
  sessionId: string;
  timestamp: number;
  widgetId: string;
}

interface ChatHistory {
  messages: Array<{
    id?: string;
    sender: "user" | "bot";
    text: string;
    time: string;
    isStreaming?: boolean;
    is_action?: boolean;
    operation?: string;
    operation_data?: unknown;
    filter_output?: unknown;
    zoom_data?: unknown;
  }>;
  clickedLocation?: string[];
  timestamp: number;
}

interface StoredChatData {
  session: ChatSession;
  history: ChatHistory;
}

const STORAGE_KEYS = {
  CHAT_DATA: "lm_chat_data",
  SESSION_ID: "lm_session_id",
  LAST_ACTIVITY: "lm_last_activity",
  CURRENT_SESSION_ID: "lm_current_session_id", // Store current active session ID
} as const;

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Store current session ID for switching
export const storeCurrentSessionId = (sessionId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, sessionId);
  } catch (error) {
    console.error("Error storing current session ID:", error);
  }
};

// Get current session ID
export const getCurrentSessionId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
  } catch (error) {
    console.error("Error getting current session ID:", error);
    return null;
  }
};

export const getStoredChatData = (): StoredChatData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_DATA);
    if (!stored) return null;

    const data: StoredChatData = JSON.parse(stored);

    // Check if session is still valid (not expired)
    const now = Date.now();
    if (now - data.session.timestamp > SESSION_TIMEOUT) {
      clearStoredChatData();
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error reading stored chat data:", error);
    return null;
  }
};

export const storeChatData = (
  sessionId: string,
  messages: unknown[],
  widgetId: string,
  clickedLocation?: string[],
): void => {
  try {
    const now = Date.now();

    const chatData: StoredChatData = {
      session: {
        sessionId,
        timestamp: now,
        widgetId,
      },
      history: {
        messages: messages.map((msg: unknown) => {
          const message = msg as Record<string, unknown>;
          return {
            id: message.id as string | undefined,
            sender: message.sender as "user" | "bot",
            text: message.text as string,
            time: message.time as string,
            isStreaming: message.isStreaming as boolean | undefined,
            is_action: message.is_action as boolean | undefined,
            operation: message.operation as string | undefined,
            operation_data: message.operation_data,
            filter_output: message.filter_output,
            zoom_data: message.zoom_data,
          };
        }),
        clickedLocation: clickedLocation,
        timestamp: now,
      },
    };

    localStorage.setItem(STORAGE_KEYS.CHAT_DATA, JSON.stringify(chatData));
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());
  } catch (error) {
    console.error("Error storing chat data:", error);
  }
};

export const updateStoredMessages = (
  messages: unknown[],
  clickedLocation?: string[],
): void => {
  try {
    const stored = getStoredChatData();
    if (!stored) return;

    const now = Date.now();
    stored.history.messages = messages.map((msg: unknown) => {
      const message = msg as Record<string, unknown>;
      return {
        id: message.id as string | undefined,
        sender: message.sender as "user" | "bot",
        text: message.text as string,
        time: message.time as string,
        isStreaming: message.isStreaming as boolean | undefined,
        is_action: message.is_action as boolean | undefined,
        operation: message.operation as string | undefined,
        operation_data: message.operation_data,
        filter_output: message.filter_output,
        zoom_data: message.zoom_data,
      };
    });
    if (clickedLocation) {
      stored.history.clickedLocation = clickedLocation;
    }
    stored.history.timestamp = now;

    localStorage.setItem(STORAGE_KEYS.CHAT_DATA, JSON.stringify(stored));
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());
  } catch (error) {
    console.error("Error updating stored messages:", error);
  }
};

export const getStoredSessionId = (): string | null => {
  try {
    const stored = getStoredChatData();
    return stored?.session.sessionId || null;
  } catch (error) {
    console.error("Error getting stored session ID:", error);
    return null;
  }
};

export const clearStoredChatData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CHAT_DATA);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
  } catch (error) {
    console.error("Error clearing stored chat data:", error);
  }
};

export const isStoredSessionValid = (currentWidgetId: string): boolean => {
  try {
    const stored = getStoredChatData();
    if (!stored) return false;

    // Check if session is for the same widget
    if (stored.session.widgetId !== currentWidgetId) {
      clearStoredChatData();
      return false;
    }

    // Check if session is not expired
    const now = Date.now();
    if (now - stored.session.timestamp > SESSION_TIMEOUT) {
      clearStoredChatData();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating stored session:", error);
    return false;
  }
};

export const getStoredMessages = (): unknown[] => {
  try {
    const stored = getStoredChatData();
    return stored?.history.messages || [];
  } catch (error) {
    console.error("Error getting stored messages:", error);
    return [];
  }
};

export const getStoredClickedLocation = (): string[] => {
  try {
    const stored = getStoredChatData();
    return stored?.history.clickedLocation || [];
  } catch (error) {
    console.error("Error getting stored clicked location:", error);
    return [];
  }
};

export const isReturningToSession = (): boolean => {
  try {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    const storedData = getStoredChatData();

    // If no stored data, definitely not returning
    if (!storedData) return false;

    // If no last activity, assume it's a returning session if we have stored data
    if (!lastActivity) return true;

    const now = Date.now();
    const timeSinceLastActivity = now - parseInt(lastActivity);

    // Consider it a returning session if last activity was within 30 minutes
    // This gives more time for tab switching scenarios
    return timeSinceLastActivity < 30 * 60 * 1000;
  } catch (error) {
    console.error("Error checking returning session:", error);
    return false;
  }
};

export const updateLastActivity = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    console.error("Error updating last activity:", error);
  }
};

/**
 * Check if we should maintain WebSocket connection (not a fresh page load)
 */
export const shouldMaintainConnection = (): boolean => {
  try {
    const storedData = getStoredChatData();
    if (!storedData) return false;

    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    if (!lastActivity) return false;

    const now = Date.now();
    const timeSinceLastActivity = now - parseInt(lastActivity);

    // Maintain connection if last activity was within 5 minutes
    return timeSinceLastActivity < 5 * 60 * 1000;
  } catch (error) {
    console.error("Error checking connection maintenance:", error);
    return false;
  }
};

/**
 * Clear chat history and session data (for logout scenarios)
 */
export const clearChatHistory = (): void => {
  try {
    clearStoredChatData();
  } catch (error) {
    console.error("Error clearing chat history:", error);
  }
};

/**
 * Check if this is a fresh session (no existing chat history)
 */
export const isFreshSession = (): boolean => {
  try {
    const storedData = getStoredChatData();
    return !storedData || storedData.history.messages.length === 0;
  } catch (error) {
    console.error("Error checking fresh session:", error);
    return true;
  }
};
