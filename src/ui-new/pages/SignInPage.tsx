import React from "react";
import { useNavigate } from "react-router-dom";
import { SignInForm } from "../components/composite/SignInForm";
import { AuthHero } from "../components/composite/AuthHero";

const SignInPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignIn = async (email: string, password: string) => {
    // TODO: Implement actual sign-in logic with your auth provider
    console.log("Sign in:", { email, password });
    // Set flag to indicate user just logged in - sidebar should be expanded
    sessionStorage.setItem("just-logged-in", "true");
    // After successful sign-in, navigate to dashboard with sidebar
    navigate("/dashboard");
  };

  const handleSignUpClick = () => {
    navigate("/signup");
  };

  return (
    <div className="signin-container">
      <div className="signin-form-wrapper">
        <SignInForm onSubmit={handleSignIn} onSignUpClick={handleSignUpClick} />
      </div>

      <div className="signin-hero-wrapper">
        <AuthHero />
      </div>
    </div>
  );
};

export default SignInPage;
