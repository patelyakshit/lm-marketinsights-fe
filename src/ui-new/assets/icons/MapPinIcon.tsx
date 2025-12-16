import React from "react";

interface MapPinIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const MapPinIcon: React.FC<MapPinIconProps> = ({
  size = 16,
  color = "#FF7700",
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
        d="M8 12V14.6667"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.66671 12L3.33337 14.6667"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.33337 12L12.6667 14.6667"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.66663 7.99992C1.66663 9.88552 1.66663 10.8283 2.25241 11.4141C2.8382 11.9999 3.78101 11.9999 5.66663 11.9999H10.3333C12.2189 11.9999 13.1617 11.9999 13.7475 11.4141C14.3333 10.8283 14.3333 9.88552 14.3333 7.99992V5.33325C14.3333 3.44763 14.3333 2.50483 13.7475 1.91904C13.1617 1.33325 12.2189 1.33325 10.3333 1.33325H5.66663C3.78101 1.33325 2.8382 1.33325 2.25241 1.91904C1.66663 2.50483 1.66663 3.44763 1.66663 5.33325V7.99992Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.33337 8.66675V6.66675M8.00004 8.66675V4.66675M10.6667 8.66675V7.33341"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MapPinIcon;
