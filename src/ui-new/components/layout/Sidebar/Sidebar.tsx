import React from "react";
import { colors } from "../../../design-system";
import SidebarHeader from "./SidebarHeader";
import SidebarNav from "./SidebarNav";
import SidebarSegment, { ViewMode } from "./SidebarSegment";
import SidebarFooter from "./SidebarFooter";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onNewProject?: () => void;
  onSearch?: () => void;
  onLibrary?: () => void;
  onMyLocations?: () => void;
  activeNavItem?: string;
  userName?: string;
  userPlan?: string;
  avatarUrl?: string;
  onProfileClick?: () => void;
  showSegment?: boolean;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  viewMode = "chat",
  onViewModeChange,
  onNewProject,
  onSearch,
  onLibrary,
  onMyLocations,
  activeNavItem,
  userName,
  userPlan,
  avatarUrl,
  onProfileClick,
  showSegment = true,
  className = "",
}) => {
  return (
    <aside
      className={`h-full flex flex-col shrink-0 ${className}`}
      style={{
        width: isCollapsed ? "52px" : "290px",
        minWidth: isCollapsed ? "52px" : "250px",
        maxWidth: isCollapsed ? "52px" : "320px",
        backgroundColor: colors.neutral[50],
        borderRight: `1px solid ${colors.neutral[200]}`,
        transition: "width 200ms ease-in-out",
      }}
    >
      <div className="flex flex-col h-full w-full overflow-hidden rounded-[inherit]">
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />

        <div className="flex-1 min-h-0 overflow-y-auto">
          <SidebarNav
            isCollapsed={isCollapsed}
            onNewProject={onNewProject}
            onSearch={onSearch}
            onLibrary={onLibrary}
            onMyLocations={onMyLocations}
            activeItem={activeNavItem}
          />
        </div>

        <div className="flex flex-col shrink-0">
          {showSegment && onViewModeChange && (
            <SidebarSegment
              isCollapsed={isCollapsed}
              activeMode={viewMode}
              onModeChange={onViewModeChange}
            />
          )}

          <SidebarFooter
            isCollapsed={isCollapsed}
            userName={userName}
            userPlan={userPlan}
            avatarUrl={avatarUrl}
            onProfileClick={onProfileClick}
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
