import React from "react";

interface MicrophoneIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const MicrophoneIcon: React.FC<MicrophoneIconProps> = ({
  size = 20,
  color = "currentColor",
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M10 1.66667C9.11595 1.66667 8.2681 2.01786 7.64298 2.64298C7.01786 3.2681 6.66667 4.11595 6.66667 5V10C6.66667 10.8841 7.01786 11.7319 7.64298 12.357C8.2681 12.9821 9.11595 13.3333 10 13.3333C10.8841 13.3333 11.7319 12.9821 12.357 12.357C12.9821 11.7319 13.3333 10.8841 13.3333 10V5C13.3333 4.11595 12.9821 3.2681 12.357 2.64298C11.7319 2.01786 10.8841 1.66667 10 1.66667Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M16.6667 8.33333V10C16.6667 11.7681 15.9643 13.4638 14.714 14.714C13.4638 15.9643 11.7681 16.6667 10 16.6667M10 16.6667C8.23189 16.6667 6.53621 15.9643 5.28596 14.714C4.03572 13.4638 3.33334 11.7681 3.33334 10V8.33333M10 16.6667V18.3333"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MicrophoneIcon;
