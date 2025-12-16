import React from "react";

interface SpaceIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const SpaceIcon: React.FC<SpaceIconProps> = ({
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
        d="M2.59412 2.59424C3.52162 1.66675 5.0144 1.66675 7.99996 1.66675C10.9855 1.66675 12.4783 1.66675 13.4058 2.59424C14.3333 3.52174 14.3333 5.01452 14.3333 8.00008C14.3333 10.9856 14.3333 12.4784 13.4058 13.4059C12.4783 14.3334 10.9855 14.3334 7.99996 14.3334C5.0144 14.3334 3.52162 14.3334 2.59412 13.4059C1.66663 12.4784 1.66663 10.9856 1.66663 8.00008C1.66663 5.01452 1.66663 3.52174 2.59412 2.59424Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.99996 1.66675V2.93341M7.99996 13.0667V14.3334M6.09996 8.00008H9.89996M13.0666 8.00008H14.3333M1.66663 8.00008H2.93329M7.99996 6.10007V9.90008"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SpaceIcon;
