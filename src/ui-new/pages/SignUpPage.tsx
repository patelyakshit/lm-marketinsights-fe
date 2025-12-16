import React from "react";
import { useNavigate } from "react-router-dom";
import { SignUpForm } from "../components/composite/SignUpForm";
import { AuthHero } from "../components/composite/AuthHero";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignUp = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => {
    // TODO: Implement actual sign-up logic with auth provider
    console.log("Sign up:", { firstName, lastName, email, password });
    sessionStorage.setItem("just-logged-in", "true");
    navigate("/dashboard");
  };

  const handleSignInClick = () => {
    navigate("/signin");
  };

  return (
    <div className="signin-container">
      <div className="signin-form-wrapper">
        <SignUpForm onSubmit={handleSignUp} onSignInClick={handleSignInClick} />
      </div>

      <div className="signin-hero-wrapper">
        <AuthHero />
      </div>
    </div>
  );
};

export default SignUpPage;
