import React from "react";
import { cn } from "../../../lib/utils";
import { motion } from "framer-motion";

export interface SuggestionChipProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  index?: number;
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({
  text,
  onClick,
  disabled = false,
  index = 0,
}) => {
  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      className={cn(
        "flex px-3 py-2 justify-end items-center gap-2 rounded bg-[#F5F5F5] cursor-pointer hover:bg-[#EBEBEB] transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.9 + index * 0.05,
        ease: "easeOut",
      }}
      whileHover={
        !disabled
          ? {
              scale: 1.03,
              backgroundColor: "#EBEBEB",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }
          : {}
      }
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <p className="text-[#5C5C5C] text-xs font-normal">{text}</p>
    </motion.div>
  );
};
