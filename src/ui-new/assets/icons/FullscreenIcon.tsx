import React from "react";

interface FullscreenIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const FullscreenIcon: React.FC<FullscreenIconProps> = ({
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
        d="M1.33334 1.33333H6.33334V2.66666H2.66668V6.33333H1.33334V1.33333ZM9.66668 1.33333H14.6667V6.33333H13.3333V2.66666H9.66668V1.33333ZM2.66668 9.66666V13.3333H6.33334V14.6667H1.33334V9.66666H2.66668ZM14.6667 9.66666V14.6667H9.66668V13.3333H13.3333V9.66666H14.6667Z"
        fill={color}
        fillOpacity="0.9"
      />
    </svg>
  );
};

export default FullscreenIcon;
