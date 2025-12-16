import React from "react";
import { cn } from "../../../lib/utils";
import { colors, typography } from "../../design-system";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, style, type, error, ...props }, ref) => {
    // Generate unique ID for scoped styles
    const inputId = React.useId();

    // Determine border color based on error state
    const borderColor = error ? "#fb3748" : colors.neutral[200];
    const focusBorderColor = error ? "#fb3748" : colors.neutral[900];

    return (
      <>
        <style>
          {`
          .signin-input-${inputId.replace(/:/g, "")}::placeholder {
            color: ${colors.neutral[400]};
          }
          .signin-input-${inputId.replace(/:/g, "")}:focus {
            border-color: ${focusBorderColor} !important;
            border-width: 1px;
            border-style: solid;
            outline: none;
            box-shadow: none;
          }
        `}
        </style>
        <input
          type={type}
          className={cn(
            `signin-input-${inputId.replace(/:/g, "")}`,
            "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          style={{
            borderColor: borderColor,
            borderWidth: "1px",
            borderStyle: "solid",
            color: colors.neutral[900],
            fontFamily: typography.fontFamily.primary,
            fontSize: "14px",
            lineHeight: "20px",
            letterSpacing: "-0.084px",
            ...style,
          }}
          ref={ref}
          {...props}
        />
      </>
    );
  },
);
Input.displayName = "Input";

export { Input };
