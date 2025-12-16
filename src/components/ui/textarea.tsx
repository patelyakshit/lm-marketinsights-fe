import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { textareaVariants } from "./textarea-variants";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  autoResize?: boolean; // Default to false for single-line behavior
  minRows?: number;
  maxRows?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      resize,
      autoResize = false,
      minRows = autoResize ? 1 : 1,
      maxRows = autoResize ? 5 : 1,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = ref || internalRef;

    React.useEffect(() => {
      if (
        !autoResize ||
        !(
          typeof textareaRef === "object" &&
          textareaRef !== null &&
          "current" in textareaRef &&
          textareaRef.current
        )
      )
        return;

      const textarea = textareaRef.current;
      const adjustHeight = () => {
        textarea.style.height = "auto";

        // Calculate the line height
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseInt(computedStyle.lineHeight) || 20;

        // Calculate min and max heights
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

      // Adjust height when content changes
      const handleInput = () => adjustHeight();
      textarea.addEventListener("input", handleInput);

      return () => {
        textarea.removeEventListener("input", handleInput);
      };
    }, [autoResize, minRows, maxRows, props.value, textareaRef]);

    return (
      <textarea
        className={cn(textareaVariants({ variant, size, resize, className }))}
        ref={textareaRef}
        rows={autoResize ? minRows : 1}
        style={{
          resize: "none",
          overflow: "hidden",
          ...(autoResize && { height: "auto" }),
        }}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
