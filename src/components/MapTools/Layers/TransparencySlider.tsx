import React, { useState, useEffect, useRef } from "react";
import { Slider } from "../../ui/slider";

interface TransparencySliderProps {
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
  layerName?: string;
  position?: { y: number };
}

const TransparencySlider: React.FC<TransparencySliderProps> = ({
  value,
  onChange,
  onClose,
  layerName,
  position = { x: 30, y: 100 },
}) => {
  const getTransparencyPercentage = (opacity: number) => {
    return Math.round((1 - opacity) * 100);
  };

  const [localValue, setLocalValue] = useState(
    getTransparencyPercentage(value),
  );
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(getTransparencyPercentage(value));
  }, [value]);

  const handleValueChange = (newValue: number[]) => {
    const transparencyPercentage = newValue[0];
    setLocalValue(transparencyPercentage);
    const opacity = 1 - transparencyPercentage / 100;
    onChange(opacity);
  };

  return (
    <div
      ref={sliderRef}
      data-transparency-slider
      className="absolute right-2 py-1 pb-2 z-50 bg-white border border-[#EBEBEB] rounded-lg shadow-[0_16px_32px_-12px_rgba(14,18,27,0.10)] w-64 min-w-max"
      style={{
        top: `${position.y + 35}px`,
      }}
    >
      <div className="flex items-center justify-between px-3 pt-2 pb-2">
        <h3 className="text-sm font-medium text-[#171717] flex items-center">
          Transparency
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="w-[calc(100%-16px)] h-px bg-gray-200 mx-2"></div>

      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">
            {layerName || "Transparency"}
          </span>
          <span className="text-xs font-medium text-gray-900">
            {localValue}%
          </span>
        </div>

        <Slider
          value={[localValue]}
          onValueChange={handleValueChange}
          max={100}
          min={0}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default TransparencySlider;
