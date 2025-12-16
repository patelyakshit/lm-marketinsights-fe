import { useContext } from "react";
import { WidgetInfoContext } from "../contexts/WidgetInfoContext";

export const useWidgetInfo = () => {
  const context = useContext(WidgetInfoContext);
  if (!context) {
    throw new Error("useWidgetInfo must be used within a WidgetInfoProvider");
  }
  return context;
};
