import React, { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DEFAULT_PIN_NOTE_TITLE } from "../constants/pins";

interface PinNotePopoverProps {
  position: { x: number; y: number };
  title: string;
  note: string;
  isEditing: boolean;
  onTitleChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onNoteSave: (value: { note: string; title: string }) => void;
  onRequestEdit: () => void;
  onRequestRemove: () => void;
  onDismiss?: () => void;
}

const PinNotePopover: React.FC<PinNotePopoverProps> = ({
  position,
  title,
  note,
  isEditing,
  onTitleChange,
  onNoteChange,
  onNoteSave,
  onRequestEdit,
  onRequestRemove,
  onDismiss,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayTitle =
    title.trim().length > 0 ? title.trim() : DEFAULT_PIN_NOTE_TITLE;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
        onDismiss?.();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onDismiss]);

  useEffect(() => {
    if (!isEditing) {
      setIsMenuOpen(false);
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const focusHandle = requestAnimationFrame(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      } else {
        noteInputRef.current?.focus();
      }
    });

    return () => {
      cancelAnimationFrame(focusHandle);
    };
  }, [isEditing]);

  const handleSave = () => {
    if (!isEditing) {
      return;
    }

    onNoteSave({
      note,
      title,
    });
  };

  const handleFieldBlur = (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const nextTarget = event.relatedTarget as HTMLElement | null;
    if (nextTarget && containerRef.current?.contains(nextTarget)) {
      return;
    }
    handleSave();
  };

  const handleKeyDown: React.KeyboardEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (event) => {
    if (
      ((event.metaKey || event.ctrlKey) && event.key === "Enter") ||
      event.key === "Enter"
    ) {
      event.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-[1200] pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, calc(-100% - 12px))",
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="relative w-[240px] rounded-[8px] border border-[#EBEBEB] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[#EBEBEB] px-[12px] py-[8px]">
          <div className="flex-1 min-w-0 pr-[8px]">
            {isEditing ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                onBlur={handleFieldBlur}
                onKeyDown={handleKeyDown}
                placeholder="Pin Note"
                aria-label="Pin note title"
                className="w-full rounded-[6px] px-[6px] py-[4px] font-weight-500 text-[12px] font-medium leading-[16px] text-[#171717] focus:outline-none"
              />
            ) : (
              <p className="truncate text-[12px] font-medium font-weight-500 leading-[16px] text-[#171717] ">
                {displayTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] hover:bg-[#F5F5F5]"
            aria-label="Open pin options"
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
          >
            <MoreHorizontal className="h-4 w-4 text-[#5C5C5C]" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-[12px] top-[44px] z-[1201] w-[156px] rounded-[8px] border border-[#EBEBEB] bg-white shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-[8px] px-[12px] py-[10px] text-left text-[13px] font-medium leading-[18px] text-[#171717] hover:bg-[#F7F7F7]"
                onClick={() => {
                  onRequestEdit();
                  setIsMenuOpen(false);
                }}
              >
                <Pencil className="h-4 w-4 text-[#5C5C5C]" />
                Edit pin
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-[8px] px-[12px] py-[10px] text-left text-[13px] font-medium leading-[18px] text-[#FB3748] hover:bg-[#FFF2F3]"
                onClick={() => {
                  onRequestRemove();
                  setIsMenuOpen(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Remove pin
              </button>
            </div>
          )}
        </div>
        <div className="px-[12px] py-[10px]">
          <textarea
            ref={noteInputRef}
            value={note}
            onChange={(event) => {
              onNoteChange(event.target.value);
            }}
            onBlur={handleFieldBlur}
            onKeyDown={handleKeyDown}
            placeholder="Add a note message here"
            className={`min-h-[30px] max-h-[90px] w-full resize-none rounded-[6px] px-[6px] py-[6px] text-[12px] leading-[16px] placeholder:text-[#A3A3A3] bg-white focus:outline-none text-[#171717]`}
            readOnly={!isEditing}
          />
        </div>
      </div>
      {/* Arrow/Tail pointing down to the pin */}
      <div className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 flex items-center justify-center -mt-[1px]">
        <div className="flex items-center justify-center relative shrink-0">
          <svg
            width="8"
            height="4"
            viewBox="0 0 8 4"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block"
          >
            {/* Triangle shape with fill */}
            <path d="M0 0L4 4L8 0Z" fill="white" />
            {/* Only draw borders on left, right, and bottom edges (not top) */}
            <path
              d="M0 0L4 4L8 0"
              stroke="#EBEBEB"
              strokeWidth="1"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Overlay white line to hide top border */}
            <line
              x1="0.5"
              y1="0"
              x2="7.5"
              y2="0"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PinNotePopover;
