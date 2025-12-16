import React from "react";
import { Loader2, Brain, Route, Zap, MessageSquare } from "lucide-react";

/**
 * Agent progress phases from the backend
 */
export type AgentPhase =
  | "understanding"   // Analyzing the query
  | "routing"         // Determining which agent to use
  | "executing"       // Running tools/operations
  | "generating";     // Generating response text

export interface AgentProgressState {
  phase: AgentPhase;
  message?: string;
  agent?: string;
  timestamp?: number;
}

export interface AgentProgressIndicatorProps {
  progress: AgentProgressState | null;
  className?: string;
}

/**
 * Get icon for each phase
 */
const getPhaseIcon = (phase: AgentPhase, isActive: boolean): React.ReactNode => {
  const iconClass = isActive
    ? "h-3.5 w-3.5 text-white animate-pulse"
    : "h-3.5 w-3.5 text-white";

  switch (phase) {
    case "understanding":
      return isActive ? <Loader2 className={`${iconClass} animate-spin`} /> : <Brain className={iconClass} />;
    case "routing":
      return isActive ? <Loader2 className={`${iconClass} animate-spin`} /> : <Route className={iconClass} />;
    case "executing":
      return isActive ? <Loader2 className={`${iconClass} animate-spin`} /> : <Zap className={iconClass} />;
    case "generating":
      return isActive ? <Loader2 className={`${iconClass} animate-spin`} /> : <MessageSquare className={iconClass} />;
    default:
      return <Loader2 className={`${iconClass} animate-spin`} />;
  }
};

/**
 * Get display label for each phase
 */
const getPhaseLabel = (phase: AgentPhase): string => {
  switch (phase) {
    case "understanding":
      return "Understanding your request";
    case "routing":
      return "Finding the right approach";
    case "executing":
      return "Working on it";
    case "generating":
      return "Preparing response";
    default:
      return "Processing";
  }
};

/**
 * Get phase order for progress display
 */
const PHASE_ORDER: AgentPhase[] = ["understanding", "routing", "executing", "generating"];

/**
 * AgentProgressIndicator - Displays the current phase of agent processing
 *
 * Shows a compact, animated indicator for the agent's current processing phase
 * consistent with the existing design system.
 */
export const AgentProgressIndicator: React.FC<AgentProgressIndicatorProps> = ({
  progress,
  className = "",
}) => {
  if (!progress) return null;

  const currentPhaseIndex = PHASE_ORDER.indexOf(progress.phase);

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* Phase indicator dots */}
      <div className="flex items-center gap-1.5 pt-1">
        {PHASE_ORDER.map((phase, index) => {
          const isCompleted = index < currentPhaseIndex;
          const isActive = index === currentPhaseIndex;
          const isPending = index > currentPhaseIndex;

          return (
            <div
              key={phase}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${isCompleted ? "bg-[#22c55e]" : ""}
                ${isActive ? "bg-[#2A2623] animate-pulse" : ""}
                ${isPending ? "bg-[#E5E5E5]" : ""}
              `}
              title={getPhaseLabel(phase)}
            />
          );
        })}
      </div>

      {/* Current phase message */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-[#2A2623] rounded-md flex items-center justify-center flex-shrink-0">
          {getPhaseIcon(progress.phase, true)}
        </div>
        <span
          className="text-[13px] font-medium text-[#5f6368] animate-pulse"
          style={{ fontFamily: "Switzer, sans-serif" }}
        >
          {progress.message || getPhaseLabel(progress.phase)}
          {progress.agent && progress.phase === "routing" && (
            <span className="text-[#9CA3AF]"> via {progress.agent}</span>
          )}
        </span>
      </div>
    </div>
  );
};

/**
 * Compact version for inline display
 */
export const AgentProgressCompact: React.FC<AgentProgressIndicatorProps> = ({
  progress,
  className = "",
}) => {
  if (!progress) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className="h-3.5 w-3.5 text-[#5f6368] animate-spin" />
      <span
        className="text-[13px] text-[#5f6368] animate-pulse"
        style={{ fontFamily: "Switzer, sans-serif" }}
      >
        {progress.message || getPhaseLabel(progress.phase)}
      </span>
    </div>
  );
};

export default AgentProgressIndicator;
