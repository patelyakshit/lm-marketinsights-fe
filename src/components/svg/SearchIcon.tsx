interface SearchIconProps {
  isActive?: boolean;
}

const SearchIcon = ({ isActive = false }: SearchIconProps) => {
  const fillColor = isActive ? "#FFFFFF" : "#171717";

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.5 3C14.6421 3 18 6.35786 18 10.5C18 12.3009 17.3636 13.9522 16.3057 15.2451L21.0605 20L20 21.0605L15.2451 16.3057C13.9522 17.3636 12.3009 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3ZM10.5 4.5C7.18629 4.5 4.5 7.18629 4.5 10.5C4.5 13.8137 7.18629 16.5 10.5 16.5C13.8137 16.5 16.5 13.8137 16.5 10.5C16.5 7.18629 13.8137 4.5 10.5 4.5Z"
        fill={fillColor}
      />
    </svg>
  );
};

export default SearchIcon;
