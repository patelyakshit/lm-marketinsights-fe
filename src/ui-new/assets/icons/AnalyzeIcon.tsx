import React from "react";

interface AnalyzeIconProps {
  isActive?: boolean;
  size?: number;
  className?: string;
}

const AnalyzeIcon: React.FC<AnalyzeIconProps> = ({
  isActive = false,
  size = 20,
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
        d="M7.49996 7.50002L4.16663 4.16669M13.3333 10H18.3333M9.99996 13.3334V18.3334"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M9.99996 13.3334C11.8409 13.3334 13.3333 11.841 13.3333 10C13.3333 8.15907 11.8409 6.66669 9.99996 6.66669C8.15901 6.66669 6.66663 8.15907 6.66663 10C6.66663 11.841 8.15901 13.3334 9.99996 13.3334Z"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M9.99996 18.3334C14.6023 18.3334 18.3333 14.6024 18.3333 10C18.3333 5.39765 14.6023 1.66669 9.99996 1.66669C5.39759 1.66669 1.66663 5.39765 1.66663 10C1.66663 14.6024 5.39759 18.3334 9.99996 18.3334Z"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default AnalyzeIcon;
