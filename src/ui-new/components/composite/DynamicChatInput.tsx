import React, { useRef, useEffect, ReactNode } from "react";
import { cn } from "../../../lib/utils";

export interface DynamicChatInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSend?: () => void;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  containerClassName?: string;
  textareaClassName?: string;
  buttonRowClassName?: string;
  size?: "sm" | "md" | "lg";
  borderRadius?: "sm" | "md" | "lg" | "xl";
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  textareaPadding?: string;
  buttonRowPadding?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
}

/**
 * DynamicChatInput - Fully customizable chat input component
 *
 * Can be used across landing, dashboard, and chat areas with:
 * - Dynamic icon placement via leftActions and rightActions props
 * - Customizable sizing (sm, md, lg)
 * - Auto-resize textarea functionality
 * - Flexible styling and layout
 *
 * Example usage:
 * ```tsx
 * <DynamicChatInput
 *   value={input}
 *   onChange={(e) => setInput(e.target.value)}
 *   onSend={handleSend}
 *   size="lg"
 *   borderRadius="xl"
 *   leftActions={<PlusButton />}
 *   rightActions={
 *     <>
 *       <MicButton />
 *       {input.trim() ? <SendButton /> : <VoiceModeButton />}
 *     </>
 *   }
 * />
 * ```
 */
const DynamicChatInput = React.forwardRef<
  HTMLTextAreaElement,
  DynamicChatInputProps
>(
  (
    {
      className,
      containerClassName,
      textareaClassName,
      buttonRowClassName,
      onSend,
      value = "",
      onChange,
      autoResize = true,
      minRows = 1,
      maxRows = 5,
      size = "md",
      borderRadius = "xl",
      leftActions,
      rightActions,
      textareaPadding,
      buttonRowPadding,
      backgroundColor = "#ffffff",
      borderColor = "#eceae9",
      borderWidth = "1px",
      disabled = false,
      isSubmitting = false,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef =
      (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const sizePresets = {
      sm: {
        textareaPadding: textareaPadding || "12px",
        buttonRowPadding: buttonRowPadding || "6px",
        minHeight: "48px",
        borderRadius:
          borderRadius === "xl"
            ? "16px"
            : borderRadius === "lg"
              ? "12px"
              : borderRadius === "md"
                ? "8px"
                : "6px",
      },
      md: {
        textareaPadding: textareaPadding || "16px",
        buttonRowPadding: buttonRowPadding || "8px",
        minHeight: "60px",
        borderRadius:
          borderRadius === "xl"
            ? "20px"
            : borderRadius === "lg"
              ? "16px"
              : borderRadius === "md"
                ? "12px"
                : "8px",
      },
      lg: {
        textareaPadding: textareaPadding || "20px",
        buttonRowPadding: buttonRowPadding || "12px",
        minHeight: "72px",
        borderRadius:
          borderRadius === "xl"
            ? "24px"
            : borderRadius === "lg"
              ? "20px"
              : borderRadius === "md"
                ? "16px"
                : "12px",
      },
    };

    const currentPreset = sizePresets[size];

    useEffect(() => {
      if (!autoResize || !textareaRef.current) return;

      const textarea = textareaRef.current;
      const adjustHeight = () => {
        textarea.style.height = "auto";
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseInt(computedStyle.lineHeight) || 24;
        const minHeight = lineHeight * minRows;
        const maxHeight = lineHeight * maxRows;
        const scrollHeight = textarea.scrollHeight;
        const newHeight = Math.max(
          minHeight,
          Math.min(maxHeight, scrollHeight),
        );
        textarea.style.height = `${newHeight}px`;
        textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
      };

      adjustHeight();
      const handleInput = () => adjustHeight();
      textarea.addEventListener("input", handleInput);
      return () => textarea.removeEventListener("input", handleInput);
    }, [autoResize, minRows, maxRows, value, textareaRef]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend?.();
      }
      props.onKeyDown?.(e);
    };

    return (
      <div
        className={cn("relative w-full overflow-hidden", containerClassName)}
        style={{
          backgroundColor,
          border: `${borderWidth} solid ${borderColor}`,
          borderRadius: currentPreset.borderRadius,
        }}
      >
        <div
          className="flex gap-2 items-start w-full"
          style={{
            minHeight: currentPreset.minHeight,
            padding: currentPreset.textareaPadding,
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSubmitting}
            className={cn(
              "flex-1 outline-none border-none resize-none bg-transparent",
              "text-[14px] leading-[20px] tracking-[-0.07px]",
              "placeholder:text-[#a6a3a0] placeholder:font-normal",
              "font-['Switzer',sans-serif]",
              textareaClassName,
              className,
            )}
            style={{
              color: value.trim() ? "#1D1916" : "#a6a3a0",
            }}
            rows={autoResize ? minRows : 1}
            {...props}
          />
        </div>

        {(leftActions || rightActions) && (
          <div
            className={cn(
              "flex items-center justify-between w-full",
              buttonRowClassName,
            )}
            style={{
              padding: currentPreset.buttonRowPadding,
            }}
          >
            <div className="flex gap-3 items-center">{leftActions}</div>

            <div className="flex gap-1.5 items-center">{rightActions}</div>
          </div>
        )}
      </div>
    );
  },
);

DynamicChatInput.displayName = "DynamicChatInput";

export { DynamicChatInput };
