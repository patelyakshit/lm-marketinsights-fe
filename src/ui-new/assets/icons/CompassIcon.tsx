import React from "react";

interface CompassIconProps {
  size?: number;
  color?: string;
  className?: string;
  rotation?: number;
}

const CompassIcon: React.FC<CompassIconProps> = ({
  size = 16,
  color = "rgba(255, 255, 255, 1)",
  className = "",
  rotation = 0,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M8.00006 1.83293L1.50003 14.1663L8.00006 11.2643L14.5001 14.1654L8.00006 1.83293Z"
        fill={color}
        fillOpacity="0.9"
      />
    </svg>
  );
};

export default CompassIcon;
