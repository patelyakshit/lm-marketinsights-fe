import React from "react";

interface PlusIconProps {
  size?: number;
  borderColor?: string;
  iconColor?: string;
  className?: string;
}

const PlusIcon: React.FC<PlusIconProps> = ({
  size = 36,
  borderColor = "#ECEAE9",
  iconColor = "#2A2623",
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="0.5"
        y="0.5"
        width="35"
        height="35"
        rx="17.5"
        stroke={borderColor}
      />
      <path
        d="M18.0007 12.1667V23.8351"
        stroke={iconColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.8351 18.0017H12.1667"
        stroke={iconColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PlusIcon;
