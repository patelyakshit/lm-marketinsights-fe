import React from "react";
import ChatBox from "../../../components/ChatBox";

interface ChatPanelProps {
  className?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ className = "" }) => {
  return (
    <div className={`h-full w-full ${className}`}>
      <div
        className="h-full flex flex-col w-full mx-auto"
        style={{ maxWidth: "728px" }}
      >
        <ChatBox />
      </div>
    </div>
  );
};

export default ChatPanel;
