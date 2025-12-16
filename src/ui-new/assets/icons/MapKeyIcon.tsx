import React from "react";

interface MapKeyIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const MapKeyIcon: React.FC<MapKeyIconProps> = ({
  size = 16,
  color = "#545251",
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
      <path d="M7.33337 3.66675H14" stroke={color} strokeLinecap="round" />
      <path
        d="M3.6 11.2618C4.31111 11.7381 4.66667 11.9762 4.66667 12.3334C4.66667 12.6906 4.31111 12.9288 3.6 13.405C2.88889 13.8813 2.53333 14.1194 2.26667 13.9408C2 13.7622 2 13.286 2 12.3334C2 11.3809 2 10.9046 2.26667 10.726C2.53333 10.5475 2.88889 10.7856 3.6 11.2618Z"
        stroke={color}
        strokeLinecap="round"
      />
      <path
        d="M3.6 2.59509C4.31111 3.07135 4.66667 3.30947 4.66667 3.66667C4.66667 4.02386 4.31111 4.26199 3.6 4.73825C2.88889 5.21451 2.53333 5.45263 2.26667 5.27403C2 5.09544 2 4.61918 2 3.66667C2 2.71415 2 2.23789 2.26667 2.0593C2.53333 1.8807 2.88889 2.11883 3.6 2.59509Z"
        stroke={color}
        strokeLinecap="round"
      />
      <path d="M7.33337 8H14" stroke={color} strokeLinecap="round" />
      <path d="M7.33337 12.3333H14" stroke={color} strokeLinecap="round" />
    </svg>
  );
};

export default MapKeyIcon;
