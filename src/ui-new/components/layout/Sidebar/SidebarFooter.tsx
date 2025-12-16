import React from "react";
import { colors } from "../../../design-system";
import { Tooltip } from "../../base";

interface SidebarFooterProps {
  userName?: string;
  userPlan?: string;
  avatarUrl?: string;
  onProfileClick?: () => void;
  isCollapsed?: boolean;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({
  userName = "Guest User",
  userPlan = "Free Plan",
  avatarUrl,
  onProfileClick,
  isCollapsed = false,
}) => {
  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const Avatar = () => (
    <div
      className="relative rounded-full overflow-hidden flex items-center justify-center"
      style={{
        width: "32px",
        height: "32px",
        backgroundColor: "#FA7319",
      }}
    >
      {avatarUrl ? (
        <div className="absolute inset-0 pointer-events-none rounded-full">
          <div className="absolute bg-[#FA7319] inset-0 rounded-full" />
          <img
            src={avatarUrl}
            alt={userName}
            className="absolute max-w-none object-cover rounded-full w-full h-full"
            style={{ objectPosition: "50% 50%" }}
          />
        </div>
      ) : (
        <span
          style={{
            fontFamily: "Switzer, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: colors.static.white,
          }}
        >
          {getInitials(userName)}
        </span>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <div
        className="w-full shrink-0"
        style={{
          borderTop: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{ padding: "6px" }}
        >
          <Tooltip content={userName} side="right">
            <button
              onClick={onProfileClick}
              className="flex items-center justify-center rounded-[8px] cursor-pointer hover:bg-[#ECEAE9] transition-colors"
              style={{ padding: "4px" }}
            >
              <Avatar />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full shrink-0"
      style={{
        borderTop: `1px solid ${colors.neutral[200]}`,
      }}
    >
      <div
        className="flex items-center gap-[8px] overflow-hidden"
        style={{ padding: "4px" }}
      >
        <button
          onClick={onProfileClick}
          className="flex-1 flex items-center gap-[8px] rounded-[8px] cursor-pointer hover:bg-[#ECEAE9] transition-colors min-w-0 min-h-0"
          style={{ padding: "4px" }}
        >
          <div
            className="shrink-0"
            style={{ padding: "2px", borderRadius: "8px" }}
          >
            <Avatar />
          </div>

          {/* Profile Content */}
          <div className="flex-1 flex flex-col items-start justify-center min-w-0 min-h-0 shrink-0">
            <div className="flex flex-col justify-center shrink-0">
              <span
                className="text-nowrap whitespace-pre"
                style={{
                  fontFamily: "Switzer, sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  letterSpacing: "-0.084px",
                  color: colors.neutral[900],
                }}
              >
                {userName}
              </span>
            </div>
            <div className="flex flex-col justify-center shrink-0">
              <span
                className="text-nowrap whitespace-pre"
                style={{
                  fontFamily: "Switzer, sans-serif",
                  fontSize: "12px",
                  fontWeight: 400,
                  lineHeight: "16px",
                  letterSpacing: "-0.072px",
                  color: colors.neutral[500],
                }}
              >
                {userPlan}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SidebarFooter;
