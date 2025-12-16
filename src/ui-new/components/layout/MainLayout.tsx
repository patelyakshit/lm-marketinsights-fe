import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../design-system";
import { Sidebar, ViewMode } from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  showSegment?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  userName?: string;
  userPlan?: string;
  avatarUrl?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showSegment = false,
  viewMode = "chat",
  onViewModeChange,
  userName = "Guest User",
  userPlan = "Free Plan",
  avatarUrl,
}) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleNewProject = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleSearch = useCallback(() => {
    // TODO: Implement search functionality
    console.log("Search clicked");
  }, []);

  const handleLibrary = useCallback(() => {
    // TODO: Implement library functionality
    console.log("Library clicked");
  }, []);

  const handleMyLocations = useCallback(() => {
    // TODO: Implement my locations (coming soon)
    console.log("My Locations clicked");
  }, []);

  const handleProfileClick = useCallback(() => {
    // TODO: Implement profile menu
    console.log("Profile clicked");
  }, []);

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ backgroundColor: colors.bg.weaker[25] }}
    >
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        showSegment={showSegment}
        onNewProject={handleNewProject}
        onSearch={handleSearch}
        onLibrary={handleLibrary}
        onMyLocations={handleMyLocations}
        userName={userName}
        userPlan={userPlan}
        avatarUrl={avatarUrl}
        onProfileClick={handleProfileClick}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-full overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
