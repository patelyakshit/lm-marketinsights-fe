import React, { useState } from "react";
import { Input } from "../base/Input";
import { Button } from "../base/Button";
import EyeIcon from "../../assets/icons/EyeIcon";
import InfoIcon from "../../assets/icons/InfoIcon";
import LmLogo from "../../assets/icons/LmLogo";
import { login, LoginResponse } from "../../../api";

export interface SignInFormProps {
  onSubmit?: (email: string, password: string) => void;
  onSignUpClick?: () => void;
  onLoginSuccess?: (response: LoginResponse) => void;
  className?: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSubmit,
  onSignUpClick,
  onLoginSuccess,
  className,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case "email":
        if (!value.trim()) return "Email is required.";
        if (!validateEmail(value)) return "Please enter a valid email address.";
        break;
      case "password":
        if (!value.trim()) return "Password is required.";
        break;
    }
    return undefined;
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleFieldChange = (
    field: string,
    value: string,
    setter: (value: string) => void,
  ) => {
    setter(value);
    setError(null);
    // Clear field error when user starts typing
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateAllFields = (): boolean => {
    const errors: FieldErrors = {};

    const emailError = validateField("email", email);
    if (emailError) errors.email = emailError;

    const passwordError = validateField("password", password);
    if (passwordError) errors.password = passwordError;

    setFieldErrors(errors);
    setTouched({ email: true, password: true });

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllFields()) return;
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Call the login API
      const response = await login({
        reg_email: email.trim(),
        password,
      });

      // Call the optional onSubmit prop if provided
      await onSubmit?.(email, password);

      // Call the optional onLoginSuccess callback
      onLoginSuccess?.(response);
    } catch (err) {
      console.error("Login error:", err);
      // Handle error messages
      const error = err as Error & {
        data?: { error?: string; message?: string };
        status?: number;
      };
      if (error?.data?.error) {
        setError(error.data.error);
      } else if (error?.data?.message) {
        setError(error.data.message);
      } else if (error?.message) {
        setError(error.message);
      } else if (error?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (error?.status === 400 || error?.status === 422) {
        setError("Please check your email and password and try again.");
      } else {
        setError("An error occurred during sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFieldError = (field: keyof FieldErrors): boolean => {
    return touched[field] && !!fieldErrors[field];
  };

  return (
    <div className={`signin-form ${className || ""}`}>
      {/* Brand/Logo Section - aligned to start */}
      <div className="flex flex-col gap-[10px] items-start w-full self-start">
        <div className="flex gap-[8px] items-center">
          <div className="h-[28px] w-[35.467px] flex items-center justify-start">
            <LmLogo />
          </div>
          <div className="h-[23.333px] flex items-center">
            <span className="signin-form-brand-text">Market Insights AI</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex flex-col gap-[32px] items-start w-full max-w-[440px]">
        {/* Heading Section */}
        <div className="flex flex-col gap-[8px] items-start w-full">
          <h1 className="signin-form-heading">Sign in to your account</h1>
          <p className="signin-form-subtitle">
            Access your maps, saved projects, and insights.
          </p>
        </div>

        {/* Divider */}
        <div className="flex gap-[8px] items-center justify-center w-full">
          <div className="signin-form-divider" />
        </div>

        {/* Form Fields */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-[24px] w-full"
        >
          {/* General Error Message */}
          {error && (
            <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-[20px] w-full">
            {/* Input Fields Group */}
            <div className="flex flex-col gap-[12px] w-full">
              {/* Email Input */}
              <div className="flex flex-col gap-[4px] w-full">
                <label className="signin-form-label-regular">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    handleFieldChange("email", e.target.value, setEmail)
                  }
                  onBlur={() => handleBlur("email", email)}
                  disabled={isSubmitting}
                  error={hasFieldError("email")}
                  className="signin-form-input"
                />
                {hasFieldError("email") && (
                  <div className="signin-form-error-hint">
                    <InfoIcon
                      size={16}
                      color="#fb3748"
                      className="signin-form-error-icon"
                    />
                    <span className="signin-form-error-text">
                      {fieldErrors.email}
                    </span>
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-[4px] w-full">
                <label className="signin-form-label-regular">Password</label>
                <div className="relative w-full">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      handleFieldChange("password", e.target.value, setPassword)
                    }
                    onBlur={() => handleBlur("password", password)}
                    disabled={isSubmitting}
                    error={hasFieldError("password")}
                    className="signin-form-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-[10px] top-1/2 -translate-y-1/2 cursor-pointer signin-form-eye-button"
                  >
                    <EyeIcon
                      size={20}
                      color="#A6A3A0"
                      className="hover:opacity-70 transition-opacity"
                    />
                  </button>
                </div>
                {hasFieldError("password") && (
                  <div className="signin-form-error-hint">
                    <InfoIcon
                      size={16}
                      color="#fb3748"
                      className="signin-form-error-icon"
                    />
                    <span className="signin-form-error-text">
                      {fieldErrors.password}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button and Sign Up Link */}
            <div className="flex flex-col gap-[12px] w-full">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full signin-form-button"
              >
                {isSubmitting ? "Signing in..." : "Continue"}
              </Button>

              <div className="flex gap-[8px] items-center justify-center w-full signin-form-footer-text">
                <span className="signin-form-signup-text">
                  Don't have an account?
                </span>
                <button
                  type="button"
                  onClick={onSignUpClick}
                  className="signin-form-signup-link-orange cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={true}
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer Links - aligned to bottom */}
      <div className="text-center w-full signin-form-footer-text self-end">
        <span>
          By signing in, you agree to our{" "}
          <a href="#" className="signin-form-link cursor-pointer">
            Terms of Service
          </a>
          {" and "}
          <a href="#" className="signin-form-link cursor-pointer">
            Privacy Policy.
          </a>
        </span>
      </div>
    </div>
  );
};
