import React from "react";

interface SearchIconSmallProps {
  size?: number;
  color?: string;
  className?: string;
}

const SearchIconSmall: React.FC<SearchIconSmallProps> = ({
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
      <circle cx="7" cy="7" r="4.5" stroke={color} strokeWidth="1.5" />
      <path
        d="M10.5 10.5L14 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default SearchIconSmall;
