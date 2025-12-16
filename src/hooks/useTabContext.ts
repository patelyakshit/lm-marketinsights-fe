import { useContext } from "react";
import { TabContext } from "../contexts/TabContextDefinition";

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTabContext must be used within a TabProvider");
  }
  return context;
};
