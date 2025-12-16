import { useState } from "react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "../../components/ui/popover";
import { cn } from "../../lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  getLocationCandidates,
  getLocationSuggestions,
  LocationSuggestionType,
} from "../../api";
import useDebounce from "../../hooks/useDebounce";
import { getMapActionsController } from "../../utils/map-actions-controller";
import { Button } from "../../components/ui/button";

export const LocationSearchTool = () => {
  const [locationInput, setLocationInput] = useState<string | "">("");
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const debouncedLocationInput = useDebounce(locationInput, 300);

  const isItSensibleLocation = debouncedLocationInput.trim().length >= 2;

  const {
    data: addressSuggestions,
    isLoading,
    error: addressSuggestionApiError,
  } = useQuery({
    queryKey: ["geocodeAddress", debouncedLocationInput],
    queryFn: () =>
      getLocationSuggestions({
        max_locations_suggestions: 30,
        address_query: debouncedLocationInput,
      }),
    enabled: isItSensibleLocation,
  });

  const suggestedLocationCandidates = addressSuggestions?.suggestions;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetInput = e.target.value;
    setLocationInput(targetInput);

    const trimmedInput = targetInput.trim();

    if (trimmedInput.length === 0) {
      setIsPopoverOpen(false);
      return;
    }

    setIsPopoverOpen(true);
  };

  const handleCandidateClick = async (
    clickedSuggestion: LocationSuggestionType,
  ) => {
    const mapControllerInstance = getMapActionsController();

    const result = await getLocationCandidates({
      query: clickedSuggestion.text,
      magicKey: clickedSuggestion.magicKey, // if you wired this
      maxLocations: 30,
    });

    const locationCandidates = result?.candidates ?? [];

    if (locationCandidates.length === 0) {
      console.warn(
        "No location candidates returned for:",
        clickedSuggestion.text,
      );
      return;
    }

    const best = locationCandidates[0];

    mapControllerInstance.showLocation(best.extent);
  };

  return (
    <div className="w-full h-full flex items-center justify-between py-1 rounded-sm bg-white relative">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverAnchor asChild>
          <input
            autoFocus={true}
            className="w-full border-none outline-none px-2 py-1 caret-neutral-500"
            aria-label="search input for location"
            type="text"
            value={locationInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e)
            }
          />
        </PopoverAnchor>

        <PopoverContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="!w-[320px] max-h-[500px] overflow-auto p-0 mt-1 bg-white border-neutral-300"
          align="start"
        >
          {addressSuggestionApiError && (
            <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-200">
              Failed to fetch location suggestions. Please try again.
            </div>
          )}

          {isLoading && !addressSuggestionApiError && (
            <div className="px-4 py-2 text-xs text-neutral-500">Searching…</div>
          )}

          {!isLoading &&
            !addressSuggestionApiError &&
            (!suggestedLocationCandidates ||
              suggestedLocationCandidates.length === 0) &&
            debouncedLocationInput.trim().length >= 2 && (
              <div className="px-4 py-2 text-xs text-neutral-500">
                No locations found.
              </div>
            )}

          {!addressSuggestionApiError &&
            suggestedLocationCandidates?.map(
              (candidate: LocationSuggestionType, index) => (
                <Button
                  key={candidate.text}
                  className={cn(
                    "w-full !h-full shadow-none border-none !px-4 py-2",
                    "hover:bg-gray-100 cursor-pointer",
                    "whitespace-normal text-left block",
                    index === 0
                      ? "rounded-t-sm"
                      : index === (suggestedLocationCandidates?.length ?? 0) - 1
                        ? "rounded-b-sm"
                        : "rounded-none",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCandidateClick(candidate);
                  }}
                >
                  <span className="block w-full text-left whitespace-normal leading-snug">
                    {candidate.text}
                  </span>
                </Button>
              ),
            )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
