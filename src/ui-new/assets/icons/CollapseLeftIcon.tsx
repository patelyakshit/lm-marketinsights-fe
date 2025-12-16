import React from "react";

interface CollapseLeftIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const CollapseLeftIcon: React.FC<CollapseLeftIconProps> = ({
  size = 20,
  color = "#545251",
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
        d="M11.5 6L7.5 10L11.5 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 6L12 10L16 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CollapseLeftIcon;
