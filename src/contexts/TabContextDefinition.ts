import { createContext } from "react";
import { SidebarItem } from "../components/Sidebar";

export interface Tab {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string;
  createTab: (item: SidebarItem) => void;
  selectTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  getSidebarItems: () => SidebarItem[];
}

export const TabContext = createContext<TabContextType | undefined>(undefined);
