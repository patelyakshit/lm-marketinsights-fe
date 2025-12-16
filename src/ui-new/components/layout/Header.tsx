import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../../lib/utils";
import LmLogo from "../../assets/icons/LmLogo";

export interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate("/signin");
  };

  const handleSignUpClick = () => {
    navigate("/signup");
  };

  return (
    <div
      className={cn(
        "flex flex-row justify-between items-center w-full",
        className,
      )}
    >
      {/* Logo with Text */}
      <div className="flex items-center" style={{ gap: "10px" }}>
        {/* Logo Container - sized to match Figma (30.4px × 24px) */}
        <div
          style={{
            height: "24px",
            width: "30.4px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            overflow: "hidden",
          }}
        >
          <LmLogo />
        </div>
        {/* Market Insights AI Text */}
        <div
          className="flex items-center justify-center"
          style={{
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "Switzer, sans-serif",
              fontSize: "16px", // text-base
              fontWeight: 500, // font-medium
              lineHeight: "20px", // leading-5
              color: "#27272a", // text-zinc-800
            }}
          >
            Market Insights AI
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row gap-2">
        <button
          onClick={handleSignInClick}
          className="border rounded-[6px] px-5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          style={{
            height: "36px",
            borderColor: "#eceae9",
            backgroundColor: "transparent",
            color: "#1d1916",
            fontFamily: "Switzer, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "20px",
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
        <button
          onClick={handleSignUpClick}
          className="rounded-[6px] px-5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          style={{
            height: "36px",
            backgroundColor: "#1d1916",
            color: "#ffffff",
            fontFamily: "Switzer, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "20px",
            cursor: "pointer",
          }}
          disabled={true}
        >
          Sign up
        </button>
      </div>
    </div>
  );
};
