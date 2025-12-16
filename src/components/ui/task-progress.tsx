import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Clock, ChevronDown, ChevronUp, Search, Globe, FileEdit, Brain, Sparkles } from "lucide-react";

/**
 * Task status types matching Manus UI
 */
export type TaskStatus = "pending" | "in_progress" | "completed" | "error";

/**
 * Current action types for real-time status display
 */
export type ActionType = "thinking" | "searching" | "browsing" | "creating" | "analyzing" | "generating";

/**
 * Individual task in the progress list
 */
export interface TaskItem {
  id: string;
  label: string;
  description?: string;
  status: TaskStatus;
  startTime?: number;
  endTime?: number;
  currentAction?: {
    type: ActionType;
    detail?: string;  // e.g., "demographics 75075 ZIP code" or "http://example.com"
  };
  subTasks?: TaskItem[];
}

/**
 * Props for TaskProgress component
 */
export interface TaskProgressProps {
  tasks: TaskItem[];
  title?: string;
  className?: string;
  showElapsedTime?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

/**
 * Get icon for action type
 */
const getActionIcon = (type: ActionType): React.ReactNode => {
  const iconClass = "h-3 w-3 text-blue-500";
  switch (type) {
    case "thinking":
      return <Brain className={iconClass} />;
    case "searching":
      return <Search className={iconClass} />;
    case "browsing":
      return <Globe className={iconClass} />;
    case "creating":
      return <FileEdit className={iconClass} />;
    case "analyzing":
      return <Sparkles className={iconClass} />;
    case "generating":
      return <Loader2 className={`${iconClass} animate-spin`} />;
    default:
      return <Loader2 className={`${iconClass} animate-spin`} />;
  }
};

/**
 * Get action label
 */
const getActionLabel = (type: ActionType): string => {
  switch (type) {
    case "thinking":
      return "Thinking";
    case "searching":
      return "Searching";
    case "browsing":
      return "Using browser";
    case "creating":
      return "Creating file";
    case "analyzing":
      return "Analyzing";
    case "generating":
      return "Generating";
    default:
      return "Processing";
  }
};

/**
 * Format elapsed time in mm:ss format
 */
const formatElapsedTime = (startTime: number, endTime?: number): string => {
  const now = endTime || Date.now();
  const elapsed = Math.floor((now - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Individual task row component
 */
const TaskRow: React.FC<{
  task: TaskItem;
  index: number;
  isLast: boolean;
  showElapsedTime: boolean;
}> = ({ task, isLast, showElapsedTime }) => {
  const [expanded, setExpanded] = useState(task.status === "in_progress");
  const [elapsedTime, setElapsedTime] = useState("0:00");

  // Update elapsed time every second for in-progress tasks
  useEffect(() => {
    if (task.status === "in_progress" && task.startTime) {
      const interval = setInterval(() => {
        setElapsedTime(formatElapsedTime(task.startTime!));
      }, 1000);
      return () => clearInterval(interval);
    } else if (task.startTime && task.endTime) {
      setElapsedTime(formatElapsedTime(task.startTime, task.endTime));
    }
  }, [task.status, task.startTime, task.endTime]);

  // Auto-expand when task becomes in_progress
  useEffect(() => {
    if (task.status === "in_progress") {
      setExpanded(true);
    }
  }, [task.status]);

  const statusIcon = useMemo(() => {
    switch (task.status) {
      case "completed":
        return (
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        );
      case "in_progress":
        return (
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <Loader2 className="h-3 w-3 text-white animate-spin" />
          </div>
        );
      case "error":
        return (
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">!</span>
          </div>
        );
      case "pending":
      default:
        return (
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
            <Clock className="h-3 w-3 text-gray-400" />
          </div>
        );
    }
  }, [task.status]);

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className="absolute left-[10px] top-[24px] bottom-0 w-[2px] bg-gray-200"
          style={{ height: "calc(100% - 12px)" }}
        />
      )}

      {/* Task content */}
      <div
        className={`
          flex items-start gap-3 py-2 px-1 rounded-lg transition-colors
          ${task.status === "in_progress" ? "bg-blue-50/50" : ""}
          ${task.description || task.currentAction ? "cursor-pointer hover:bg-gray-50" : ""}
        `}
        onClick={() => {
          if (task.description || task.currentAction) {
            setExpanded(!expanded);
          }
        }}
      >
        {/* Status icon */}
        <div className="flex-shrink-0 pt-0.5 z-10 bg-white">
          {statusIcon}
        </div>

        {/* Task label and details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`
                text-sm font-medium truncate
                ${task.status === "completed" ? "text-gray-600" : ""}
                ${task.status === "in_progress" ? "text-gray-900" : ""}
                ${task.status === "pending" ? "text-gray-400" : ""}
                ${task.status === "error" ? "text-red-600" : ""}
              `}
            >
              {task.label}
            </span>

            {/* Time and expand icon */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {showElapsedTime && task.startTime && (
                <span className="text-xs text-gray-400 font-mono">
                  {elapsedTime}
                </span>
              )}
              {(task.description || task.currentAction) && (
                expanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )
              )}
            </div>
          </div>

          {/* Current action (always visible when in progress) */}
          {task.status === "in_progress" && task.currentAction && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {getActionIcon(task.currentAction.type)}
                <span>{getActionLabel(task.currentAction.type)}</span>
                {task.currentAction.detail && (
                  <span className="text-blue-500/70 truncate max-w-[200px]">
                    {task.currentAction.detail}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Expandable description */}
          <AnimatePresence>
            {expanded && task.description && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                  {task.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

/**
 * TaskProgress - Manus-style task progress component
 *
 * Features:
 * - Task list with visual status indicators
 * - Completion count (2/5)
 * - Elapsed time per task
 * - Current action display (Thinking, Searching, Using browser...)
 * - Collapsible task details
 */
export const TaskProgress: React.FC<TaskProgressProps> = ({
  tasks,
  title = "Task progress",
  className = "",
  showElapsedTime = true,
  collapsible = true,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate completion stats
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const totalCount = tasks.length;

  // Find current in-progress task for header display
  const currentTask = tasks.find(t => t.status === "in_progress");

  if (tasks.length === 0) return null;

  return (
    <div className={`rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className={`
          px-4 py-3 border-b border-gray-100 flex items-center justify-between
          ${collapsible ? "cursor-pointer hover:bg-gray-50" : ""}
        `}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 11L12 14L22 4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Title and current task */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">{title}</span>
            {currentTask && (
              <span className="text-xs text-gray-500 truncate max-w-[200px]">
                {currentTask.currentAction
                  ? getActionLabel(currentTask.currentAction.type)
                  : "Processing..."
                }
              </span>
            )}
          </div>
        </div>

        {/* Progress count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">
            {completedCount} / {totalCount}
          </span>
          {collapsible && (
            isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )
          )}
        </div>
      </div>

      {/* Task list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {tasks.map((task, index) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={index}
                  isLast={index === tasks.length - 1}
                  showElapsedTime={showElapsedTime}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskProgress;
