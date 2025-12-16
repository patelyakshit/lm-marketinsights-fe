import React from "react";

interface MyLocationsIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const MyLocationsIcon: React.FC<MyLocationsIconProps> = ({
  size = 20,
  color = "#7E7977",
  className = "",
}) => {
  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M12.6073 11.4557C12.4668 11.591 12.279 11.6667 12.0835 11.6667C11.888 11.6667 11.7001 11.591 11.5596 11.4557C10.2727 10.2087 8.54806 8.81567 9.38914 6.79322C9.84389 5.69972 10.9355 5 12.0835 5C13.2315 5 14.3231 5.69972 14.7778 6.79322C15.6178 8.81308 13.8974 10.2129 12.6073 11.4557Z"
          stroke={color}
          strokeWidth="1.25"
        />
        <path
          d="M12 8V7.5"
          stroke={color}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          d="M2.08337 10C2.08337 6.26809 2.08337 4.40212 3.24274 3.24274C4.40212 2.08337 6.26809 2.08337 10 2.08337C13.732 2.08337 15.598 2.08337 16.7574 3.24274C17.9167 4.40212 17.9167 6.26809 17.9167 10C17.9167 13.732 17.9167 15.598 16.7574 16.7574C15.598 17.9167 13.732 17.9167 10 17.9167C6.26809 17.9167 4.40212 17.9167 3.24274 16.7574C2.08337 15.598 2.08337 13.732 2.08337 10Z"
          stroke={color}
          strokeWidth="1.25"
        />
        <path
          d="M14.1667 17.5L2.5 5.83337"
          stroke={color}
          strokeWidth="1.25"
        />
        <path
          d="M8.33337 11.6666L3.33337 16.6666"
          stroke={color}
          strokeWidth="1.25"
        />
      </svg>
    </>
  );
};

export default MyLocationsIcon;
