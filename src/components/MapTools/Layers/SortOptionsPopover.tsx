import { ChevronRight } from "lucide-react";
import React, { useState } from "react";

interface SortOptionsPopoverProps {
  onSortChange?: (sortOption: string) => void;
  currentSort?: string;
}

interface SortOption {
  id: string;
  label: string;
  subOptions?: SortOption[];
}

const sortOptions: SortOption[] = [
  { id: "Relevance", label: "Relevance" },
  { id: "Title", label: "Title" },
  { id: "Owner", label: "Owner" },
  { id: "Rating", label: "Rating" },
  {
    id: "Views",
    label: "Views",
    subOptions: [
      { id: "least", label: "Least View" },
      { id: "most", label: "Most View" },
    ],
  },
  {
    id: "DateModified",
    label: "Date Modified",
    subOptions: [
      { id: "today", label: "Today" },
      { id: "yesterday", label: "Yesterday" },
      { id: "last7days", label: "Last 7 days" },
      { id: "last30days", label: "Last 30 days" },
    ],
  },
];

const SortOptionsPopover: React.FC<SortOptionsPopoverProps> = ({
  onSortChange,
  currentSort = "Relevance",
}) => {
  const [selectedSort, setSelectedSort] = useState<string>(currentSort);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    onSortChange?.(value);
    setExpandedOption(null); // Close submenu when option is selected
  };

  const handleOptionClick = (option: SortOption) => {
    if (option.subOptions) {
      // Toggle submenu
      setExpandedOption(expandedOption === option.id ? null : option.id);
    } else {
      // Select the option
      handleSortChange(option.id);
    }
  };

  const handleSubOptionClick = (parentId: string, subOption: SortOption) => {
    const fullValue = `${parentId}:${subOption.id}`;
    handleSortChange(fullValue);
  };

  return (
    <div
      className="flex flex-col items-start gap-1 p-0 rounded-lg border border-[#E2E8F0] bg-white shadow-lg"
      style={{
        width: "200px",
        boxShadow: "0px 4px 20px -8px rgba(0, 0, 0, 0.25)",
      }}
    >
      <div className="w-full p-1.5">
        <div className="space-y-1">
          {sortOptions.map((option) => (
            <div key={option.id}>
              <button
                onClick={() => handleOptionClick(option)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded text-left transition-colors ${
                  selectedSort === option.id
                    ? "bg-[#F1F5F9] text-[#1E293B] font-medium"
                    : "text-[#475569] font-normal hover:bg-gray-50"
                }`}
                style={{
                  fontSize: "14px",
                  fontStyle: "normal",
                  fontWeight: selectedSort === option.id ? 500 : 400,
                  lineHeight: "20px",
                }}
              >
                <span>{option.label}</span>
                {option.subOptions && (
                  <span className="text-xs">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              {/* Sub-options */}
              {option.subOptions && expandedOption === option.id && (
                <div className="ml-4 mt-1 space-y-1">
                  {option.subOptions.map((subOption) => (
                    <button
                      key={subOption.id}
                      onClick={() => handleSubOptionClick(option.id, subOption)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors ${
                        selectedSort === `${option.id}:${subOption.id}`
                          ? "bg-[#F1F5F9] text-[#1E293B] font-medium"
                          : "text-[#475569] font-normal hover:bg-gray-50"
                      }`}
                      style={{
                        fontSize: "14px",
                        fontStyle: "normal",
                        fontWeight:
                          selectedSort === `${option.id}:${subOption.id}`
                            ? 500
                            : 400,
                        lineHeight: "20px",
                      }}
                    >
                      {subOption.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SortOptionsPopover;
