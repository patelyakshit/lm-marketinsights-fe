import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../design-system";
import { Sidebar, ViewMode } from "./Sidebar";

interface DashboardLayoutProps {
  mapComponent: React.ReactNode;
  chatComponent: React.ReactNode;
  accordionComponent?: React.ReactNode;
  artifactComponent?: React.ReactNode;
  isArtifactActive?: boolean;
  userName?: string;
  userPlan?: string;
  avatarUrl?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  mapComponent,
  chatComponent,
  accordionComponent,
  artifactComponent,
  isArtifactActive = false,
  userName = "Guest User",
  userPlan = "Free Plan",
  avatarUrl,
}) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  const [chatWidth, setChatWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleNewProject = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleSearch = useCallback(() => {
    console.log("Search clicked");
  }, []);

  const handleLibrary = useCallback(() => {
    console.log("Library clicked");
  }, []);

  const handleMyLocations = useCallback(() => {
    console.log("My Locations clicked");
  }, []);

  const handleProfileClick = useCallback(() => {
    console.log("Profile clicked");
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const sidebarWidth = isCollapsed ? 64 : 290;
      const newWidth = e.clientX - sidebarWidth;
      const maxWidth = window.innerWidth * 0.5 - sidebarWidth;
      setChatWidth(Math.max(350, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.body.classList.add("resizing");
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.classList.remove("resizing");
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, isCollapsed]);

  // Chat panel - always rendered once to preserve state, layout changes via CSS
  const renderChatPanel = () => {
    const isFullScreen = viewMode === "chat";
    const isSplit = viewMode === "split";

    // Dynamic styles based on view mode
    const getChatContainerStyles = (): React.CSSProperties => {
      if (isFullScreen) {
        return {
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          backgroundColor: "#fdfcfc",
          opacity: 1,
          pointerEvents: "auto",
          transform: "translateX(0)",
        };
      }
      if (isSplit) {
        return {
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${chatWidth}px`,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          opacity: 1,
          pointerEvents: "auto",
          transform: "translateX(0)",
        };
      }
      // Canvas mode - hide chat with slide out animation
      return {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: `${chatWidth}px`,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        opacity: 0,
        pointerEvents: "none",
        transform: "translateX(-100%)",
      };
    };

    const getChatInnerStyles = (): React.CSSProperties => {
      if (isFullScreen) {
        return {
          width: "100%",
          maxWidth: "740px",
          padding: "0 20px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        };
      }
      return {
        flex: 1,
        backgroundColor: "white",
        borderRadius: "12px",
        border: `1px solid ${colors.neutral[200]}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        margin: "12px",
        marginBottom: "6px",
      };
    };

    return (
      <>
        {/* Chat container - single instance, always mounted */}
        <div
          className="transition-all duration-300 ease-in-out"
          style={getChatContainerStyles()}
        >
          <div style={getChatInnerStyles()}>
            {chatComponent}
          </div>

          {/* Accordion Section - only in split mode */}
          {isSplit && accordionComponent && (
            <div
              className="shrink-0 bg-white rounded-xl border overflow-hidden m-3 mt-1.5"
              style={{
                borderColor: colors.neutral[200],
                maxHeight: "200px",
              }}
            >
              {accordionComponent}
            </div>
          )}
        </div>

        {/* Resizable divider - only visible in split mode */}
        <div
          className={`absolute top-0 bottom-0 z-20 flex items-center cursor-col-resize hover:bg-gray-100 transition-all duration-300 ${
            isResizing ? "bg-blue-50" : ""
          }`}
          style={{
            left: `${chatWidth}px`,
            width: "8px",
            opacity: isSplit ? 1 : 0,
            pointerEvents: isSplit ? "auto" : "none",
          }}
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        >
          <span
            className={`h-10 w-[2.5px] rounded-full transition-colors ${
              isResizing ? "bg-blue-400" : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        </div>
      </>
    );
  };

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ backgroundColor: colors.bg.weaker[25] }}
    >
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        showSegment={true}
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
        <div
          className="absolute inset-0 w-full h-full transition-opacity duration-300"
          style={{
            zIndex: isArtifactActive ? 0 : 1,
            opacity: isArtifactActive || viewMode === "chat" ? 0 : 1,
            pointerEvents:
              isArtifactActive || viewMode === "chat" ? "none" : "auto",
          }}
        >
          <div
            className="w-full h-full m-3 rounded-xl border overflow-hidden"
            style={{
              borderColor: colors.neutral[200],
              backgroundColor: colors.static.white,
              width: "calc(100% - 24px)",
              height: "calc(100% - 24px)",
            }}
          >
            {mapComponent}
          </div>
        </div>

        {/* Chat Panel */}
        {renderChatPanel()}

        {/* Artifact Overlay */}
        {isArtifactActive && artifactComponent && (
          <div className="absolute inset-0 w-full h-full z-20 bg-white">
            {artifactComponent}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardLayout;
