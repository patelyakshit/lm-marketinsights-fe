import React from "react";

interface CloseIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const CloseIcon: React.FC<CloseIconProps> = ({
  size = 16,
  color = "#7e7977",
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 4L4 12M4 4L12 12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CloseIcon;
