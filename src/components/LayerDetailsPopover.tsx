import { X, Loader2, ExternalLink, Plus, CircleMinus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { API_ENDPOINTS } from "../constants/urlConts";
import { format } from "date-fns";
import LayerInfo from "./LayerInfo";
import { useLayerDetailsStore } from "../store/useLayerDetailsStore";
import { useQuery } from "@tanstack/react-query";
import { getLayerDetails } from "../api";
import { useMapStore } from "../store/useMapStore";
import { useRef, useState } from "react";
import { toastSuccess, toastError } from "../utils/toast";
import { AppliedLayer } from "../schema";
import request from "@arcgis/core/request";

const LoadingSkeleton = () => (
  <div className="">
    <div className="w-full h-[250px] bg-slate-200 rounded-t-[4px] animate-pulse flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-[#475569]" />
    </div>
  </div>
);

const LayerDetailsPopover = () => {
  const { isOpen, layerId, closeLayerDetails } = useLayerDetailsStore();
  const { layers, setLayers } = useMapStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [addingLayerId, setAddingLayerId] = useState<string | null>(null);

  const {
    data: layerDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["layerDetails", layerId],
    queryFn: () => getLayerDetails(layerId!),
    enabled: !!layerId && isOpen,
  });

  const isLayerAdded = (layerId: string) =>
    layers.some((layer) => layer.id === layerId);

  const handleAddRemoveLayer = async () => {
    if (!layerDetails) return;

    if (isLayerAdded(layerDetails.id)) {
      const updatedLayers = layers.filter(
        (layer) => layer.id !== layerDetails.id,
      );
      setLayers(updatedLayers);
      toastSuccess("Layer removed successfully");
    } else {
      setAddingLayerId(layerDetails.id);

      try {
        const layerWithVisibility: AppliedLayer = {
          id: layerDetails.id,
          title: layerDetails.title,
          type: layerDetails.type,
          layerType: layerDetails.type,
          url: layerDetails.url,
          visibility: true,
          popupEnabled: true,
          labelsVisible: true,
          typeKeywords: layerDetails.typeKeywords || [],
          itemId: layerDetails.id,
          extent: (layerDetails as any).extent,
          opacity: 1,
        };

        if (
          layerDetails.type === "Map Service" ||
          (layerDetails as any).layerType === "Map Service"
        ) {
          try {
            const response = await request(`${layerDetails.url}?f=json`, {
              method: "auto",
            });

            if (response.data.layers && response.data.layers.length > 0) {
              const childLayers = response.data.layers.map((subLayer: any) => ({
                id: `${layerDetails.id}_${subLayer.id}`,
                title: subLayer.name,
                type: subLayer.type || "Feature Layer",
                layerType: subLayer.type || "Feature Layer",
                visibility: subLayer.defaultVisibility !== false,
                popupEnabled: true,
                labelsVisible: true,
                minScale: subLayer.minScale,
                maxScale: subLayer.maxScale,
                parentId: layerDetails.id,
                isChildLayer: true,
                sublayerId: subLayer.id,
                url: layerDetails.url,
                geometryType: subLayer.geometryType,
                supportsDynamicLegends: subLayer.supportsDynamicLegends,
                opacity: 1,
              }));

              const layerWithChildLayers = {
                ...layerWithVisibility,
                layers: childLayers,
              };

              setLayers([...layers, layerWithChildLayers]);
              toastSuccess(
                `Added Map Service with ${childLayers.length} sublayers`,
              );
            } else {
              setLayers([...layers, layerWithVisibility]);
              toastSuccess("Layer added successfully");
            }
          } catch (error) {
            console.warn("Could not fetch Map Service sublayers:", error);
            setLayers([...layers, layerWithVisibility]);
            toastSuccess("Layer added successfully");
          }
        } else {
          setLayers([...layers, layerWithVisibility]);
          toastSuccess("Layer added successfully");
        }
      } catch (error) {
        console.error("Error adding layer:", error);
        toastError("Failed to add layer. Please try again.");
      } finally {
        setAddingLayerId(null);
      }
    }
  };

  if (!isOpen || !layerId) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-2 left-2 w-[380px] h-[calc(100vh-78px)] bg-white border border-gray-200 rounded-md z-[999] flex flex-col"
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : layerDetails ? (
        <>
          <div className="relative inline-block flex-shrink-0">
            <img
              src={`${API_ENDPOINTS.ARCGIS_BASEURL}/content/items/${layerDetails.id}/info/${layerDetails.thumbnail}?w=400&token=${import.meta.env.VITE_ARCGIS_API_KEY}`}
              alt={layerDetails.title}
              className="rounded-t-[4px] w-full h-auto"
            />
            <button
              onClick={closeLayerDetails}
              className="absolute top-2 right-3 bg-[#333333B2] rounded-full p-1"
            >
              <X className="h-3.5 w-3.5 text-white cursor-pointer" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 flex flex-col">
            <div className="flex-1">
              <p className="text-black text-[14px] leading-[20px] font-medium px-2 rounded pt-3">
                {layerDetails.title}
              </p>
              <p className="text-[#94A3B8] text-[10px] leading-[20px] font-medium px-2 rounded">
                Updated:{" "}
                {layerDetails.modified &&
                  format(new Date(layerDetails.modified), "dd MMM, yyyy")}
              </p>
              <p className="text-[#64748B] text-[12px] font-normal leading-[16px] tracking-[0%] px-2 pt-3">
                SUMMARY
              </p>
              <p className="text-[#1E293B] text-[13px] font-[400] px-2 pt-1">
                {layerDetails.snippet}
              </p>

              <p className="text-[#64748B] text-[12px] font-normal leading-[16px] tracking-[0%] px-2 pt-4">
                LAYER
              </p>
              <p className="text-[#1E293B] text-[13px] font-[400] px-2 pt-1">
                {layerDetails.type}
              </p>
              <p className="text-[#64748B] text-[12px] font-normal leading-[16px] tracking-[0%] px-2 pt-4">
                OWNER
              </p>
              <p className="text-[#1E293B] text-[13px] font-[400] px-2 pt-1">
                {layerDetails.owner
                  ?.replace(/_/g, " ")
                  .replace(/\b\w/g, (char: string) => char.toUpperCase())}
              </p>
              <p className="text-[#64748B] text-[12px] font-normal leading-[16px] tracking-[0%] px-2 pt-4">
                SHARING
              </p>
              <p className="text-[#1E293B] text-[13px] font-[400] px-2 pt-1">
                {layerDetails.access === "public"
                  ? "Public (Everyone)"
                  : layerDetails.accessInformation}
              </p>
              <div className="border-t border-[#E2E8F0] mt-4" />
              <Accordion type="single" collapsible={true}>
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-[#475569] font-normal text-[14px] leading-[20px] tracking-[0%] px-2">
                    Description
                  </AccordionTrigger>
                  <AccordionContent className="text-[#475569] bg-[#F1F5F9] font-normal text-[14px] leading-[20px] tracking-[0%]">
                    {layerDetails.description ? (
                      <p
                        className="px-2 py-2"
                        dangerouslySetInnerHTML={{
                          __html: layerDetails.description || "",
                        }}
                      ></p>
                    ) : (
                      <p className="w-full text-center text-[13px] text-[#64748B] italic pt-2">
                        Description not found
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="border-t border-[#E2E8F0] my-1" />
              <Accordion type="single" collapsible={true}>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-[#475569] font-normal text-[14px] leading-[20px] tracking-[0%] px-2">
                    Details
                  </AccordionTrigger>
                  <AccordionContent className="text-[#475569] bg-[#F1F5F9] font-normal text-[14px] leading-[20px] tracking-[0%]">
                    <div className="px-0">
                      <LayerInfo layerDetails={layerDetails} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div className="border-t border-[#E2E8F0] my-1" />
            <div className="p-2.5 flex flex-row gap-2">
              <button
                onClick={() =>
                  window.open(
                    `${API_ENDPOINTS.LAYER_DETAILS_BASE_URL}${layerDetails.id}`,
                    "_blank",
                  )
                }
                className="border border-[#E2E8F0] h-[36px] rounded-[4px] py-1 px-2 text-[13px] w-full text-[#475569] hover:bg-[#E8F1FF] flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                Know more
              </button>
              <button
                onClick={handleAddRemoveLayer}
                disabled={addingLayerId === layerDetails.id}
                className={`border h-[36px] rounded-[4px] py-1 px-2 text-[13px] w-full flex items-center justify-center gap-2 ${
                  isLayerAdded(layerDetails.id)
                    ? "border-red-300 bg-red-100 text-red-600 hover:bg-red-200"
                    : "border-[#E2E8F0] text-[#475569] hover:bg-[#E8F1FF]"
                } ${addingLayerId === layerDetails.id ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {addingLayerId === layerDetails.id ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    {isLayerAdded(layerDetails.id) ? (
                      <CircleMinus className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    {isLayerAdded(layerDetails.id)
                      ? "Remove from map"
                      : "Add to map"}
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      ) : error ? (
        <div className="p-4 text-center text-red-600">
          <p>Failed to load layer details</p>
          <button
            onClick={closeLayerDetails}
            className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default LayerDetailsPopover;
