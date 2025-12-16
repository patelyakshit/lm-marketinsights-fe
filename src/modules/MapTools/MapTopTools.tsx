import { useState, useRef, useEffect } from "react";
import { Eye, Trash2, Plus } from "lucide-react";
import TooltipText from "../../components/TooltipText";
import PinNoteIcon from "../../components/svg/PinNoteIcon";
import AnalyzeIcon from "../../components/svg/AnalyzeIcon";
import MeasureIcon from "../../components/svg/MeasureIcon";
import SketchIcon from "../../components/svg/SketchIcon";
import SearchIcon from "../../components/svg/SearchIcon";
import { LocationSearchTool } from "./LocationSearchTool";

export type MapOperation = "LOCATION";

interface MapTool {
  key: number;
  name: string;
  label: string;
  toolTipText: string;
  icon: (isActive: boolean) => JSX.Element;
}

interface MapTopToolsProps {
  onAddPin?: () => void;
  onViewAllPins?: () => void;
  onRemoveAllPins?: () => void;
  pinCount?: number;
}

const MapTopTools: React.FC<MapTopToolsProps> = ({
  onAddPin,
  onViewAllPins,
  onRemoveAllPins,
  pinCount = 0,
}) => {
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<MapTool | null>(null);
  const [isPinPopupOpen, setIsPinPopupOpen] = useState(false);
  const pinButtonRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const toolButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>(
    {},
  );
  const toolPopupRef = useRef<HTMLDivElement | null>(null);
  const [toolPopupPosition, setToolPopupPosition] = useState({
    top: 0,
    left: 0,
  });

  const isViewAllPinsDisabled = pinCount === 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPinPopupOpen &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        pinButtonRef.current &&
        !pinButtonRef.current.contains(event.target as Node)
      ) {
        setIsPinPopupOpen(false);
      }

      if (
        open &&
        activeTool &&
        toolPopupRef.current &&
        !toolPopupRef.current.contains(event.target as Node) &&
        toolButtonRefs.current[activeTool.name] &&
        !toolButtonRefs.current[activeTool.name]?.contains(event.target as Node)
      ) {
        setActiveTool(null);
        setOpen(false);
      }
    };

    if (isPinPopupOpen || open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPinPopupOpen, open, activeTool]);

  const handleIconClick = (tool: MapTool) => {
    setIsPinPopupOpen(false);

    if (activeTool?.name === tool.name) {
      setActiveTool(null);
      setOpen(false);
    } else {
      setActiveTool(tool);
      setOpen(true);

      // Calculate popup position for the clicked tool
      const buttonRef = toolButtonRefs.current[tool.name];
      if (buttonRef) {
        const rect = buttonRef.getBoundingClientRect();
        const relativeParent = buttonRef.closest(".absolute");

        if (relativeParent) {
          const parentRect = relativeParent.getBoundingClientRect();
          setToolPopupPosition({
            top: rect.top - parentRect.top,
            left: rect.right - parentRect.left + 8,
          });
        } else {
          setToolPopupPosition({
            top: 0,
            left: 44,
          });
        }
      }
    }
  };

  const handlePinButtonClick = () => {
    setActiveTool(null);
    setOpen(false);

    if (pinButtonRef.current) {
      const rect = pinButtonRef.current.getBoundingClientRect();
      const relativeParent = pinButtonRef.current.parentElement;

      if (relativeParent) {
        const parentRect = relativeParent.getBoundingClientRect();
        setPopupPosition({
          top: rect.top - parentRect.top,
          left: rect.right - parentRect.left + 8,
        });
      } else {
        setPopupPosition({
          top: 0,
          left: 44,
        });
      }
    }
    setIsPinPopupOpen((prev) => !prev);
  };

  const handleAddPin = () => {
    onAddPin?.();
    setIsPinPopupOpen(false);
  };

  const handleViewAllPins = () => {
    onViewAllPins?.();
    setIsPinPopupOpen(false);
  };

  const handleRemoveAllPins = () => {
    onRemoveAllPins?.();
    setIsPinPopupOpen(false);
  };

  const mapTools: MapTool[] = [
    {
      key: 1,
      name: "search",
      toolTipText: "Find Location",
      label: "Search Location",
      icon: (isActive: boolean) => <SearchIcon isActive={isActive} />,
    },
    {
      key: 2,
      name: "measurements",
      toolTipText: "Measurements",
      label: "Measurements",
      icon: (isActive: boolean) => <MeasureIcon isActive={isActive} />,
    },
    {
      key: 3,
      name: "analyze",
      toolTipText: "Analyze",
      label: "Analyze",
      icon: (isActive: boolean) => <AnalyzeIcon isActive={isActive} />,
    },
  ];

  const sketchTool: MapTool = {
    key: 4,
    name: "sketch",
    toolTipText: "Sketch",
    label: "Sketch",
    icon: (isActive: boolean) => <SketchIcon isActive={isActive} />,
  };

  const renderContent = () => {
    if (!activeTool) return null;

    if (activeTool.name === "search") {
      return <LocationSearchTool />;
    }

    if (activeTool.name === "measurements") {
      return (
        <div className="p-4">
          <p className="text-sm text-gray-600">Measurements - Coming Soon</p>
        </div>
      );
    }

    if (activeTool.name === "analyze") {
      return (
        <div className="p-4">
          <p className="text-sm text-gray-600">Analyze - Coming Soon</p>
        </div>
      );
    }

    if (activeTool.name === "sketch") {
      return (
        <div className="p-4">
          <p className="text-sm text-gray-600">Sketch - Coming Soon</p>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="absolute top-[16px] left-[16px] flex flex-col gap-[8px] z-50">
        {/* Search Tool */}
        <div className="relative">
          <TooltipText
            toolTipText={mapTools[0].toolTipText}
            side="right"
            variant="light"
          >
            <button
              key={mapTools[0].key}
              ref={(el) => (toolButtonRefs.current[mapTools[0].name] = el)}
              className={`w-[36px] h-[36px] flex justify-center items-center rounded-[4px] cursor-pointer transition-colors ${
                mapTools[0].name === activeTool?.name
                  ? "bg-[#FF891C]"
                  : "bg-[#FFFFFF] hover:bg-[#EBEBEB]"
              }`}
              onClick={() => handleIconClick(mapTools[0])}
            >
              {mapTools[0].icon(mapTools[0].name === activeTool?.name)}
            </button>
          </TooltipText>
        </div>

        {/* Other Map Tools */}
        {mapTools.slice(1).map((tool) => (
          <div key={tool.key} className="relative">
            <TooltipText
              toolTipText={tool.toolTipText}
              side="right"
              variant="light"
            >
              <button
                ref={(el) => (toolButtonRefs.current[tool.name] = el)}
                className={`w-[36px] h-[36px] flex justify-center items-center rounded-[4px] cursor-pointer transition-colors ${
                  tool.name === activeTool?.name
                    ? "bg-[#FF891C]"
                    : "bg-[#FFFFFF] hover:bg-[#EBEBEB]"
                }`}
                onClick={() => handleIconClick(tool)}
              >
                {tool.icon(tool.name === activeTool?.name)}
              </button>
            </TooltipText>
          </div>
        ))}

        {/* Pin & Note Button */}
        <div className="relative">
          <TooltipText toolTipText="Pin & Note" side="right" variant="light">
            <button
              ref={pinButtonRef}
              className={`w-[36px] h-[36px] flex justify-center items-center rounded-[4px] cursor-pointer transition-colors ${
                isPinPopupOpen
                  ? "bg-[#FF891C]"
                  : "bg-[#FFFFFF] hover:bg-[#EBEBEB]"
              }`}
              onClick={handlePinButtonClick}
            >
              <PinNoteIcon isActive={isPinPopupOpen} />
            </button>
          </TooltipText>
          {isPinPopupOpen && (
            <div
              ref={popupRef}
              className="absolute bg-white border border-[#EBEBEB] border-solid rounded-[8px] z-[9999] min-w-[200px] shadow-lg"
              style={{
                top: `${popupPosition.top}px`,
                left: `${popupPosition.left}px`,
              }}
            >
              <div className="flex flex-col gap-[4px] p-[8px] ">
                <button
                  onClick={handleAddPin}
                  className="flex gap-[8px] items-center p-[8px] rounded-[8px] w-full hover:bg-[#F7F7F7] transition-colors text-left cursor-pointer"
                >
                  <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
                    <Plus className="h-4 w-4 text-[#5C5C5C]" />
                  </div>
                  <span className="text-[14px] leading-[20px] text-[#171717] font-normal">
                    Add Pin
                  </span>
                </button>

                <button
                  disabled={isViewAllPinsDisabled}
                  onClick={() => {
                    if (!isViewAllPinsDisabled) {
                      handleViewAllPins();
                    }
                  }}
                  className={`flex gap-[8px] items-center p-[8px] rounded-[8px] w-full transition-colors text-left ${
                    isViewAllPinsDisabled
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:bg-[#F7F7F7]"
                  }`}
                >
                  <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
                    <Eye
                      className={`h-4 w-4 ${
                        isViewAllPinsDisabled
                          ? "text-[#A3A3A3]"
                          : "text-[#5C5C5C]"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[14px] leading-[20px] font-normal ${
                      isViewAllPinsDisabled
                        ? "text-[#A3A3A3]"
                        : "text-[#171717]"
                    }`}
                  >
                    View all pins{pinCount > 0 ? ` (${pinCount})` : ""}
                  </span>
                </button>

                <div className="h-px bg-[#EBEBEB] my-[1.5px]"></div>

                <button
                  disabled={isViewAllPinsDisabled}
                  onClick={() => {
                    if (!isViewAllPinsDisabled) {
                      handleRemoveAllPins();
                    }
                  }}
                  className={`flex gap-[8px] items-center p-[8px] rounded-[8px] w-full transition-colors text-left ${
                    isViewAllPinsDisabled
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:bg-[#F7F7F7]"
                  }`}
                >
                  <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
                    <Trash2
                      className={`h-4 w-4 ${
                        isViewAllPinsDisabled
                          ? "text-[#A3A3A3]"
                          : "text-[#FB3748]"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[14px] leading-[20px] font-normal ${
                      isViewAllPinsDisabled
                        ? "text-[#A3A3A3]"
                        : "text-[#FB3748]"
                    }`}
                  >
                    Remove all pins
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sketch Button */}
        <div className="relative">
          <TooltipText
            toolTipText={sketchTool.toolTipText}
            side="right"
            variant="light"
          >
            <button
              ref={(el) => (toolButtonRefs.current[sketchTool.name] = el)}
              className={`w-[36px] h-[36px] flex justify-center items-center rounded-[4px] cursor-pointer transition-colors ${
                sketchTool.name === activeTool?.name
                  ? "bg-[#FF891C]"
                  : "bg-[#FFFFFF] hover:bg-[#EBEBEB]"
              }`}
              onClick={() => handleIconClick(sketchTool)}
            >
              {sketchTool.icon(sketchTool.name === activeTool?.name)}
            </button>
          </TooltipText>
        </div>

        {/* Tool Popup (for search, measurements, analyze, sketch) */}
        {open && activeTool && (
          <div
            ref={toolPopupRef}
            className="absolute bg-white border border-[#EBEBEB] border-solid rounded-[8px] z-[9999] w-[320px] shadow-lg"
            style={{
              top: `${toolPopupPosition.top}px`,
              left: `${toolPopupPosition.left}px`,
            }}
          >
            {renderContent()}
          </div>
        )}
      </div>
    </>
  );
};

export default MapTopTools;
