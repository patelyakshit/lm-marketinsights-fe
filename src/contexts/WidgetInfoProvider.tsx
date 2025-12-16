import React, { useState, useEffect } from "react";
import { WidgetInfoContext, WidgetInfoResponse } from "./WidgetInfoContext";

interface WidgetInfoProviderProps {
  children: React.ReactNode;
  widgetId: string;
  hostUrl: string;
}

export const WidgetInfoProvider: React.FC<WidgetInfoProviderProps> = ({
  children,
  widgetId,
  hostUrl,
}) => {
  const [widgetInfo, setWidgetInfo] = useState<WidgetInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchWidgetInfo = async () => {
      const data = {
        widget_id: widgetId,
        host_url: hostUrl,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/chatbot/widget/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setWidgetInfo(result);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching widget info:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (widgetId && hostUrl) {
      fetchWidgetInfo();
    } else {
      setIsLoading(false);
    }
  }, [widgetId, hostUrl, API_BASE_URL]);

  return (
    <WidgetInfoContext.Provider value={{ widgetInfo, isLoading, error }}>
      {children}
    </WidgetInfoContext.Provider>
  );
};
