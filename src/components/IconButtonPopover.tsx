import { useState } from "react";
import TooltipText from "./TooltipText";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface IconButtonPopover {
  iconSrc?: string;
  tooltipText?: string;
  PopoverComponent: any;
  className?: string;
  buttonSize?: "default" | "sm" | "lg" | "icon";
  isDisabled?: boolean;
  ButtonContent?: JSX.Element;
  tooltipStyle?: string;
  disabledTooltip?: string;
}

const IconButtonPopover = ({
  iconSrc,
  tooltipText,
  PopoverComponent,
  className = "text-gray-500 hover:bg-[#F1F5F9] cursor-pointer",
  buttonSize,
  isDisabled = false,
  ButtonContent,
  tooltipStyle,
  disabledTooltip = "No items to save",
}: IconButtonPopover) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent popover from opening when disabled
    if (isDisabled) {
      return;
    }

    setIsPopoverOpen((prev) => !prev);
  };

  const PopOverTriggerContent = ButtonContent ? (
    // Wrap ButtonContent in a container to handle disabled state
    <div
      className={isDisabled ? "pointer-events-none" : "cursor-pointer"}
      onClick={handleButtonClick}
      title={isDisabled ? disabledTooltip : undefined}
    >
      {ButtonContent}
    </div>
  ) : (
    <Button
      variant="ghost"
      className={`${className} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
      size={buttonSize}
      onClick={handleButtonClick}
      disabled={isDisabled}
    >
      {tooltipText ? (
        <TooltipText
          toolTipText={isDisabled ? disabledTooltip : tooltipText}
          side="top"
          tooltipStyle={tooltipStyle}
        >
          <img src={iconSrc} alt={tooltipText} />
        </TooltipText>
      ) : (
        <img src={iconSrc} alt={tooltipText} />
      )}
    </Button>
  );

  return (
    <Popover
      open={isDisabled ? false : isPopoverOpen}
      onOpenChange={(open) => {
        if (!isDisabled) {
          setIsPopoverOpen(open);
        }
      }}
    >
      <PopoverTrigger asChild={true}>{PopOverTriggerContent}</PopoverTrigger>

      <PopoverContent className="w-auto bg-white p-0 border-0" align="end">
        <PopoverComponent onClose={() => setIsPopoverOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default IconButtonPopover;
