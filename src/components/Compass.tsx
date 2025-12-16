import { useEffect, useState } from "react";
import type MapView from "@arcgis/core/views/MapView";
import TooltipText from "./TooltipText";
import CompassIcon from "./svg/CompassIcon";

interface CompassProps {
  view: MapView | null;
}

const Compass = ({ view }: CompassProps) => {
  const [rotation, setRotation] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!view) return;

    const handleRotation = () => {
      const currentRotation = view.rotation;
      setRotation(currentRotation);
      setIsVisible(currentRotation !== 0);
    };

    const watchHandle = view.watch("rotation", handleRotation);
    // Initial check
    handleRotation();

    return () => {
      watchHandle.remove();
    };
  }, [view]);

  const handleClick = () => {
    if (!view) return;
    view.goTo({ rotation: 0 });
  };

  if (!isVisible) return null;

  return (
    <TooltipText toolTipText="Compass" side="left">
      <button
        onClick={handleClick}
        className="w-8 h-8 rounded-full bg-[#0F0F0F] shadow-md flex items-center justify-center transition-colors"
        style={{ transform: `rotate(${-rotation}deg)` }}
      >
        <CompassIcon />
      </button>
    </TooltipText>
  );
};

export default Compass;
