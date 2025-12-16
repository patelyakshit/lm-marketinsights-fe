import MapViewComponent from "../../../pages/MapView";

export const MapRendererRoot = () => {
  return (
    <div className="relative rounded-[9px] border border-gray-200 transition-all duration-300 ease-in-out flex-1">
      <div className="h-full">
        <MapViewComponent />
      </div>
    </div>
  );
};
