import React from "react";

interface HomeMapIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const HomeMapIcon: React.FC<HomeMapIconProps> = ({
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
        d="M8.00009 1.16406C8.36402 1.16406 8.71642 1.29252 8.99482 1.5267L14.935 6.52344L14.9838 6.56902C15.2135 6.80587 15.2309 7.18307 15.0138 7.44074C14.807 7.6858 14.4578 7.7394 14.1895 7.584V12.8783C14.1895 13.9565 13.3145 14.8307 12.2351 14.8307H10.0001V9.9974C10.0001 9.6292 9.70155 9.33074 9.33342 9.33074H6.66675C6.29853 9.33074 6.00005 9.6292 6.00005 9.9974V14.8307H3.76503C2.68561 14.8307 1.8106 13.9565 1.8106 12.8783V7.584C1.54229 7.7394 1.19316 7.6858 0.98638 7.44074C0.75474 7.16594 0.790167 6.755 1.06516 6.52344L7.00589 1.5267L7.11335 1.44402C7.37222 1.26256 7.68162 1.16407 8.00009 1.16406Z"
        fill={color}
        fillOpacity="0.9"
      />
    </svg>
  );
};

export default HomeMapIcon;
