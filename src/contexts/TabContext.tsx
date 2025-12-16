import React, { useState, useCallback, ReactNode } from "react";
import { CirclePlus, Layers2, LayoutGrid, ListCollapse } from "lucide-react";
import { SidebarItem } from "../components/Sidebar";
import ChatIcon from "../components/svg/ChatIcon";
import { TabContext, Tab } from "./TabContextDefinition";

interface TabContextType {
  tabs: Tab[];
  activeTabId: string;
  createTab: (item: SidebarItem) => void;
  selectTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  getSidebarItems: () => SidebarItem[];
}

interface TabProviderProps {
  children: ReactNode;
}

export const TabProvider: React.FC<TabProviderProps> = ({ children }) => {
  // Initialize with chat tab always present
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "chat",
      title: "Chatbot",
      icon: ChatIcon,
      isActive: true,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("chat");

  const createTab = useCallback(
    (item: SidebarItem) => {
      // Check if tab already exists
      const existingTab = tabs.find((tab) => tab.id === item.id);

      if (existingTab) {
        // Activate existing tab
        setActiveTabId(item.id);
        setTabs((prev) =>
          prev.map((tab) => ({ ...tab, isActive: tab.id === item.id })),
        );
      } else {
        // Create new tab
        const newTab: Tab = {
          id: item.id,
          title: item.label,
          icon: item.icon,
          isActive: true,
        };

        // Deactivate all other tabs
        const updatedTabs = tabs.map((tab) => ({ ...tab, isActive: false }));
        updatedTabs.push(newTab);

        setTabs(updatedTabs);
        setActiveTabId(item.id);
      }
    },
    [tabs],
  );

  const selectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    setTabs((prev) =>
      prev.map((tab) => ({ ...tab, isActive: tab.id === tabId })),
    );
  }, []);

  const closeTab = useCallback(
    (tabId: string) => {
      // Prevent closing the chat tab
      if (tabId === "chat") {
        return;
      }

      const updatedTabs = tabs.filter((tab) => tab.id !== tabId);

      if (updatedTabs.length > 0) {
        // If we're closing the active tab, activate the first remaining tab
        if (activeTabId === tabId) {
          const newActiveTab = updatedTabs[0];
          setActiveTabId(newActiveTab.id);
          setTabs((prev) =>
            prev.map((tab) => ({
              ...tab,
              isActive: tab.id === newActiveTab.id,
            })),
          );
        }
      } else {
        // If no tabs left, activate chat tab (should always exist)
        setActiveTabId("chat");
        setTabs((prev) =>
          prev.map((tab) => ({
            ...tab,
            isActive: tab.id === "chat",
          })),
        );
      }

      setTabs(updatedTabs);
    },
    [tabs, activeTabId],
  );

  const getSidebarItems = useCallback(() => {
    return [
      {
        id: "chat",
        icon: ChatIcon,
        label: "Chatbot",
        isActive: false,
      },
      {
        id: "add",
        icon: CirclePlus,
        label: "Add Layer",
        isActive: false,
      },
      {
        id: "layers",
        icon: Layers2,
        label: "Manage Layers",
        isActive: false,
      },
      {
        id: "grid",
        icon: LayoutGrid,
        label: "Grid View",
        isActive: false,
      },
      {
        id: "list",
        icon: ListCollapse,
        label: "List View",
        isActive: false,
      },
    ];
  }, []);

  const value: TabContextType = {
    tabs,
    activeTabId,
    createTab,
    selectTab,
    closeTab,
    getSidebarItems,
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};
