interface VoiceModeIconProps {
  isEnabled?: boolean;
  size?: number;
  className?: string;
  backgroundColor?: string;
  iconColor?: string;
}

const VoiceModeIcon = ({
  size = 28,
  className = "",
  backgroundColor = "#2A2623",
  iconColor = "white",
}: VoiceModeIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="28" height="28" rx="14" fill={backgroundColor} />
      <path
        d="M11.5 8.5V19.5"
        stroke={iconColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 11V17"
        stroke={iconColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10V18"
        stroke={iconColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 12V16"
        stroke={iconColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 11V17"
        stroke={iconColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default VoiceModeIcon;
