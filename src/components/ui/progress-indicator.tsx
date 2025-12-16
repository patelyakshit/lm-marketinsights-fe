import React from "react";
import { Check, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

export type ProgressStatus =
  | "pending"
  | "in_progress"
  | "done"
  | "success"
  | "error";

export interface ProgressStep {
  id: string;
  label: string;
  description?: string | null;
  status: ProgressStatus;
  timestamp?: Date | number | string | null;
  metadata?: Record<string, unknown>;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  title?: string;
  subtitle?: string;
  className?: string;
  onStepClick?: (step: ProgressStep) => void;
}

const getStatusIcon = (status: ProgressStatus): React.ReactNode => {
  switch (status) {
    case "done":
    case "success":
      return <Check className="h-3 w-3 text-white" />;
    case "error":
      return <X className="h-3 w-3 text-white" />;
    case "in_progress":
      return <Loader2 className="h-3 w-3 text-white animate-spin" />;
    case "pending":
    default:
      return null;
  }
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  title = "Generation Steps",
  className = "",
  onStepClick,
}) => {
  const sortedSteps = React.useMemo(() => {
    return [...steps].sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return aTime - bTime;
    });
  }, [steps]);

  return (
    <div
      className={`rounded-[10px] bg-[#f8f9fa] border border-neutral-200/50 overflow-hidden ${className}`}
    >
      <div className="px-2 py-2 bg-white border-b border-neutral-200/50 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-6 h-6 bg-[#202124] rounded-md flex items-center justify-center flex-shrink-0">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 9H15"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9 15H15"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-[#202124] tracking-normal">
              {title}
            </h3>
            {/* {subtitle && (
                            <p className="text-xs font-medium text-neutral-400 truncate">
                                {subtitle}
                            </p>
                        )} */}
          </div>
        </div>
      </div>

      <div className="px-2 py-2 bg-white">
        {sortedSteps.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#5f6368]">No steps to display</p>
          </div>
        ) : (
          <div className="">
            {sortedSteps.map((step, index) => {
              const icon = getStatusIcon(step.status);
              const isClickable = !!onStepClick;
              const isLastStep = index === sortedSteps.length - 1;

              // Show icon for any status that isn't "pending"
              const showIcon = step.status !== "pending";

              return (
                <div
                  key={step.id}
                  className={`relative flex items-start gap-3 py-3 ${
                    isClickable ? "cursor-pointer hover:opacity-80" : ""
                  }`}
                  onClick={() => onStepClick?.(step)}
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                >
                  {!isLastStep && (
                    <div className="h-full absolute left-[11px] top-[28px] bottom-1 w-[1px] bg-[#F0F0F0]" />
                  )}

                  <div className="w-full flex items-start justify-between gap-1">
                    <div className="w-6 flex flex-col px-2 items-center justify-center">
                      <div className="w-4 h-4 bg-[#B9B9B7] rounded-full flex items-center justify-center flex-shrink-0">
                        {showIcon && icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col -mt-1 gap-0.5">
                      <span className="text-[14px] font-medium text-[#34322D] text-neutral-900 leading-relaxed">
                        {step.label}
                      </span>
                      {step.description && (
                        <div className="text-[13px] font-normal text-[#858482]/80 leading-tight prose prose-sm max-w-none [&>p]:m-0">
                          <ReactMarkdown>{step.description}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressIndicator;
