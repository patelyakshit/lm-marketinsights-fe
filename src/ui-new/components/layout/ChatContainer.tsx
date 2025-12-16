import React from "react";
import { usePromptContext } from "../../../hooks/usePromptContext";
import ChatLandingPanel from "./ChatLandingPanel";
import ChatPanel from "./ChatPanel";

interface ChatContainerProps {
  className?: string;
  width?: string;
  isCompact?: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  className = "",
  width,
  isCompact = false,
}) => {
  const { hasStartedChat, setHasStartedChat, setInitialPrompt } =
    usePromptContext();

  const handlePromptSubmit = (prompt: string) => {
    setInitialPrompt(prompt);
    setHasStartedChat(true);
  };

  if (hasStartedChat) {
    return (
      <div className={className} style={width ? { width } : {}}>
        <ChatPanel />
      </div>
    );
  }

  return (
    <div className={className} style={width ? { width } : {}}>
      <ChatLandingPanel
        onPromptSubmit={handlePromptSubmit}
        isCompact={isCompact}
      />
    </div>
  );
};

export default ChatContainer;
