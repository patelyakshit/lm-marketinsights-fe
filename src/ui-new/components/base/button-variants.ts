import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#171717] text-white hover:bg-[#2a2a2a]",
        outline:
          "border border-[#e7e5e4] bg-transparent hover:bg-[#faf9f9] text-[#171717]",
        ghost: "hover:bg-[#faf9f9] text-[#171717]",
        link: "text-[#171717] underline-offset-4 hover:underline",
        primary: "bg-[#fa7319] text-white hover:bg-[#ff7700]",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
