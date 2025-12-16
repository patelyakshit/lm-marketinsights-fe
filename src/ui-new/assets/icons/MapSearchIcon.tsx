import React from "react";

interface MapSearchIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const MapSearchIcon: React.FC<MapSearchIconProps> = ({
  size = 16,
  color = "rgba(255, 255, 255, 0.9)",
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
      <circle
        cx="7.33333"
        cy="7.33333"
        r="4.66667"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M13.3333 13.3333L11 11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default MapSearchIcon;
