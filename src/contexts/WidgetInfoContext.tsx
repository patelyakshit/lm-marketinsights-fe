import { createContext } from "react";

export interface WidgetDetailsResponse {
  user: string;
  host_url: string;
  widget_id: string;
  widget_name: string;
  collection_name: string;
  collection_id: number;
  meta: {
    bot_display_name: string;
    brand_color: string;
    chatbot_picture: string;
    initial_message: string[];
    suggested_message: string[];
  };
}

export interface WidgetInfoResponse {
  details: {
    data: WidgetDetailsResponse;
  };
}

export interface WidgetInfoContextProps {
  widgetInfo: WidgetInfoResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export const WidgetInfoContext = createContext<
  WidgetInfoContextProps | undefined
>(undefined);
