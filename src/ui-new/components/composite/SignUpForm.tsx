import React, { useState } from "react";
import { Input } from "../base/Input";
import { Button } from "../base/Button";
import EyeIcon from "../../assets/icons/EyeIcon";
import InfoIcon from "../../assets/icons/InfoIcon";
import LmLogo from "../../assets/icons/LmLogo";

export interface SignUpFormProps {
  onSubmit?: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => void;
  onSignInClick?: () => void;
  onSignUpSuccess?: (response: any) => void;
  className?: string;
}

interface FieldErrors {
  firstName?: string;
  email?: string;
  password?: string;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSubmit,
  onSignInClick,
  onSignUpSuccess,
  className,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
      case "firstName":
        if (!value.trim()) return "First name is required.";
        break;
      case "email":
        if (!value.trim()) return "Email is required.";
        if (!validateEmail(value)) return "Please enter a valid email address.";
        break;
      case "password":
        if (!value.trim()) return "Password is required.";
        if (value.length < 6) return "Password must be at least 6 characters.";
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

    const firstNameError = validateField("firstName", firstName);
    if (firstNameError) errors.firstName = firstNameError;

    const emailError = validateField("email", email);
    if (emailError) errors.email = emailError;

    const passwordError = validateField("password", password);
    if (passwordError) errors.password = passwordError;

    setFieldErrors(errors);
    setTouched({ firstName: true, email: true, password: true });

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllFields()) return;
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Call the optional onSubmit prop if provided
      await onSubmit?.(
        firstName.trim(),
        lastName.trim(),
        email.trim(),
        password,
      );

      // Call the optional onSignUpSuccess callback
      onSignUpSuccess?.({ success: true });
    } catch (err) {
      console.error("Sign up error:", err);
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
      } else if (error?.status === 400 || error?.status === 422) {
        setError("Please check your information and try again.");
      } else {
        setError("An error occurred during sign up. Please try again.");
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
          <h1 className="signin-form-heading">Create your account</h1>
          <p className="signin-form-subtitle">
            Start exploring any location with real, verified insights.
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
              {/* First Name and Last Name Row */}
              <div className="flex gap-[12px] w-full">
                {/* First Name Input */}
                <div className="flex flex-col gap-[4px] flex-1">
                  <label className="signin-form-label-regular">
                    First Name
                  </label>
                  <Input
                    type="text"
                    placeholder="James"
                    value={firstName}
                    onChange={(e) =>
                      handleFieldChange(
                        "firstName",
                        e.target.value,
                        setFirstName,
                      )
                    }
                    onBlur={() => handleBlur("firstName", firstName)}
                    disabled={isSubmitting}
                    error={hasFieldError("firstName")}
                    className="signin-form-input"
                  />
                  {hasFieldError("firstName") && (
                    <div className="signin-form-error-hint">
                      <InfoIcon
                        size={16}
                        color="#fb3748"
                        className="signin-form-error-icon"
                      />
                      <span className="signin-form-error-text">
                        {fieldErrors.firstName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Last Name Input - No validation required */}
                <div className="flex flex-col gap-[4px] flex-1">
                  <label className="signin-form-label-regular">Last Name</label>
                  <Input
                    type="text"
                    placeholder="Brown"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSubmitting}
                    className="signin-form-input"
                  />
                </div>
              </div>

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

            {/* Submit Button and Sign In Link */}
            <div className="flex flex-col gap-[12px] w-full">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full signin-form-button"
              >
                {isSubmitting ? "Signing up..." : "Sign Up"}
              </Button>

              <div className="flex gap-[8px] items-center justify-center w-full signin-form-footer-text">
                <span className="signin-form-signup-text">
                  Already have an account?
                </span>
                <button
                  type="button"
                  onClick={onSignInClick}
                  className="signin-form-signup-link-orange cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer Links - aligned to bottom */}
      <div className="text-center w-full signin-form-footer-text self-end">
        <span>
          By clicking "Sign Up", you agree to our{" "}
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
