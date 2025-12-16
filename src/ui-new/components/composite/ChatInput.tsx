import React, { useRef, useEffect } from "react";
import { cn } from "../../../lib/utils";
import { Mic, Send, X, Check } from "lucide-react";
import { Button } from "../base/Button";
import VoiceModeIcon from "../../../components/svg/VoiceModeIcon";

export interface ChatInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSend?: () => void;
  onMicClick?: () => void;
  onVoiceModeClick?: () => void;
  isDictationMode?: boolean;
  isSubmitting?: boolean;
  showVoiceMode?: boolean;
  voiceModeSupported?: boolean;
  browserSupportsSpeechRecognition?: boolean;
  audioLevels?: number[];
  isAnalyzing?: boolean;
  onStopDictation?: () => void;
  onConfirmDictation?: () => void;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  (
    {
      className,
      onSend,
      onMicClick,
      onVoiceModeClick,
      isDictationMode = false,
      isSubmitting = false,
      showVoiceMode = false,
      voiceModeSupported = false,
      browserSupportsSpeechRecognition = false,
      audioLevels = [],
      isAnalyzing = false,
      onStopDictation,
      onConfirmDictation,
      value,
      onChange,
      autoResize = true,
      minRows = 1,
      maxRows = 5,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef =
      (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Auto-resize functionality
    useEffect(() => {
      if (!autoResize || !textareaRef.current) return;

      const textarea = textareaRef.current;
      const adjustHeight = () => {
        textarea.style.height = "auto";
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseInt(computedStyle.lineHeight) || 24;
        const minHeight = lineHeight * minRows;
        const maxHeight = lineHeight * maxRows;
        const scrollHeight = textarea.scrollHeight;
        const newHeight = Math.max(
          minHeight,
          Math.min(maxHeight, scrollHeight),
        );
        textarea.style.height = `${newHeight}px`;
        textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
      };

      adjustHeight();
      const handleInput = () => adjustHeight();
      textarea.addEventListener("input", handleInput);
      return () => textarea.removeEventListener("input", handleInput);
    }, [autoResize, minRows, maxRows, value, textareaRef]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend?.();
      }
      props.onKeyDown?.(e);
    };

    return (
      <div className="relative w-full">
        <div className="bg-white rounded-[17px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full outline-none border-none shadow-none resize-none px-4 pt-4 pb-0 min-h-[48px] max-h-[150px] overflow-y-auto placeholder:text-[#a6a3a0] placeholder:font-normal placeholder:text-base placeholder:leading-6 text-base leading-6",
              className,
            )}
            placeholder="Ask anything about a location, building, market, or customer segment…"
            disabled={isSubmitting}
            rows={autoResize ? minRows : 1}
            style={{
              resize: "none",
              overflow: "hidden",
              ...(autoResize && { height: "auto" }),
            }}
            {...props}
          />
          <div className="flex flex-row gap-2 items-center justify-end pb-3 pr-3">
            {!isDictationMode ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMicClick}
                  disabled={!browserSupportsSpeechRecognition}
                  className="rounded-full"
                >
                  <Mic className="h-5 w-5" />
                </Button>

                {showVoiceMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onVoiceModeClick}
                    disabled={!voiceModeSupported}
                    className="rounded-full"
                  >
                    <VoiceModeIcon size={36} />
                  </Button>
                )}

                {value && String(value).trim() && (
                  <Button
                    variant="default"
                    size="icon"
                    onClick={onSend}
                    disabled={isSubmitting}
                    className="rounded-full bg-[#171717] text-white hover:bg-[#2a2a2a]"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                )}
              </>
            ) : (
              <div className="w-full h-[48px] p-2 gap-1 rounded bg-white shadow-[0px_48px_48px_-24px_rgba(51,51,51,0.04)] overflow-hidden border-none flex justify-start items-center">
                <div className="flex-1 p-1 flex justify-between items-center">
                  {audioLevels.map((height, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-[1px] opacity-60 transition-all duration-75",
                        isAnalyzing && height > 2
                          ? "bg-[#171717]"
                          : "bg-[#D1D1D1]",
                      )}
                      style={{
                        height: `${height}px`,
                        transform: isAnalyzing ? "scaleY(1)" : "scaleY(0.3)",
                      }}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onStopDictation}
                  className="rounded-full bg-gray-100 hover:bg-gray-200 animate-pulse"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onConfirmDictation}
                  className="rounded-full"
                >
                  <Check className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
ChatInput.displayName = "ChatInput";

export { ChatInput };
