interface ArrowUpIconProps {
  isEnabled?: boolean;
  size?: number;
  className?: string;
}

const ArrowUpIcon = ({
  isEnabled = true,
  size = 32,
  className = "",
}: ArrowUpIconProps) => {
  const backgroundFill = isEnabled ? "#171717" : "#EBEBEB";
  const arrowFill = isEnabled ? "#FFFFFF" : "#A3A3A3";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16Z"
        fill={backgroundFill}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.2177 14.4345C9.92742 14.7227 9.92742 15.19 10.2177 15.4782C10.508 15.7664 10.9787 15.7664 11.2691 15.4782L15.2566 11.5196L15.2566 22.262C15.2566 22.6696 15.5894 23 16 23C16.4105 23 16.7434 22.6696 16.7434 22.262L16.7434 11.5196L20.7309 15.4782C21.0213 15.7664 21.4919 15.7664 21.7823 15.4782C22.0726 15.19 22.0726 14.7227 21.7823 14.4345L16.5257 9.21615C16.2353 8.92795 15.7647 8.92794 15.4743 9.21615L10.2177 14.4345Z"
        fill={arrowFill}
      />
    </svg>
  );
};

export default ArrowUpIcon;
