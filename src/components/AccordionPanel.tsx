import React, { useState, useCallback, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";

export interface AccordionItem {
  id: string;
  title: string;
  icon: React.ComponentType<{
    className?: string;
    size?: number;
    width?: number;
    height?: number;
    isActive?: boolean;
  }>;
  content: React.ReactNode;
  isAlwaysOpen?: boolean;
}
export interface AccordionPanelProps {
  items: AccordionItem[];
  className?: string;
  onToggle?: (hasExpanded: boolean, expandedItemId?: string) => void;
}

export const AccordionPanel: React.FC<AccordionPanelProps> = ({
  items,
  className,
  onToggle,
}) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Notify parent of toggle changes
  useEffect(() => {
    if (onToggle) {
      onToggle(expandedItem !== null, expandedItem || undefined);
    }
  }, [expandedItem, onToggle]);

  const handleToggle = useCallback((itemId: string) => {
    setExpandedItem((prev) => (prev === itemId ? null : itemId));
  }, []);

  // Calculate dynamic flex values for expanded item
  const getItemStyle = (itemId: string, index: number) => {
    const isExpanded = expandedItem === itemId;
    const isLastItem = index === items.length - 1;

    return {
      flex: isExpanded ? "1 1 auto" : "0 0 48px",
      minHeight: "48px",
      maxHeight: isExpanded ? "none" : "48px",
      borderBottom: !isLastItem ? "1px solid #EBEBEB" : "none",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      overflow: "hidden",
    };
  };

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {items.map((item, index) => {
        const isExpanded = expandedItem === item.id;
        const IconComponent = item.icon;

        return (
          <div
            key={item.id}
            className="flex flex-col accordion-item"
            style={getItemStyle(item.id, index)}
          >
            {/* Header Button */}
            <button
              onClick={() => handleToggle(item.id)}
              className={cn(
                "flex items-center justify-between text-left transition-all duration-200 ease-in-out w-full flex-shrink-0 group",
                "bg-white hover:bg-gray-100",
              )}
              style={{
                height: "48px",
                minHeight: "48px",
                padding: "14px",
                gap: "10px",
                borderBottom: isExpanded ? "1px solid #EBEBEB" : "none",
              }}
            >
              <div className="flex items-center gap-[10px]">
                <IconComponent
                  className="text-gray-950 flex-shrink-0 transition-colors duration-200"
                  size={18}
                />
                <span
                  className="font-medium text-gray-800 truncate transition-colors duration-200 group-hover:text-gray-950"
                  style={{
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontWeight: 500,
                    fontSize: "14px",
                    lineHeight: "20px",
                    letterSpacing: "-0.006em",
                  }}
                >
                  {item.title}
                </span>
              </div>
              <div className="text-gray-400 flex-shrink-0 transition-colors duration-200 group-hover:text-gray-600">
                {isExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            </button>

            {/* Content Area */}
            <div
              className={cn(
                "bg-white overflow-hidden transition-all duration-300 ease-in-out",
                isExpanded ? "opacity-100" : "opacity-0",
              )}
              style={{
                height: isExpanded ? "calc(100% - 48px)" : "0",
                minHeight: isExpanded ? "0" : "0",
                visibility: isExpanded ? "visible" : "hidden",
              }}
            >
              <div
                className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent accordion-content"
                style={{
                  padding: isExpanded ? "12px" : "0",
                  paddingTop: isExpanded ? "4px" : "0",
                }}
              >
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AccordionPanel;
