/**
 * Layout Components Index
 * Export all layout components
 */

export { Header } from "./Header";
export type { HeaderProps } from "./Header";

// Sidebar components
export {
  Sidebar,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  SidebarSegment,
  SidebarFooter,
} from "./Sidebar";
export type { ViewMode } from "./Sidebar";

// Layout wrappers
export { default as MainLayout } from "./MainLayout";
export { default as DashboardLayout } from "./DashboardLayout";

// Panel components
export { default as ChatPanel } from "./ChatPanel";
export { default as CanvasPanel } from "./CanvasPanel";
export { default as ChatLandingPanel } from "./ChatLandingPanel";
export { default as ChatContainer } from "./ChatContainer";
export { default as ToolsInsightsPanel } from "./ToolsInsightsPanel";
export { default as AddDataSidePanel } from "./AddDataSidePanel";
