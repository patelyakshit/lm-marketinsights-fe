import React, { useState, useRef, useEffect } from "react";
import { CircleQuestionMark, Settings } from "lucide-react";
import { cn } from "../lib/utils";
import TooltipText from "./TooltipText";
import LmLogo from "./svg/LmLogo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MyProfileIcon from "./svg/MyProfileIcon";
import SettingIcon from "./svg/SettingIcon";
import SignOutIcon from "./svg/SignOutIcon";
import SidebarIcon from "./svg/SidebarIcon";
import { useNavigate } from "react-router-dom";

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

export interface TopBarProps {
  className?: string;
}

const TopBar: React.FC<TopBarProps> = ({ className }) => {
  const [isAvatarPopoverOpen, setIsAvatarPopoverOpen] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState({ top: 0, right: 0 });
  const popoverAvatarRef = useRef<HTMLDivElement | null>(null);
  const avatarRef = useRef<HTMLButtonElement | null>(null);
  const router = useNavigate();

  const handleClickAvatar = () => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      const popoverWidth = 208;
      const popoverHeight = 120;
      const offset = 8;

      const top = rect.bottom + offset;
      const right = window.innerWidth - rect.right;

      const adjustedTop =
        top + popoverHeight > window.innerHeight
          ? rect.top - popoverHeight - offset
          : top;

      const adjustedRight =
        right + popoverWidth > window.innerWidth
          ? window.innerWidth - rect.left - offset
          : right;

      setAvatarPosition({
        top: adjustedTop,
        right: adjustedRight,
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

    const handleResize = () => {
      if (isAvatarPopoverOpen && avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect();
        const popoverWidth = 208;
        const popoverHeight = 120;
        const offset = 8;

        const top = rect.bottom + offset;
        const right = window.innerWidth - rect.right;

        const adjustedTop =
          top + popoverHeight > window.innerHeight
            ? rect.top - popoverHeight - offset
            : top;

        const adjustedRight =
          right + popoverWidth > window.innerWidth
            ? window.innerWidth - rect.left - offset
            : right;

        setAvatarPosition({
          top: adjustedTop,
          right: adjustedRight,
        });
      }
    };

    if (isAvatarPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutsideAvatar);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideAvatar);
      window.removeEventListener("resize", handleResize);
    };
  }, [isAvatarPopoverOpen]);

  return (
    <div
      className={cn(
        "h-[48px] pr-4 flex items-center justify-between ",
        className,
      )}
    >
      {/* Left side - Sidebar Icon, Brand Logo */}
      <div className="flex flex-row items-center gap-2">
        <div className="relative inline-flex justify-start items-center py-2 pl-2">
          <SidebarIcon />
        </div>
        <div className="w-px h-4 border border-[#ebebeb] "></div>
        {/* Brand Logo and Title */}
        <div className="flex flex-row items-center gap-3">
          <button onClick={() => router("/")}>
            <LmLogo />
          </button>
          <p className="text-[#171717] font-[500] text-[16px]">
            Market Insights AI
          </p>
        </div>
      </div>

      {/* Right side - Navbar Icons */}
      <div className="flex items-center gap-2">
        {/* Question Mark Icon */}
        <TooltipText toolTipText="Help" side="bottom">
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
            aria-label="Help"
          >
            <CircleQuestionMark strokeWidth={1.6} size={18} />
          </button>
        </TooltipText>

        {/* Settings Icon */}
        <TooltipText toolTipText="Settings" side="bottom">
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
            aria-label="Settings"
          >
            <Settings strokeWidth={1.6} size={18} />
          </button>
        </TooltipText>

        {/* Profile Avatar */}
        <TooltipText toolTipText="Profile" side="bottom">
          <button
            ref={avatarRef}
            onClick={handleClickAvatar}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
            type="button"
            aria-label="Profile"
          >
            <Avatar className="h-[26px] w-[26px]">
              <AvatarImage src="https://i.pravatar.cc/150?img=4" alt="avatar" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </button>
        </TooltipText>

        {/* Profile Popover */}
        {isAvatarPopoverOpen && (
          <div
            ref={popoverAvatarRef}
            className="fixed w-[208px] bg-white shadow-lg rounded-[8px] border border-gray-200 z-[9999]"
            style={{
              top: `${avatarPosition.top}px`,
              right: `${avatarPosition.right}px`,
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

export default TopBar;
