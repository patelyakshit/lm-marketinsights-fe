import React from "react";

interface MegaphoneIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const MegaphoneIcon: React.FC<MegaphoneIconProps> = ({
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
        d="M4.66663 6.33325C5.21891 6.33325 5.66663 5.88554 5.66663 5.33325C5.66663 4.78097 5.21891 4.33325 4.66663 4.33325C4.11434 4.33325 3.66663 4.78097 3.66663 5.33325C3.66663 5.88554 4.11434 6.33325 4.66663 6.33325Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.9985 7.33333C14 7.64673 14 7.97953 14 8.33333C14 11.3189 14 12.8117 13.0726 13.7392C12.145 14.6667 10.6522 14.6667 7.66671 14.6667C4.68115 14.6667 3.18837 14.6667 2.26087 13.7392C1.33337 12.8117 1.33337 11.3189 1.33337 8.33333C1.33337 5.34777 1.33337 3.85499 2.26087 2.92749C3.18837 2 4.68115 2 7.66671 2C8.02051 2 8.35331 2 8.66671 2.00154"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.3333 1.33325L12.5053 1.79794C12.7307 2.40727 12.8435 2.71193 13.0657 2.93418C13.288 3.15643 13.5927 3.26917 14.202 3.49464L14.6667 3.66659L14.202 3.83853C13.5927 4.06401 13.288 4.17675 13.0657 4.39899C12.8435 4.62124 12.7307 4.92591 12.5053 5.53523L12.3333 5.99992L12.1614 5.53523C11.9359 4.92591 11.8232 4.62124 11.6009 4.39899C11.3787 4.17675 11.074 4.06401 10.4647 3.83853L10 3.66659L10.4647 3.49464C11.074 3.26917 11.3787 3.15643 11.6009 2.93418C11.8232 2.71193 11.9359 2.40727 12.1614 1.79794L12.3333 1.33325Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 14.3332C5.91497 10.8499 9.18273 6.2559 13.9983 9.3615"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MegaphoneIcon;
