import React from "react";

export interface InfoIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const InfoIcon: React.FC<InfoIconProps> = ({
  size = 16,
  color = "#171717",
  className,
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
        d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2ZM8 7C8.41421 7 8.75 7.33579 8.75 7.75V10.25C8.75 10.6642 8.41421 11 8 11C7.58579 11 7.25 10.6642 7.25 10.25V7.75C7.25 7.33579 7.58579 7 8 7ZM8 5C7.58579 5 7.25 5.33579 7.25 5.75C7.25 6.16421 7.58579 6.5 8 6.5C8.41421 6.5 8.75 6.16421 8.75 5.75C8.75 5.33579 8.41421 5 8 5Z"
        fill={color}
      />
    </svg>
  );
};

export default InfoIcon;
