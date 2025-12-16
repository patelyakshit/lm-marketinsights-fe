import { useContext } from "react";
import { PromptContext } from "../contexts/PromptContextDefinition";

export const usePromptContext = () => {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error("usePromptContext must be used within a PromptProvider");
  }
  return context;
};
