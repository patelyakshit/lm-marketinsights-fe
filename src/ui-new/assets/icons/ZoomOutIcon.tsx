import React from "react";

interface ZoomOutIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const ZoomOutIcon: React.FC<ZoomOutIconProps> = ({
  size = 16,
  color = "rgba(255, 255, 255, 1)",
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.66663 7.16667H13.3333V8.83334H2.66663V7.16667Z"
        fill={color}
        fillOpacity="0.9"
      />
    </svg>
  );
};

export default ZoomOutIcon;
