import React from "react";

interface IconAccordionCollapseProps {
  size?: number;
  color?: string;
  className?: string;
}

const IconAccordionCollapse: React.FC<IconAccordionCollapseProps> = ({
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
        d="M4.66663 13.3333L7.99996 10L11.3333 13.3333"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.66663 2.6665L7.99996 5.99984L11.3333 2.6665"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconAccordionCollapse;
