import React from "react";

interface ChevronRightIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const ChevronRightIcon: React.FC<ChevronRightIconProps> = ({
  size = 20,
  color = "#7e7977",
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
        d="M7.5 15L12.5 10L7.5 5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChevronRightIcon;
