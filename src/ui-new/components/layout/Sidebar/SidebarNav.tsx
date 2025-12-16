import React from "react";
import SidebarNavItem from "./SidebarNavItem";
import {
  NewProjectIcon,
  SearchIcon,
  LibraryIcon,
  MyLocationsIcon,
} from "../../../assets/icons";

interface SidebarNavProps {
  onNewProject?: () => void;
  onSearch?: () => void;
  onLibrary?: () => void;
  onMyLocations?: () => void;
  activeItem?: string;
  isCollapsed?: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  onNewProject,
  onSearch,
  onLibrary,
  onMyLocations,
  activeItem,
  isCollapsed = false,
}) => {
  const allNavItems = [
    {
      id: "new-project",
      icon: NewProjectIcon,
      label: "New project",
      onClick: onNewProject,
      disabled: false,
    },
    {
      id: "search",
      icon: SearchIcon,
      label: "Search",
      onClick: onSearch,
      disabled: false,
    },
    {
      id: "library",
      icon: LibraryIcon,
      label: "Library",
      onClick: onLibrary,
      disabled: false,
    },
    {
      id: "my-locations",
      icon: MyLocationsIcon,
      label: "My Locations",
      onClick: onMyLocations,
      disabled: true,
      badge: "Soon",
      hideWhenCollapsed: true,
    },
  ];

  const navItems = isCollapsed
    ? allNavItems.filter((item) => !item.hideWhenCollapsed)
    : allNavItems;

  return (
    <div className="w-full flex flex-col" style={{ padding: "12px 0" }}>
      {navItems.map((item) => (
        <SidebarNavItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          onClick={item.onClick}
          isActive={activeItem === item.id}
          disabled={item.disabled}
          badge={item.badge}
          isCollapsed={isCollapsed}
        />
      ))}
    </div>
  );
};

export default SidebarNav;
