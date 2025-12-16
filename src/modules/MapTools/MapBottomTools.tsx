import type { FC } from "react";
import { mapConstants } from "../../constants/mapConstants";
import TooltipText from "../../components/TooltipText";
import { Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { MapOperation } from "../../schema";
import Compass from "../../components/Compass";
import HomeIcon from "../../components/svg/HomeIcon";
import LocationIcon from "../../components/svg/LocationIcon";

type IconType = "single" | "combine";
interface Tool {
  key: string;
  name: string;
  iconType: IconType;
  icon?: JSX.Element;
  firstIcon?: JSX.Element;
  secondIcon?: JSX.Element;
  operation?: MapOperation;
  firstOperation?: MapOperation;
  secondOperation?: MapOperation;
  isHighlighted?: boolean;
  info?: {
    latitude: number;
    longitude: number;
  };
  toolTipText: string;
  firstToolTipText: string;
  secondToolTipText: string;
}
interface MapBottomToolsProps {
  onOperation: (operation: MapOperation) => void;
  canUndo: boolean;
  canRedo: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  mapState: {
    latitude: number;
    longitude: number;
  };
  view: any; // TODO: Replace with proper ArcGIS View type
  isCurrentGeo: boolean;
}

const MapBottomTools: FC<MapBottomToolsProps> = ({
  onOperation,
  canUndo,
  canRedo,
  canZoomIn,
  canZoomOut,
  mapState,
  isCurrentGeo,
  view,
}) => {
  const mapTools: Tool[] = [
    {
      key: "LOCATION",
      name: "location",
      iconType: "single",
      icon: <LocationIcon />,
      operation: "LOCATION",
      isHighlighted: true,
      info: {
        latitude: mapState.latitude,
        longitude: mapState.longitude,
      },
      toolTipText: "My Location",
      firstToolTipText: "",
      secondToolTipText: "",
    },
    {
      key: "HOME",
      name: "home",
      iconType: "single",
      icon: <HomeIcon />,
      operation: "HOME",
      isHighlighted: true,
      info: {
        latitude: mapConstants.INITIAL_CENTER[0],
        longitude: mapConstants.INITIAL_CENTER[1],
      },
      toolTipText: "Home",
      firstToolTipText: "",
      secondToolTipText: "",
    },
    {
      key: "ZOOM",
      name: "zoom",
      iconType: "combine",
      firstIcon: <Plus className="h-4 w-4 text-[#FFFFFFCC]" />,
      secondIcon: <Minus className="h-4 w-4 text-[#FFFFFFCC]" />,
      firstOperation: "ZOOM_IN",
      secondOperation: "ZOOM_OUT",
      toolTipText: "",
      firstToolTipText: "Zoom In",
      secondToolTipText: "Zoom Out",
    },
    {
      key: "COMMAND",
      name: "command",
      iconType: "combine",
      firstIcon: <Undo2 className="h-4 w-4 text-[#FFFFFFCC]" />,
      secondIcon: <Redo2 className="h-4 w-4 text-[#FFFFFFCC]" />,
      firstOperation: "UNDO",
      secondOperation: "REDO",
      toolTipText: "",
      firstToolTipText: "Back",
      secondToolTipText: "Forward",
    },
  ];

  return (
    <div className="absolute bottom-[16px] left-[16px] z-50 flex flex-col gap-1.5">
      <Compass view={view} />
      {mapTools.map((tool) => {
        if (tool.iconType === "single" && tool.icon && tool.operation) {
          return (
            <TooltipText
              key={tool.key}
              toolTipText={tool.toolTipText}
              side="right"
            >
              <button
                className={`w-[32px] h-[32px] flex justify-center items-center 
                          rounded-[8px] cursor-pointer ${tool.key === "LOCATION" && isCurrentGeo ? "bg-blue-900" : "bg-[#0F0F0F]"}`}
                onClick={() => {
                  if (tool.operation) {
                    onOperation(tool.operation);
                  }
                }}
              >
                {tool.icon}
              </button>
            </TooltipText>
          );
        } else if (
          tool.iconType === "combine" &&
          tool.firstIcon &&
          tool.secondIcon
        ) {
          return (
            <div
              key={tool.key}
              className="rounded-[8px] cursor-pointer bg-[#0F0F0F] flex flex-col"
            >
              <TooltipText toolTipText={tool.firstToolTipText} side="right">
                <button
                  className={`w-[32px] h-[32px] flex justify-center items-center ${
                    (tool.firstOperation === "ZOOM_IN" && !canZoomIn) ||
                    (tool.firstOperation === "UNDO" && !canUndo)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={
                    (tool.firstOperation === "ZOOM_IN" && !canZoomIn) ||
                    (tool.firstOperation === "UNDO" && !canUndo)
                  }
                  onClick={() => {
                    if (tool.firstOperation === "ZOOM_IN") {
                      onOperation(tool.firstOperation);
                    } else if (tool.firstOperation) {
                      onOperation(tool.firstOperation);
                    }
                  }}
                >
                  {tool.firstIcon}
                </button>
              </TooltipText>
              <div className="w-[20px] h-[1px] bg-[#333333] mx-auto"></div>
              <TooltipText toolTipText={tool.secondToolTipText} side="right">
                <button
                  className={`w-[32px] h-[32px] flex justify-center items-center ${
                    (tool.secondOperation === "ZOOM_OUT" && !canZoomOut) ||
                    (tool.secondOperation === "REDO" && !canRedo)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={
                    (tool.secondOperation === "ZOOM_OUT" && !canZoomOut) ||
                    (tool.secondOperation === "REDO" && !canRedo)
                  }
                  onClick={() => {
                    if (tool.secondOperation === "ZOOM_OUT") {
                      onOperation(tool.secondOperation);
                    } else if (tool.secondOperation) {
                      onOperation(tool.secondOperation);
                    }
                  }}
                >
                  {tool.secondIcon}
                </button>
              </TooltipText>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default MapBottomTools;
