import React, { useState, useEffect, useRef } from "react";
import { Eye, Trash2, Plus } from "lucide-react";
import {
  MapSearchIcon,
  PinNoteIcon,
  MeasurementIcon,
  HomeMapIcon,
  MyLocationIcon,
  ZoomInIcon,
  ZoomOutIcon,
  UndoIcon,
  RedoIcon,
  CompassIcon,
  FullscreenIcon,
} from "../../assets/icons";
import { Tooltip } from "../base";
import { LocationSearchTool } from "../../../modules/MapTools/LocationSearchTool";
import { MapOperation } from "../../../schema";

interface MapToolsProps {
  onOperation: (operation: MapOperation) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  isCurrentGeo?: boolean;
  view?: any;
  onSearchClick?: () => void;
  onPinNoteClick?: () => void;
  onMeasurementClick?: () => void;
  onAddPin?: () => void;
  onViewAllPins?: () => void;
  onRemoveAllPins?: () => void;
  pinCount?: number;
}

const MapTools: React.FC<MapToolsProps> = ({
  onOperation,
  canUndo = true,
  canRedo = true,
  canZoomIn = true,
  canZoomOut = true,
  isCurrentGeo = false,
  view,
  onSearchClick,
  onPinNoteClick,
  onMeasurementClick,
  onAddPin,
  onViewAllPins,
  onRemoveAllPins,
  pinCount = 0,
}) => {
  const [compassRotation, setCompassRotation] = useState(0);
  const [activeTopTool, setActiveTopTool] = useState<string | null>(null);
  const toolButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>(
    {},
  );
  const popupRef = useRef<HTMLDivElement | null>(null);

  const isViewAllPinsDisabled = pinCount === 0;

  // Watch for map rotation changes
  useEffect(() => {
    if (view) {
      const handle = view.watch("rotation", (rotation: number) => {
        setCompassRotation(rotation);
      });
      return () => handle.remove();
    }
  }, [view]);

  // Handle click outside to close popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!activeTopTool) return;

      const buttonRef = toolButtonRefs.current[activeTopTool];
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef &&
        !buttonRef.contains(event.target as Node)
      ) {
        setActiveTopTool(null);
      }
    };

    if (activeTopTool) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeTopTool]);

  const handleCompassClick = () => {
    if (view) {
      view.rotation = 0;
    }
  };

  const handleTopToolClick = (toolName: string, callback?: () => void) => {
    if (activeTopTool === toolName) {
      setActiveTopTool(null);
    } else {
      setActiveTopTool(toolName);
    }
    // Only call callback for tools that don't have popups
    if (toolName === "measurement") {
      callback?.();
    }
  };

  const handleAddPin = () => {
    onAddPin?.();
    setActiveTopTool(null);
  };

  const handleViewAllPins = () => {
    if (!isViewAllPinsDisabled) {
      onViewAllPins?.();
      setActiveTopTool(null);
    }
  };

  const handleRemoveAllPins = () => {
    if (!isViewAllPinsDisabled) {
      onRemoveAllPins?.();
      setActiveTopTool(null);
    }
  };

  const topTools = [
    {
      key: "search",
      label: "Search",
      icon: MapSearchIcon,
      onClick: () => handleTopToolClick("search", onSearchClick),
    },
    {
      key: "pin-note",
      label: "Pin & Note",
      icon: PinNoteIcon,
      onClick: () => handleTopToolClick("pin-note", onPinNoteClick),
    },
    {
      key: "measurement",
      label: "Measurement",
      icon: MeasurementIcon,
      onClick: () => handleTopToolClick("measurement", onMeasurementClick),
    },
  ];

  const renderPopupContent = () => {
    if (!activeTopTool) return null;

    if (activeTopTool === "search") {
      return (
        <div className="w-[320px] [&>div]:!bg-transparent [&_input]:!bg-transparent [&_input]:!text-[14px] [&_input]:!text-[rgba(255,255,255,0.9)] [&_input]:!placeholder-[rgba(255,255,255,0.5)] [&_input]:!caret-white [&_input]:!leading-[20px]">
          <LocationSearchTool />
        </div>
      );
    }

    if (activeTopTool === "pin-note") {
      return (
        <div className="flex flex-col gap-[4px] p-[8px] min-w-[200px]">
          <button
            onClick={handleAddPin}
            className="flex gap-[8px] items-center p-[8px] rounded-[8px] w-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-left cursor-pointer"
          >
            <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
              <Plus className="h-4 w-4 text-[rgba(255,255,255,0.9)]" />
            </div>
            <span className="text-[14px] leading-[20px] text-[rgba(255,255,255,0.9)] font-normal">
              Add Pin
            </span>
          </button>

          <button
            disabled={isViewAllPinsDisabled}
            onClick={handleViewAllPins}
            className={`flex gap-[8px] items-center p-[8px] rounded-[8px] w-full transition-colors text-left ${
              isViewAllPinsDisabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-[rgba(255,255,255,0.1)]"
            }`}
          >
            <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
              <Eye className="h-4 w-4 text-[rgba(255,255,255,0.9)]" />
            </div>
            <span className="text-[14px] leading-[20px] text-[rgba(255,255,255,0.9)] font-normal">
              View all pins{pinCount > 0 ? ` (${pinCount})` : ""}
            </span>
          </button>

          <div className="h-px bg-[rgba(255,255,255,0.16)] my-[1.5px]"></div>

          <button
            disabled={isViewAllPinsDisabled}
            onClick={handleRemoveAllPins}
            className={`flex gap-[8px] items-center p-[8px] rounded-[8px] w-full transition-colors text-left ${
              isViewAllPinsDisabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-[rgba(255,255,255,0.1)]"
            }`}
          >
            <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
              <Trash2
                className={`h-4 w-4 ${
                  isViewAllPinsDisabled
                    ? "text-[rgba(255,255,255,0.5)]"
                    : "text-[#FB3748]"
                }`}
              />
            </div>
            <span
              className={`text-[14px] leading-[20px] font-normal ${
                isViewAllPinsDisabled
                  ? "text-[rgba(255,255,255,0.5)]"
                  : "text-[#FB3748]"
              }`}
            >
              Remove all pins
            </span>
          </button>
        </div>
      );
    }

    if (activeTopTool === "measurement") {
      return (
        <div className="p-4 min-w-[200px]">
          <p className="text-sm text-[rgba(255,255,255,0.7)]">
            Measurements - Coming Soon
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Top Left - Pill Buttons */}
      <div className="absolute top-6 left-6 z-50 flex flex-col gap-2">
        <div className="flex gap-1">
          {topTools.map((tool) => {
            const IconComponent = tool.icon;
            const isActive = activeTopTool === tool.key;
            return (
              <button
                key={tool.key}
                ref={(el) => (toolButtonRefs.current[tool.key] = el)}
                onClick={tool.onClick}
                className="flex items-center gap-1.5 px-2.5 pr-3 py-2 rounded-full cursor-pointer transition-colors"
                style={{
                  backgroundColor: isActive
                    ? "rgba(255, 119, 0, 0.9)"
                    : "rgba(15, 15, 15, 0.5)",
                }}
              >
                <IconComponent size={16} color="rgba(255, 255, 255, 0.9)" />
                <span
                  className="text-[14px] whitespace-nowrap"
                  style={{
                    fontFamily: "Switzer, sans-serif",
                    color: "rgba(255, 255, 255, 0.9)",
                    lineHeight: "16px",
                    letterSpacing: "-0.084px",
                  }}
                >
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Popup Content */}
        {activeTopTool && (
          <div
            ref={popupRef}
            className="rounded-[8px] shadow-lg overflow-hidden"
            style={{
              backgroundColor: "rgba(15, 15, 15, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {renderPopupContent()}
          </div>
        )}
      </div>

      {/* Bottom Left - Control Buttons */}
      <div className="absolute bottom-6 left-6 z-50 flex gap-1">
        {/* Home Button */}
        <Tooltip content="Home" side="top">
          <button
            onClick={() => onOperation("HOME")}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-[rgba(15,15,15,0.7)]"
            style={{
              backgroundColor: "rgba(15, 15, 15, 0.5)",
            }}
          >
            <HomeMapIcon size={16} />
          </button>
        </Tooltip>

        {/* My Location Button */}
        <Tooltip content="My Location" side="top">
          <button
            onClick={() => onOperation("LOCATION")}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-[rgba(15,15,15,0.7)]"
            style={{
              backgroundColor: isCurrentGeo
                ? "rgba(59, 130, 246, 0.8)"
                : "rgba(15, 15, 15, 0.5)",
            }}
          >
            <MyLocationIcon size={16} />
          </button>
        </Tooltip>

        {/* Zoom In/Out Grouped (Plus first, then Minus) */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{
            backgroundColor: "rgba(15, 15, 15, 0.5)",
          }}
        >
          <Tooltip content="Zoom In" side="top">
            <button
              onClick={() => onOperation("ZOOM_IN")}
              disabled={!canZoomIn}
              className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.1)] ${
                !canZoomIn ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ZoomInIcon size={16} />
            </button>
          </Tooltip>
          <div
            className="w-px h-6"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.16)" }}
          />
          <Tooltip content="Zoom Out" side="top">
            <button
              onClick={() => onOperation("ZOOM_OUT")}
              disabled={!canZoomOut}
              className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.1)] ${
                !canZoomOut ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ZoomOutIcon size={16} />
            </button>
          </Tooltip>
        </div>

        {/* Undo/Redo Grouped */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{
            backgroundColor: "rgba(15, 15, 15, 0.5)",
          }}
        >
          <Tooltip content="Undo" side="top">
            <button
              onClick={() => onOperation("UNDO")}
              disabled={!canUndo}
              className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.1)] ${
                !canUndo ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <UndoIcon size={16} />
            </button>
          </Tooltip>
          <div
            className="w-px h-6"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.16)" }}
          />
          <Tooltip content="Redo" side="top">
            <button
              onClick={() => onOperation("REDO")}
              disabled={!canRedo}
              className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.1)] ${
                !canRedo ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RedoIcon size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Bottom Right - Compass & Fullscreen */}
      <div className="absolute bottom-6 right-6 z-50 flex gap-1">
        {/* Compass Button */}
        <Tooltip content="Compass" side="top">
          <button
            onClick={handleCompassClick}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-[rgba(15,15,15,0.7)]"
            style={{
              backgroundColor: "rgba(15, 15, 15, 0.5)",
            }}
          >
            <CompassIcon size={16} rotation={-compassRotation} />
          </button>
        </Tooltip>

        {/* Fullscreen Button */}
        <Tooltip content="Fullscreen" side="top">
          <button
            onClick={() => onOperation("FULLSCREEN")}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-[rgba(15,15,15,0.7)]"
            style={{
              backgroundColor: "rgba(15, 15, 15, 0.5)",
            }}
          >
            <FullscreenIcon size={16} />
          </button>
        </Tooltip>
      </div>
    </>
  );
};

export default MapTools;
