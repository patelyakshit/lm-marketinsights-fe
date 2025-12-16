import React from "react";
import ChatIcon from "./svg/ChatIcon";

interface ChatHeaderProps {
  title?: string;
  className?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = "AI Assist",
  className = "",
}) => {
  return (
    <div
      className={`flex items-center text-left bg-white w-full ${className}`}
      style={{
        height: "48px",
        padding: "14px",
        gap: "10px",
        opacity: 1,
        background: "#FFFFFF",
        borderBottom: "1px solid #EBEBEB",
      }}
    >
      <div className="flex items-center gap-[10px]">
        <ChatIcon />
        <span
          className="font-medium text-gray-800"
          style={{
            fontFamily: "Typography/Font/Primary",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "20px",
            letterSpacing: "-0.6%",
          }}
        >
          {title}
        </span>
      </div>
    </div>
  );
};

export default ChatHeader;
