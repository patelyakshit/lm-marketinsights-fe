import React from "react";
import { Loader2 } from "lucide-react";

interface MapLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

const MapLoadingOverlay: React.FC<MapLoadingOverlayProps> = ({
  isLoading,
  message = "Loading map...",
}) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg border border-gray-200">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {message}
          </h3>
          <p className="text-sm text-gray-600">
            Please wait while we prepare your map...
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapLoadingOverlay;
