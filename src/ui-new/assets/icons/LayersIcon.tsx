import React from "react";

interface LayersIconProps {
  isActive?: boolean;
  size?: number;
  className?: string;
}

const LayersIcon: React.FC<LayersIconProps> = ({
  isActive = false,
  size = 20,
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
        d="M8.00477 4.01074C8.988 3.55908 9.47958 3.33325 10 3.33325C10.5204 3.33325 11.012 3.55908 11.9952 4.01074L16.0727 5.88379C17.5798 6.57606 18.3333 6.9222 18.3333 7.49992C18.3333 8.07764 17.5798 8.42375 16.0727 9.11608L11.9952 10.9891C11.012 11.4408 10.5204 11.6666 10 11.6666C9.47958 11.6666 8.988 11.4408 8.00477 10.9891L3.92725 9.11608C2.42019 8.42375 1.66666 8.07764 1.66666 7.49992C1.66666 6.9222 2.42019 6.57606 3.92725 5.88379L8.00477 4.01074Z"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.8606 11.25C17.8424 11.7183 18.3333 12.0338 18.3333 12.5001C18.3333 13.0778 17.5798 13.4239 16.0727 14.1163L11.9952 15.9892C11.012 16.4409 10.5204 16.6667 10 16.6667C9.47958 16.6667 8.988 16.4409 8.00477 15.9892L3.92725 14.1163C2.42019 13.4239 1.66666 13.0778 1.66666 12.5001C1.66666 12.0338 2.15757 11.7183 3.13939 11.25"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default LayersIcon;
