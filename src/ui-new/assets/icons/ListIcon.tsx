import React from "react";

interface ListIconProps {
  isActive?: boolean;
  size?: number;
  className?: string;
}

const ListIcon: React.FC<ListIconProps> = ({
  isActive = false,
  size = 20,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M15.8337 3.33325H4.16699C3.39043 3.33325 3.00214 3.33325 2.69585 3.46012C2.28748 3.62928 1.96302 3.95374 1.79386 4.36211C1.66699 4.6684 1.66699 5.05669 1.66699 5.83325C1.66699 6.60982 1.66699 6.9981 1.79386 7.30439C1.96302 7.71277 2.28748 8.03723 2.69585 8.20639C3.00214 8.33325 3.39043 8.33325 4.16699 8.33325H15.8337C16.6102 8.33325 16.9985 8.33325 17.3048 8.20639C17.7132 8.03723 18.0377 7.71277 18.2068 7.30439C18.3337 6.9981 18.3337 6.60982 18.3337 5.83325C18.3337 5.05669 18.3337 4.6684 18.2068 4.36211C18.0377 3.95374 17.7132 3.62928 17.3048 3.46012C16.9985 3.33325 16.6102 3.33325 15.8337 3.33325Z"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.1667 11H4.5C3.72343 11 3.33515 11 3.02886 11.1268C2.62048 11.296 2.29603 11.6205 2.12687 12.0288C2 12.3352 2 12.7234 2 13.5C2 14.2766 2 14.6648 2.12687 14.9712C2.29603 15.3795 2.62048 15.704 3.02886 15.8732C3.33515 16 3.72343 16 4.5 16H16.1667C16.9432 16 17.3315 16 17.6378 15.8732C18.0462 15.704 18.3707 15.3795 18.5398 14.9712C18.6667 14.6648 18.6667 14.2766 18.6667 13.5C18.6667 12.7234 18.6667 12.3352 18.5398 12.0288C18.3707 11.6205 18.0462 11.296 17.6378 11.1268C17.3315 11 16.9432 11 16.1667 11Z"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 14.1667H5.00833"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33301 14.1667H8.34134"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 5.83325H5.00833"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33301 5.83325H8.34134"
        stroke={isActive ? "#1d1916" : "#545251"}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ListIcon;
