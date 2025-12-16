import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { CircleQuestionMark, Settings } from "lucide-react";
import { cn } from "../lib/utils";
import TooltipText from "./TooltipText";
import ChatIcon from "./svg/ChatIcon";
import { useTabContext } from "../hooks/useTabContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MyProfileIcon from "./svg/MyProfileIcon";
import SettingIcon from "./svg/SettingIcon";
import SignOutIcon from "./svg/SignOutIcon";
import LayerIcon from "./svg/LayerIcon";
import MapKeyIcons from "./svg/MapKeyIcons";
import AnalyzeIcon from "./svg/AnalyzeIcon";

export interface SidebarItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  badge?: string | number;
}

export interface SidebarProps {
  className?: string;
  onItemSelect?: (itemId: string) => void;
  defaultSelected?: string;
  items?: SidebarItem[];
}
const profileOptions = [
  {
    id: "my_profile",
    icon: <MyProfileIcon />,
    label: "My Profile",
    disable: true,
  },
  {
    id: "account_settings",
    icon: <SettingIcon />,
    label: "Account Settings",
    disable: true,
  },

  { id: "sign_out", icon: <SignOutIcon />, label: "Sign Out", disable: false },
];

const SidebarItem: React.FC<{
  item: SidebarItem;
  isSelected: boolean;
  onSelect: (itemId: string) => void;
}> = ({ item, isSelected, onSelect }) => {
  const IconComponent = item.icon;

  const handleClick = useCallback(() => {
    if (!item.disabled) {
      onSelect(item.id);
    }
  }, [item.disabled, item.id, onSelect]);

  return (
    <TooltipText toolTipText={item.label} side="right">
      <button
        onClick={handleClick}
        disabled={item.disabled}
        className={cn(
          "relative w-7.5 h-7.5 rounded-lg transition-all duration-300 ease-in-out",
          "flex items-center justify-center group",
          "focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isSelected
            ? "bg-white rounded-[8px] shadow-[0_-1px_1px_-0.5px_rgba(51,51,51,0.06)_inset,0_0_0_1px_rgba(51,51,51,0.04),0_4px_8px_-2px_rgba(51,51,51,0.06),0_2px_4px_0_rgba(51,51,51,0.04),0_1px_2px_0_rgba(51,51,51,0.04)]"
            : "hover:bg-gray-100",
        )}
        aria-label={item.label}
        aria-pressed={isSelected}
        title={item.label}
        role="button"
        tabIndex={0}
      >
        <IconComponent
          color={isSelected ? "#71330A" : "#000000"}
          strokeWidth={1.8}
          size={15}
        />

        {item.badge && (
          <div
            className={cn(
              "absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-medium",
              "flex items-center justify-center",
              isSelected ? "bg-[#FA7319] text-white" : "bg-gray-500 text-white",
            )}
          >
            {item.badge}
          </div>
        )}
      </button>
    </TooltipText>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  onItemSelect,
  defaultSelected = "",
  items: customItems,
}) => {
  const [selectedItem, setSelectedItem] = useState<string>(defaultSelected);
  const { createTab } = useTabContext();
  const [isAvatarPopoverOpen, setIsAvatarPopoverOpen] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState({ top: 0, left: 0 });
  const popoverAvatarRef = useRef<HTMLDivElement | null>(null);
  const avatarRef = useRef<HTMLButtonElement | null>(null);

  const handleClickAvatar = () => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      const popoverHeight = 120;
      setAvatarPosition({
        top: rect.top - popoverHeight,
        left: rect.right + 7,
      });
    }

    setIsAvatarPopoverOpen((prev) => {
      return !prev;
    });
  };

  useEffect(() => {
    const handleClickOutsideAvatar = (event: MouseEvent) => {
      if (
        isAvatarPopoverOpen &&
        popoverAvatarRef.current &&
        !popoverAvatarRef.current.contains(event.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setIsAvatarPopoverOpen(false);
      }
    };

    if (isAvatarPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutsideAvatar);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideAvatar);
    };
  }, [isAvatarPopoverOpen]);

  const defaultItems: SidebarItem[] = [
    {
      id: "chat",
      icon: ChatIcon,
      label: "Chatbot",
      isActive: false,
    },
    {
      id: "layers",
      icon: LayerIcon,
      label: "Manage Layers",
      isActive: false,
    },
    {
      id: "map_keys",
      icon: MapKeyIcons,
      label: "Map Keys",
      isActive: false,
    },
    {
      id: "grid",
      icon: AnalyzeIcon,
      label: "Analyze",
      isActive: false,
    },
  ];

  const sidebarItems = useMemo(
    () => customItems || defaultItems,
    [customItems],
  );

  const handleItemSelect = useCallback(
    (itemId: string) => {
      setSelectedItem(itemId);

      // Find the selected item and create a tab
      const selectedItem = sidebarItems.find((item) => item.id === itemId);
      if (selectedItem) {
        createTab(selectedItem);
      }

      onItemSelect?.(itemId);
    },
    [onItemSelect, sidebarItems, createTab],
  );

  return (
    <div className="flex flex-col justify-between">
      <nav
        data-sidebar
        className={cn(
          "flex flex-col gap-2 pr-2 pl-1 items-center z-1",
          "min-w-[45px] py-2",
          "bg-white/50 backdrop-blur-sm rounded-lg",
          className,
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isSelected={selectedItem === item.id}
            onSelect={handleItemSelect}
          />
        ))}
      </nav>
      <div className="relative flex flex-col gap-4 items-center">
        <CircleQuestionMark strokeWidth={1.6} size={18} />
        <Settings strokeWidth={1.6} size={18} />
        <div className="w-6 h-px bg-gray-300"></div>
        <button
          ref={avatarRef}
          onClick={handleClickAvatar}
          className="cursor-pointer focus:outline-none"
          type="button"
        >
          <Avatar className="h-[26px] w-[26px]">
            <AvatarImage src="https://i.pravatar.cc/150?img=4" alt="avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </button>
        {isAvatarPopoverOpen && (
          <div
            ref={popoverAvatarRef}
            className="fixed w-[208px] bg-white shadow-lg rounded-[8px] border border-gray-200 z-[9999]"
            style={{
              top: `${avatarPosition.top}px`,
              left: `${avatarPosition.left}px`,
            }}
          >
            <div className="flex flex-col gap-1.5 py-2">
              {profileOptions.map((val) =>
                val.disable ? (
                  <TooltipText
                    key={val.id}
                    toolTipText="Coming Soon"
                    side="right"
                  >
                    <div
                      className={`${
                        val.id === "sign_out"
                          ? "border-t border-gray-200 pt-1.5"
                          : ""
                      } opacity-40`}
                    >
                      <div className="flex gap-3 items-center px-4 py-2 text-sm hover:bg-gray-100">
                        {val.icon}
                        <button
                          className={`${
                            val.id === "sign_out"
                              ? "text-[#E91616]"
                              : "text-gray-700"
                          }`}
                          disabled={true}
                        >
                          {val.label}
                        </button>
                      </div>
                    </div>
                  </TooltipText>
                ) : (
                  <div
                    key={val.id}
                    className={
                      val.id === "sign_out"
                        ? "border-t border-gray-200 pt-1.5"
                        : ""
                    }
                  >
                    <div className="flex gap-3 items-center px-4 py-2 text-sm hover:bg-gray-100">
                      {val.icon}
                      <button
                        className={`${
                          val.id === "sign_out"
                            ? "text-[#E91616]"
                            : "text-gray-700"
                        } cursor-pointer`}
                      >
                        {val.label}
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
