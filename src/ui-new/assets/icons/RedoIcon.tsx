import React from "react";

interface RedoIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const RedoIcon: React.FC<RedoIconProps> = ({
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
        d="M11.1431 5.39745L9.87191 6.66863L10.5807 7.3774L13.0619 4.8962L10.5807 2.41499L9.87191 3.12377L11.1431 4.39494H7.54811C6.48458 4.39494 5.46461 4.81743 4.71259 5.56945C3.96056 6.32148 3.53808 7.34144 3.53808 8.40497C3.53808 9.46849 3.96056 10.4885 4.71259 11.2405C5.46461 11.9925 6.48458 12.415 7.54811 12.415H12.0594V11.4125H7.54811C6.75046 11.4125 5.98549 11.0956 5.42147 10.5316C4.85745 9.96759 4.54059 9.20261 4.54059 8.40497C4.54059 7.60732 4.85745 6.84235 5.42147 6.27833C5.98549 5.71431 6.75046 5.39745 7.54811 5.39745H11.1431Z"
        fill={color}
        fillOpacity="0.9"
      />
    </svg>
  );
};

export default RedoIcon;
