import React from "react";

interface ChatIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const ChatIcon: React.FC<ChatIconProps> = ({
  size = 16,
  color = "#1D1916",
  className = "",
}) => {
  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M5.33337 9.00008H10.6667M5.33337 5.66675H8.00004"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.06591 12.6667C3.19917 12.5815 2.54987 12.3211 2.11442 11.8857C1.33337 11.1047 1.33337 9.84755 1.33337 7.33341V7.00008C1.33337 4.48592 1.33337 3.22885 2.11442 2.44779C2.89547 1.66675 4.15255 1.66675 6.66671 1.66675H9.33337C11.8475 1.66675 13.1046 1.66675 13.8856 2.44779C14.6667 3.22885 14.6667 4.48592 14.6667 7.00008V7.33341C14.6667 9.84755 14.6667 11.1047 13.8856 11.8857C13.1046 12.6667 11.8475 12.6667 9.33337 12.6667C8.95971 12.6751 8.66211 12.7035 8.36977 12.7701C7.57084 12.954 6.83104 13.3628 6.09995 13.7193C5.05823 14.2273 4.53737 14.4813 4.2105 14.2435C3.58517 13.7777 4.1964 12.3347 4.33337 11.6667"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};

export default ChatIcon;
