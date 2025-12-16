import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import TabContent from "./TabContent";

interface AddDataProps {
  onBack: () => void;
  onAddLayer?: (layer: any) => Promise<void>;
  onRemoveLayer?: (layerId: string) => void;
  isLayerAdded?: (layerId: string) => boolean;
  addingLayerId?: string | null;
}

const AddData = ({
  onBack,
  onAddLayer,
  onRemoveLayer,
  isLayerAdded,
  addingLayerId,
}: AddDataProps) => {
  const [selectedTab, setSelectedTab] = useState("Curated");

  return (
    <div>
      <div className="px-4 py-3 flex flex-row gap-3 items-center">
        <ArrowLeft
          strokeWidth={1.5}
          className="w-4 h-4 cursor-pointer"
          onClick={onBack}
        />
        <p className="text-[14px] text-black font-[500]">Add data</p>
      </div>

      <div className="border-t border-gray-200"></div>

      {/* Tabs */}
      <div className="px-2 py-2">
        <div className="flex border border-gray-200 rounded-[3px] bg-white">
          <button
            className={`flex-1 py-1.5 px-3 text-[12px] font-[500] border-r border-gray-200 first:rounded-l-[3px] last:rounded-r-[3px] last:border-r-0 ${
              selectedTab === "Curated" ? "bg-[#EBEBEB]" : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedTab("Curated")}
          >
            Curated
          </button>
          <button
            className={`flex-1 py-1.5 px-3 text-[12px] font-[500] border-r border-gray-200 first:rounded-l-[3px] last:rounded-r-[3px] last:border-r-0 ${
              selectedTab === "ArcGIS" ? "bg-[#EBEBEB]" : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedTab("ArcGIS")}
          >
            ArcGIS
          </button>
          <button
            className={`flex-1 py-1.5 px-3 text-[12px] font-[500] border-r border-gray-200 first:rounded-l-[3px] last:rounded-r-[3px] last:border-r-0 ${
              selectedTab === "File" ? "bg-[#EBEBEB]" : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedTab("File")}
          >
            File
          </button>
          <button
            className={`flex-1 py-1.5 px-3 text-[12px] font-[500] border-r border-gray-200 first:rounded-l-[3px] last:rounded-r-[3px] last:border-r-0 ${
              selectedTab === "Web" ? "bg-[#EBEBEB]" : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedTab("Web")}
          >
            Web
          </button>
          <button
            className={`flex-1 py-1.5 px-3 text-[12px] font-[500] border-r border-gray-200 first:rounded-l-[3px] last:rounded-r-[3px] last:border-r-0 ${
              selectedTab === "favorite" ? "bg-[#EBEBEB]" : "hover:bg-gray-200"
            }`}
            onClick={() => setSelectedTab("favorite")}
          >
            Favorite
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <TabContent
        selectedTab={selectedTab}
        onAddLayer={onAddLayer}
        onRemoveLayer={onRemoveLayer}
        isLayerAdded={isLayerAdded}
        addingLayerId={addingLayerId}
        onBack={onBack}
      />
    </div>
  );
};

export default AddData;
