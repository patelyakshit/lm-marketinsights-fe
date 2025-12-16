import React from "react";

// Import the hero background image
const heroBackgroundImage = "/assets/auth-hero-bg.png";

export interface AuthHeroProps {
  imageUrl?: string;
  text?: string;
  className?: string;
}

export const AuthHero: React.FC<AuthHeroProps> = ({
  imageUrl = heroBackgroundImage,
  text = "Every great business decision starts with understanding the place",
  className,
}) => {
  return (
    <div className={`auth-hero ${className || ""}`}>
      {/* Background Image */}
      <div
        className="auth-hero-background"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      >
        {/* Gradient Overlay - from transparent at top to dark at bottom */}
        <div className="auth-hero-gradient" />
      </div>

      {/* Text Overlay - positioned at bottom */}
      <div className="auth-hero-text-container">
        <p className="auth-hero-text">{text}</p>
      </div>
    </div>
  );
};
