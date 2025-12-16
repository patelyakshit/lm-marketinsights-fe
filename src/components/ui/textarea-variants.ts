import { cva } from "class-variance-authority";

export const textareaVariants = cva(
  "flex min-h-[40px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input bg-transparent",
        ghost: "border-transparent bg-transparent shadow-none",
        filled: "bg-muted border-transparent",
      },
      size: {
        default: "px-3 py-2 text-base md:text-sm",
        sm: "px-2 py-1 text-sm",
        lg: "px-4 py-3 text-lg",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      resize: "none",
    },
  },
);
