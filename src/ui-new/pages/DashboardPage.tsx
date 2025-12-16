import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// New UI components
import {
  Sidebar,
  CanvasPanel,
  ChatContainer,
} from "../components/layout";
import { colors } from "../design-system";
import { usePromptContext } from "../../hooks/usePromptContext";
import { useViewMode, type ViewMode } from "../../contexts/ViewModeContext";

const VIEW_MODE_STORAGE_KEY = "dashboard-view-mode";
const SPLIT_WIDTH_STORAGE_KEY = "dashboard-split-width";
const JUST_LOGGED_IN_KEY = "just-logged-in";

const DashboardPage: React.FC = () => {
  const router = useNavigate();
  const { hasStartedChat, setHasStartedChat } = usePromptContext();
  const { viewMode, setViewMode } = useViewMode();

  // Sidebar is only expanded when user just logged in, collapsed otherwise
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const justLoggedIn = sessionStorage.getItem(JUST_LOGGED_IN_KEY);
    if (justLoggedIn === "true") {
      // Clear the flag immediately so subsequent interactions keep sidebar collapsed
      sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
      return false; // Expanded
    }
    return true; // Collapsed by default
  });

  // Initialize viewMode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (saved && (saved === "chat" || saved === "split" || saved === "canvas")) {
      setViewMode(saved as ViewMode);
    }
  }, [setViewMode]);

  const [splitWidthPercent, setSplitWidthPercent] = useState(() => {
    const saved = localStorage.getItem(SPLIT_WIDTH_STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      return Math.max(30, Math.min(50, parsed));
    }
    return 30;
  });
  const [isResizing, setIsResizing] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);

    if (viewMode === "split") {
      const saved = localStorage.getItem(SPLIT_WIDTH_STORAGE_KEY);
      if (!saved) {
        setSplitWidthPercent(30);
      }
    }
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(SPLIT_WIDTH_STORAGE_KEY, splitWidthPercent.toString());
  }, [splitWidthPercent]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!mainContentRef.current) return;

      const rect = mainContentRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percentWidth = (relativeX / rect.width) * 100;

      const clampedPercent = Math.max(30, Math.min(50, percentWidth));
      setSplitWidthPercent(clampedPercent);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.body.classList.add("resizing");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.classList.remove("resizing");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      setIsCollapsed(true);

      if (mode === "canvas" && !hasStartedChat) {
        setHasStartedChat(false);
      }
    },
    [hasStartedChat, setHasStartedChat],
  );

  const handleNewProject = useCallback(() => {
    router("/");
  }, [router]);

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

  // All components are always rendered to preserve state
  // Visibility is controlled via CSS transitions
  const renderContent = () => {
    const isChat = viewMode === "chat";
    const isCanvas = viewMode === "canvas";
    const isSplit = viewMode === "split";

    return (
      <div
        ref={mainContentRef}
        className="w-full h-full relative"
        style={{ backgroundColor: "#fdfcfc" }}
      >
        {/* Chat Container - Always mounted, visibility controlled by CSS */}
        <div
          className="absolute inset-0 transition-all duration-300 ease-in-out"
          style={{
            // Full screen centered in chat mode
            // Left panel in split mode
            // Hidden (slide left) in canvas mode
            width: isSplit ? `${splitWidthPercent}%` : "100%",
            opacity: isCanvas ? 0 : 1,
            pointerEvents: isCanvas ? "none" : "auto",
            transform: isCanvas ? "translateX(-100%)" : "translateX(0)",
            zIndex: isChat ? 10 : 5,
            borderRight: isSplit ? "1px solid #eceae9" : "none",
          }}
        >
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              paddingLeft: isSplit ? "12px" : "0",
              paddingRight: isSplit ? "12px" : "0",
              paddingBottom: isSplit ? "12px" : "0",
            }}
          >
            <ChatContainer
              className="w-full h-full"
              isCompact={isSplit}
            />
          </div>
        </div>

        {/* Resize Divider - Only visible in split mode */}
        <div
          className={`absolute top-0 bottom-0 flex items-center justify-center cursor-col-resize z-20 transition-opacity duration-300 ${
            isResizing ? "bg-transparent" : ""
          }`}
          style={{
            left: `${splitWidthPercent}%`,
            width: "4px",
            marginLeft: "-2px",
            opacity: isSplit ? 1 : 0,
            pointerEvents: isSplit ? "auto" : "none",
          }}
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        >
          <span
            className={`h-16 w-[2px] rounded-full transition-opacity ${
              isResizing
                ? "bg-gray-400 opacity-100"
                : "bg-gray-300 opacity-0 hover:opacity-100"
            }`}
          />
        </div>

        {/* Canvas Panel - Always mounted, visibility controlled by CSS */}
        <div
          className="absolute top-0 right-0 bottom-0 transition-all duration-300 ease-in-out"
          style={{
            // Full screen in canvas mode
            // Right panel in split mode
            // Hidden in chat mode
            width: isSplit ? `${100 - splitWidthPercent}%` : "100%",
            left: isSplit ? `${splitWidthPercent}%` : "0",
            opacity: isChat ? 0 : 1,
            pointerEvents: isChat ? "none" : "auto",
            transform: isChat ? "translateX(100%)" : "translateX(0)",
            zIndex: isCanvas ? 10 : 5,
          }}
        >
          <CanvasPanel className="w-full h-full" />
        </div>
      </div>
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
        userName="Guest User"
        userPlan="Free Plan"
        onProfileClick={handleProfileClick}
      />

      <main className="flex-1 min-w-0 h-full overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default DashboardPage;
