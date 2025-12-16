import React from "react";

interface IconAccordionExpandProps {
  size?: number;
  color?: string;
  className?: string;
}

const IconAccordionExpand: React.FC<IconAccordionExpandProps> = ({
  size = 16,
  color = "currentColor",
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
        d="M4.66663 9.99992L7.99996 13.3333L11.3333 9.99992"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.66663 6L7.99996 2.66667L11.3333 6"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconAccordionExpand;
