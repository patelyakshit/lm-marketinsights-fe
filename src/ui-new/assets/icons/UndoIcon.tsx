import React from "react";

interface UndoIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const UndoIcon: React.FC<UndoIconProps> = ({
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
        d="M4.85691 5.39745L6.12809 6.66863L5.41931 7.3774L2.93811 4.8962L5.41931 2.41499L6.12809 3.12377L4.85691 4.39494H8.45189C9.51542 4.39494 10.5354 4.81743 11.2874 5.56945C12.0394 6.32148 12.4619 7.34144 12.4619 8.40497C12.4619 9.46849 12.0394 10.4885 11.2874 11.2405C10.5354 11.9925 9.51542 12.415 8.45189 12.415H3.94062V11.4125H8.45189C9.24954 11.4125 10.0145 11.0956 10.5785 10.5316C11.1426 9.96759 11.4594 9.20261 11.4594 8.40497C11.4594 7.60732 11.1426 6.84235 10.5785 6.27833C10.0145 5.71431 9.24954 5.39745 8.45189 5.39745H4.85691Z"
        fill={color}
        fillOpacity="0.9"
      />
    </svg>
  );
};

export default UndoIcon;
