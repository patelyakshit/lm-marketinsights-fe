import React from "react";

interface MyLocationIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const MyLocationIcon: React.FC<MyLocationIconProps> = ({
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
      <g clipPath="url(#clip0_111_2995)">
        <path
          d="M8.66699 2.03613C11.4478 2.34368 13.6563 4.55214 13.9639 7.33301H15.167V8.66699H13.9639C13.6563 11.4478 11.4478 13.6563 8.66699 13.9639V15.167H7.33301V13.9639C4.55214 13.6563 2.34368 11.4478 2.03613 8.66699H0.833008V7.33301H2.03613C2.34366 4.55213 4.55213 2.34366 7.33301 2.03613V0.833008H8.66699V2.03613ZM8 3.33301C5.42267 3.33301 3.33301 5.42267 3.33301 8C3.33302 10.5773 5.42268 12.667 8 12.667C10.5773 12.667 12.667 10.5773 12.667 8C12.667 5.42268 10.5773 3.33302 8 3.33301ZM8 5.5C9.38069 5.50005 10.5 6.61932 10.5 8C10.5 9.3807 9.38069 10.5 8 10.5C6.61931 10.5 5.5 9.38073 5.5 8C5.5 6.61929 6.61931 5.5 8 5.5Z"
          fill={color}
          fillOpacity="0.9"
        />
      </g>
      <defs>
        <clipPath id="clip0_111_2995">
          <rect width="16" height="16" fill={color} />
        </clipPath>
      </defs>
    </svg>
  );
};

export default MyLocationIcon;
