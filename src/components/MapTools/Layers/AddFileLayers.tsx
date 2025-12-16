import { X } from "lucide-react";
import UploadIcon from "../../svg/UploadIcon";
import { useState, useRef } from "react";
import { toastError } from "../../../utils/toast";
import CSVLayer from "@arcgis/core/layers/CSVLayer";
import type MapView from "@arcgis/core/views/MapView";
import type { AppliedLayer } from "../../../schema";
import CSVfileIcon from "../../svg/CSVfileIcon";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import * as locator from "@arcgis/core/rest/locator";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";

interface AddFileLayersProps {
  view: MapView | null;
  handleAddLayer: (layer: AppliedLayer) => Promise<void>;
  setIsAddLayersMode: (value: boolean) => void;
}

const MAX_RECORDS = 1000;
const GEOCODE_URL =
  "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

const AddFileLayers = ({
  view,
  handleAddLayer,
  setIsAddLayersMode,
}: AddFileLayersProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [layerName, setLayerName] = useState("");
  const [pointColor, setPointColor] = useState("#FF0000");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const parseCSVDataLine = (line: string): string[] => {
    const result = parseCSVLine(line);
    return result.map((value) => value.trim() || "");
  };

  const parseCSVHeaders = (line: string): string[] => {
    const headers = parseCSVLine(line);
    return headers.map((header) => header.trim().replace(/"/g, ""));
  };

  const validateCSV = async (
    file: File,
  ): Promise<{ isValid: boolean; error?: string }> => {
    try {
      const text = await file.text();
      const lines = text.split("\n");

      const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

      if (nonEmptyLines.length === 0) {
        return { isValid: false, error: "The CSV file is empty" };
      }

      const headers = parseCSVHeaders(nonEmptyLines[0]);
      const lowerHeaders = headers.map((h) => h.toLowerCase());

      const hasLatitude = lowerHeaders.some(
        (h) => h.includes("lat") || h.includes("latitude"),
      );
      const hasLongitude = lowerHeaders.some(
        (h) =>
          h.includes("lng") || h.includes("longitude") || h.includes("lon"),
      );
      const hasAddress = lowerHeaders.some((h) => h.includes("address"));

      if (!hasLatitude && !hasLongitude && !hasAddress) {
        return {
          isValid: false,
          error:
            "CSV must contain either latitude/longitude columns or an address column",
        };
      }

      const recordCount = nonEmptyLines.length - 1;
      if (recordCount > MAX_RECORDS) {
        return {
          isValid: false,
          error: `CSV file exceeds maximum limit of ${MAX_RECORDS} records. Current count: ${recordCount}`,
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error("Error validating CSV:", error);
      return {
        isValid: false,
        error: "Error reading CSV file. Please ensure it's a valid CSV format.",
      };
    }
  };

  const handleFileUpload = async (uploadedFile: File) => {
    if (
      uploadedFile.type === "text/csv" ||
      uploadedFile.name.endsWith(".csv")
    ) {
      if (uploadedFile.size > 5 * 1024 * 1024) {
        toastError("File size exceeds 5MB limit");
        return;
      }

      const validation = await validateCSV(uploadedFile);
      if (!validation.isValid) {
        toastError(validation.error || "Invalid CSV file");
        return;
      }

      setFile(uploadedFile);
      setLayerName(uploadedFile.name.replace(".csv", ""));
    } else {
      toastError("Please upload a CSV file");
    }
  };

  const handleAddLayerClick = async () => {
    if (!file || !view) return;
    setIsLoading(true);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim().length > 0);
      const headers = parseCSVHeaders(lines[0]);
      const lowerHeaders = headers.map((h) => h.toLowerCase());
      const hasLatitude = lowerHeaders.some(
        (h) => h.includes("lat") || h.includes("latitude"),
      );
      const hasLongitude = lowerHeaders.some(
        (h) =>
          h.includes("lng") || h.includes("longitude") || h.includes("lon"),
      );
      const hasAddress = lowerHeaders.some((h) => h.includes("address"));

      const latIdx = lowerHeaders.findIndex(
        (h) => h.includes("lat") || h.includes("latitude"),
      );
      const lonIdx = lowerHeaders.findIndex(
        (h) =>
          h.includes("lon") || h.includes("lng") || h.includes("longitude"),
      );
      const addressIdx = lowerHeaders.findIndex((h) => h.includes("address"));

      const useMixedMode = hasAddress && hasLatitude && hasLongitude;

      const markerSymbol = new SimpleMarkerSymbol({
        color: pointColor,
        size: "8px",
        outline: {
          color: [255, 255, 255],
          width: 1,
        },
      });
      const renderer = new SimpleRenderer({ symbol: markerSymbol });

      let layer;
      let url;

      if (useMixedMode) {
        const geocodedFeatures = [];
        let successCount = 0;
        let failCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVDataLine(lines[i]);
          const lat = values[latIdx];
          const lon = values[lonIdx];
          let geometry = null;
          if (lat && lon && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
            geometry = new Point({
              x: Number(lon),
              y: Number(lat),
              spatialReference: { wkid: 4326 },
            });
          } else if (
            addressIdx !== -1 &&
            values[addressIdx] &&
            values[addressIdx].trim() !== ""
          ) {
            const fullAddress = values[addressIdx].trim();
            try {
              const response = await locator.addressToLocations(GEOCODE_URL, {
                address: { SingleLine: fullAddress },
                outFields: ["*"],
              });
              if (response && response.length > 0) {
                geometry = response[0].location;
              } else {
                failCount++;
                continue;
              }
            } catch (error) {
              console.error(error);
              failCount++;
              continue;
            }
          } else {
            failCount++;
            continue;
          }
          if (geometry) {
            const attributes = Object.fromEntries(
              headers.map((h, idx) => [h, values[idx]]),
            );
            const feature = new Graphic({
              geometry,
              attributes,
            });
            geocodedFeatures.push(feature);
            successCount++;
          }
        }
        if (geocodedFeatures.length === 0) {
          toastError(
            "No valid coordinates or addresses could be mapped. Please check your data.",
          );
          setIsLoading(false);
          return;
        }
        if (failCount > 0) {
          toastError(
            `${failCount} records could not be mapped. ${successCount} records were successfully added.`,
          );
        }

        const sanitizedHeaders = headers.map((header) =>
          header.replace(/\s+/g, "_"),
        );
        const headerMapping = Object.fromEntries(
          headers.map((header, index) => [header, sanitizedHeaders[index]]),
        );

        geocodedFeatures.forEach((feature) => {
          const newAttributes: any = {};
          Object.keys(feature.attributes).forEach((key) => {
            const newKey = headerMapping[key] || key;
            newAttributes[newKey] = feature.attributes[key];
          });
          feature.attributes = newAttributes;
        });

        layer = new FeatureLayer({
          source: geocodedFeatures,
          fields: sanitizedHeaders.map((header, index) => ({
            name: header,
            type: "string",
            alias: headers[index],
            length: 255,
          })),
          objectIdField: "OBJECTID",
          geometryType: "point",
          spatialReference: { wkid: 4326 },
          title: layerName || file.name,
          renderer: renderer,
          popupEnabled: true,
          outFields: ["*"],
        });
        await layer.load();
        url = undefined;
      } else if (hasLatitude && hasLongitude) {
        url = URL.createObjectURL(file);
        layer = new CSVLayer({
          url,
          title: layerName || file.name,
          copyright: "CSV Layer",
          popupEnabled: true,
          labelsVisible: true,
          outFields: ["*"],
          renderer: renderer,
          latitudeField: headers[latIdx],
          longitudeField: headers[lonIdx],
        });
        await layer.load();
      } else if (hasAddress) {
        const geocodedFeatures = [];
        let successCount = 0;
        let failCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVDataLine(lines[i]);
          const address = values[addressIdx];
          if (!address || address.trim() === "") {
            failCount++;
            continue;
          }
          const fullAddress = address.trim();
          try {
            const response = await locator.addressToLocations(GEOCODE_URL, {
              address: { SingleLine: fullAddress },
              outFields: ["*"],
            });
            if (response && response.length > 0) {
              const location = response[0];
              const attributes = Object.fromEntries(
                headers.map((h, idx) => [h, values[idx]]),
              );
              const feature = new Graphic({
                geometry: location.location,
                attributes,
              });
              geocodedFeatures.push(feature);
              successCount++;
            } else {
              failCount++;
              console.warn(`No results found for address: ${fullAddress}`);
            }
          } catch (error) {
            failCount++;
            console.warn(`Failed to geocode address: ${fullAddress}`, error);
          }
        }
        if (geocodedFeatures.length === 0) {
          toastError(
            "No addresses could be geocoded. Please check your address data.",
          );
          setIsLoading(false);
          return;
        }
        if (failCount > 0) {
          toastError(
            `${failCount} addresses could not be geocoded. ${successCount} addresses were successfully added.`,
          );
        }
        const sanitizedHeaders = headers.map((header) =>
          header.replace(/\s+/g, "_"),
        );
        const headerMapping = Object.fromEntries(
          headers.map((header, index) => [header, sanitizedHeaders[index]]),
        );
        geocodedFeatures.forEach((feature) => {
          const newAttributes: any = {};
          Object.keys(feature.attributes).forEach((key) => {
            const newKey = headerMapping[key] || key;
            newAttributes[newKey] = feature.attributes[key];
          });
          feature.attributes = newAttributes;
        });

        layer = new FeatureLayer({
          source: geocodedFeatures,
          fields: sanitizedHeaders.map((header, index) => ({
            name: header,
            type: "string",
            alias: headers[index],
            length: 255,
          })),
          objectIdField: "OBJECTID",
          geometryType: "point",
          spatialReference: { wkid: 4326 },
          title: layerName || file.name,
          renderer: renderer,
          popupEnabled: true,
          outFields: ["*"],
        });
        await layer.load();
        url = undefined;
      } else {
        toastError(
          "CSV must contain either latitude/longitude columns or an address column with data.",
        );
        setIsLoading(false);
        return;
      }

      const fileName = layerName || file.name.replace(".csv", "");
      const popupTitle = `${fileName}`;
      const sanitizedHeaders = headers.map((header) =>
        header.replace(/\s+/g, "_"),
      );

      const popupTemplate = new PopupTemplate({
        title: popupTitle,
        content: [
          {
            type: "fields",
            fieldInfos: sanitizedHeaders.map((header, index) => ({
              fieldName: header,
              label: headers[index],
              visible: true,
            })),
          },
        ],
      });
      layer.popupTemplate = popupTemplate;
      if (view.map) {
        view.map.add(layer);
      }
      const layerToAdd: AppliedLayer = {
        id: layer.id,
        title: layerName || file.name,
        type: hasLatitude && hasLongitude ? "CSV Layer" : "Geocoded Layer",
        url: url || "geocoded",
        visibility: true,
        popupEnabled: true,
        labelsVisible: true,
        isAddedFromWebMap: true,
        isPointLayer: true,
        opacity: 1,
        isAddedFromFile: true,
      };
      await handleAddLayer(layerToAdd);
      setFile(null);
      setLayerName("");
      setIsAddLayersMode(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error processing CSV file:", error);
      toastError(
        "Failed to process CSV file. Please ensure it contains valid coordinate columns or addresses.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setLayerName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-3 rounded-b-sm">
      <p className="text-[#1E293B] text-[14px] font-medium leading-[20px] font-feature-settings-[ss01_on,ss04_on,cv01_on]">
        Upload file
      </p>
      <p className="text-[#475569] text-[12px] font-normal leading-[16px] font-feature-settings-[ss01_on,ss04_on,cv01_on] font-inter">
        Please upload a file to add layer data{" "}
      </p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept=".csv"
        className="hidden"
        disabled={isLoading}
      />
      <div
        className={`mt-3 border border-dashed border-[#CBD5E1] h-40 w-full rounded-sm bg-[#fff] flex flex-col items-center justify-center gap-1 ${
          isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClickUpload}
      >
        <UploadIcon />
        <p className="text-[14px] leading-[20px] font-feature-settings-[ss01_on,ss04_on,cv01_on] mt-2">
          <span className="text-[#1E293B] font-[500]">
            {" "}
            Choose a file or drag & drop it here.
          </span>
        </p>
        <p className="text-[#475569] text-[12px] font-normal leading-[16px] font-feature-settings-[ss01_on,ss04_on,cv01_on] font-inter">
          CSV up to 5MB (max {MAX_RECORDS} records)
        </p>
        <div className="mt-2 border border-[#EBEBEB] rounded-[8px] px-2.5 py-1.5">
          <p className="font-[500] text-[14px] leading-[20px] text-[#5C5C5C]">
            Browse File
          </p>
        </div>
      </div>

      {file && (
        <div className="bg-[#FFF] w-full rounded-sm mt-3 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CSVfileIcon />
              <div>
                <p className="text-[#1E293B] text-[14px] font-normal leading-[20px] font-feature-settings-[ss01_on,ss04_on,cv01_on]">
                  {file.name}
                </p>
                <p className="text-[#64748B] text-[10px] font-normal leading-[12px] font-feature-settings-[ss01_on,ss04_on,cv01_on]">
                  {(file.size / (1024 * 1024)).toFixed(1)}MB
                </p>
              </div>
            </div>
            <X
              className="w-4 h-4 text-[#64748B] cursor-pointer"
              onClick={handleRemoveFile}
            />
          </div>

          <div className="space-y-3">
            <div className="mt-5">
              <p className="text-[#1E293B] text-[13px] font-normal leading-[20px] font-feature-settings-[ss01_on,ss04_on,cv01_on]">
                Layer Name
              </p>
              <input
                type="text"
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter layer name"
              />
            </div>

            <div className="mt-4">
              <p className="text-[#1E293B] text-[13px] font-normal leading-[20px] font-feature-settings-[ss01_on,ss04_on,cv01_on]">
                Point Color
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={pointColor}
                  onChange={(e) => setPointColor(e.target.value)}
                  className="mt-1 w-8 h-8 p-0.5 border border-gray-300 rounded-md"
                />
                <span className="text-sm text-gray-600">{pointColor}</span>
              </div>
            </div>

            <button
              onClick={handleAddLayerClick}
              disabled={isLoading}
              className={`w-full py-1.5 px-4 rounded-[4px] text-sm text-white font-medium bg-[#FA7319]`}
            >
              {isLoading ? "Adding Layer..." : "Add Layer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFileLayers;
