import React from "react";

interface FileTextIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const FileTextIcon: React.FC<FileTextIconProps> = ({
  size = 16,
  color = "#A6A3A0",
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
        d="M12.6667 7.33539V6.66659C12.6667 4.15243 12.6667 2.89535 11.8856 2.1143C11.1046 1.33325 9.84747 1.33325 7.33333 1.33325H6.67213L2 5.99091V9.33739C2 11.8475 2 13.1026 2.77874 13.8833L2.78336 13.8879C3.56401 14.6666 4.81907 14.6666 7.3292 14.6666"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 6.00138H2.66667C4.55229 6.00138 5.49509 6.00138 6.08088 5.4156C6.66667 4.82981 6.66667 3.887 6.66667 2.00138V1.33472"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.9379 14.399C11.0794 14.7578 11.5871 14.7578 11.7287 14.399L11.7531 14.3368C12.0987 13.4605 12.7924 12.7669 13.6687 12.4213L13.7309 12.3967C14.0896 12.2553 14.0896 11.7475 13.7309 11.606L13.6687 11.5815C12.7924 11.2359 12.0987 10.5423 11.7531 9.66602L11.7287 9.60382C11.5871 9.24502 11.0794 9.24502 10.9379 9.60382L10.9134 9.66602C10.5678 10.5423 9.87414 11.2359 8.99788 11.5815L8.93568 11.606C8.57694 11.7475 8.57694 12.2553 8.93568 12.3967L8.99788 12.4213C9.87414 12.7669 10.5678 13.4605 10.9134 14.3368L10.9379 14.399Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default FileTextIcon;
