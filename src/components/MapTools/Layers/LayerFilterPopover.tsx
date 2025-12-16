import React, { useState } from "react";
import { Checkbox } from "../../ui/checkbox";

interface LayerFilterPopoverProps {
  onFilterChange?: (selectedLayers: string[]) => void;
  currentFilters?: string[];
}

const layerTypes = [
  "Map Service",
  "Feature Service",
  "Image Service",
  "Vector Tile Service",
  "Tiled Imagery",
];

const LayerFilterPopover: React.FC<LayerFilterPopoverProps> = ({
  onFilterChange,
  currentFilters = [],
}) => {
  const [selectedLayers, setSelectedLayers] =
    useState<string[]>(currentFilters);

  const handleLayerToggle = (layerType: string) => {
    setSelectedLayers((prev) => {
      const newSelection = prev.includes(layerType)
        ? prev.filter((layer) => layer !== layerType)
        : [...prev, layerType];

      onFilterChange?.(newSelection);
      return newSelection;
    });
  };

  return (
    <div
      className="flex flex-col items-start gap-6 p-1.5 py-2 rounded-lg border border-[#E2E8F0] bg-white shadow-lg"
      style={{
        width: "220px",
        boxShadow: "0px 4px 20px -8px rgba(0, 0, 0, 0.25)",
      }}
    >
      <div className="w-full p-2">
        <div className="space-y-5">
          {layerTypes.map((layerType) => (
            <div key={layerType} className="flex items-center space-x-3">
              <Checkbox
                id={layerType}
                checked={selectedLayers.includes(layerType)}
                onCheckedChange={() => handleLayerToggle(layerType)}
                className="h-4 w-4 rounded border-1 border-[#D1D5DB] data-[state=checked]:bg-[#2F45FF] data-[state=checked]:border-[#2F45FF] data-[state=checked]:text-white focus:ring-2 focus:ring-[#2F45FF] focus:ring-offset-2"
              />
              <label
                htmlFor={layerType}
                className="text-[#475569] text-sm font-normal leading-5 cursor-pointer select-none"
                style={{
                  fontSize: "14px",
                  fontStyle: "normal",
                  fontWeight: 400,
                  lineHeight: "20px",
                }}
              >
                {layerType}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayerFilterPopover;
