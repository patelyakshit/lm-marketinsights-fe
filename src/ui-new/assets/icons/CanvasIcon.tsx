import React from "react";

interface CanvasIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const CanvasIcon: React.FC<CanvasIconProps> = ({
  size = 16,
  color = "#7E7977",
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
        d="M2.59424 2.59412C3.52174 1.66663 5.01452 1.66663 8.00008 1.66663C10.9856 1.66663 12.4784 1.66663 13.4059 2.59412C14.3334 3.52162 14.3334 5.0144 14.3334 7.99996C14.3334 10.9855 14.3334 12.4783 13.4059 13.4058C12.4784 14.3333 10.9856 14.3333 8.00008 14.3333C5.01452 14.3333 3.52174 14.3333 2.59424 13.4058C1.66675 12.4783 1.66675 10.9855 1.66675 7.99996C1.66675 5.0144 1.66675 3.52162 2.59424 2.59412Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.00008 1.66663V2.93329M8.00008 13.0666V14.3333M6.10008 7.99996H9.90008M13.0667 7.99996H14.3334M1.66675 7.99996H2.93341M8.00008 6.09995V9.89996"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CanvasIcon;
