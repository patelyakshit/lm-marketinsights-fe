import { compare } from "fast-json-patch";
import { motion } from "framer-motion";
import { debounce } from "lodash";
import { Check, Loader2, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useAudioVisualization from "../hooks/useAudioVisualization";
import {
  ReadyState,
  usePersistentWebSocket,
} from "../hooks/usePersistentWebSocket";
import { usePromptContext } from "../hooks/usePromptContext";
import { useSpeechRecognitionCustom } from "../hooks/useSpeechRecognitionCustom";
import { useTabContext } from "../hooks/useTabContext";
import { useVoiceMode } from "../hooks/useVoiceMode";
import { useWebSocketVoiceMode } from "../hooks/useWebSocketVoiceMode";
import { useWidgetInfo } from "../hooks/useWidgetInfo";
import { useViewModeOptional } from "../contexts/ViewModeContext";
import { AppliedLayer } from "../schema";
import { useMapStore } from "../store/useMapStore";
import {
  AllOperations,
  OperationTypes,
  PanMapDirectionType,
  PlaceStoryStatusPayload,
  PlaceStoryStatusState,
} from "../types/operations";
import {
  ProgressIndicator,
  ProgressStep,
  ProgressStatus,
} from "./ui/progress-indicator";
import {
  AgentProgressIndicator,
  AgentProgressState,
  AgentPhase,
} from "./ui/agent-progress-indicator";
import {
  TaskProgress,
  TaskItem,
  TaskStatus as TaskProgressStatus,
  ActionType,
} from "./ui/task-progress";
import {
  // getStoredClickedLocation,
  // getStoredMessages,
  // storeChatData,
  updateStoredMessages,
  storeCurrentSessionId,
} from "../utils/chatStorage";
import { formatRelativeTime } from "../utils/common";
import { getMapActionsController } from "../utils/map-actions-controller";
import { stopStream } from "../utils/stopStream";
import { WebSocketProvider } from "../contexts/WebSocketContext";
import LayersList from "./LayersList";
import MarkdownRenderer from "./MarkdownRenderer";
import ArrowUpIcon from "./svg/ArrowUpIcon";
import MicIcon from "./svg/MicIcon";
import StopIcon from "./svg/StopIcon";
import VoiceModeIcon from "./svg/VoiceModeIcon";
import { PlusIcon } from "../ui-new/assets/icons";
import VoiceModeAnimation from "./VoiceModeAnimation";
import { useArtifactStore } from "../store/useArtifactStore";
import { DynamicChatInput } from "../ui-new/components/composite/DynamicChatInput";

const SOCKET_URL_BASE = import.meta.env.VITE_SOCKET_BASE;
const SOCKET_URL_VOICE = import.meta.env.VITE_SOCKET_VOICE;
const WIDGET_ID = import.meta.env.VITE_WIDGET_ID;

interface Message {
  id?: string;
  content?: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  timestamp?: Date;
  isStreaming?: boolean;
  is_action?: boolean;
  operations?: OperationTypes[];
  operation?:
    | "Add"
    | "Remove"
    | "Reset"
    | "Suggestion/Add"
    | "Suggestion/Remove"
    | "Suggestion/Enable Labels"
    | "Suggestion/Disable Labels"
    | "Filter"
    | "Remove Filter"
    | "ZoomTo"
    | "ToggleLayer"
    | "SelectLayer"
    | "ZoomIn"
    | "ZoomOut"
    | "Zoom Location"
    | "zoom"
    | "Enable Labels"
    | "Remove Labels"
    | "Disable Labels"
    | "pan"
    | "Add Pin"
    | "Remove Pin";
  operation_data?: Array<{
    id: string;
    title: string;
    visible?: boolean;
    sublayerId?: number;
    current_filter?: string;
    zoom_action?: "zoom_in" | "zoom_out";
    zoom_scale?: number;
    zoom_percentage?: number;
    latitude?: number;
    longitude?: number;
    label_key?: string;
    direction?: string;
    distance?: number;
  }>;
  filter_output?: {
    "WHERE clause"?: string;
    [key: string]: { where_clause?: string } | string | undefined;
  };
  zoom_data?: {
    place?: string;
    layerId?: string;
    whereClause?: string;
    coordinates?: { latitude: number; longitude: number };
  };
  placeStoryStatuses?: PlaceStoryStatusPayload[];
}

interface LoadingMessage {
  id: string;
  text: string;
  isVisible: boolean;
}

/**
 * Convert PlaceStoryStatusPayload to ProgressStep format
 */
const convertToProgressSteps = (
  statuses: PlaceStoryStatusPayload[],
): ProgressStep[] => {
  return statuses.map((status) => ({
    id: status.step_id ?? `unknown-${Date.now()}`,
    label: status.label ?? "Processing...",
    description: status.details || undefined,
    status: status.status as ProgressStatus,
    timestamp: status.ts || undefined,
    metadata: {
      session_id: status.session_id,
    },
  }));
};

const ChatBox: React.FC = () => {
  const { isLoading: widgetInfoLoading } = useWidgetInfo();
  const {
    initialPrompt,
    clearInitialPrompt,
    voiceModeRedirect,
    clearVoiceModeRedirect,
    voiceModeSupported,
    setVoiceModeSupported,
  } = usePromptContext();
  const { setActiveArtifact } = useArtifactStore();
  const { selectTab } = useTabContext();
  const viewModeContext = useViewModeOptional();
  const {
    isMapReady,
    mapView,
    layers,
    addLayer,
    zoomIn,
    zoomOut,
    zoomToPlace,
    zoomToFeature,
    getCurrentMapState,
    pins,
  } = useMapStore();
  const [dictationMode, setDictationMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const [currentSocketUrl, setCurrentSocketUrl] = useState(SOCKET_URL_BASE);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [switchingMessage, setSwitchingMessage] = useState<string>("");
  const sessionIdRef = useRef<string | null>(null); // Store session ID to persist across switches
  const hasInitialMapContextSentRef = useRef(false); // Track if initial map context was sent
  const shouldSendInitialContextRef = useRef(false); // Flag to send when map is ready
  const [
    clickedLocation,
    // setClickedLocation
  ] = useState<string[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<LoadingMessage | null>(
    null,
  );
  const [thinkingMessage, setThinkingMessage] = useState<string | null>(null);
  const [agentProgress, setAgentProgress] = useState<AgentProgressState | null>(null);
  const [taskProgress, setTaskProgress] = useState<TaskItem[]>([]);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [canStopStream, setCanStopStream] = useState(false);
  const currentStreamIdRef = useRef<string | null>(null);
  const hasInitialPromptBeenSentRef = useRef(false);
  const lastInitialPromptRef = useRef<string | null>(null);
  // const isInitializedRef = useRef(false);
  // const isRestoringSessionRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const lastStreamedMessageRef = useRef<string>("");
  const lastSpokenMessageRef = useRef<string>("");
  const lastMapStateRef = useRef<
    import("../store/useMapStore").MapState | null
  >(null);

  // Function to restore focus to textarea
  const restoreFocus = useCallback(() => {
    const attemptFocus = (attempts = 0) => {
      if (attempts > 10) {
        return;
      }

      if (textareaRef.current && !textareaRef.current.disabled) {
        textareaRef.current.focus();
      } else {
        setTimeout(() => attemptFocus(attempts + 1), 50);
      }
    };

    attemptFocus();
  }, []);

  // Function to reset streaming state
  const resetStreamingState = useCallback(() => {
    setIsStreaming(false);
    setCurrentStreamId(null);
    setCanStopStream(false);
    currentStreamIdRef.current = null;
    setLoadingMessage(null);
    setThinkingMessage(null);
    setAgentProgress(null);
    setTaskProgress([]);
    stopRequestedRef.current = false;
    lastStreamedMessageRef.current = "";
    lastSentPayloadRef.current = null;

    // Restore focus to textarea after streaming stops
    setTimeout(() => {
      restoreFocus();
    }, 100);
  }, [restoreFocus]);

  const {
    transcript,
    listening,
    error: speechError,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isSecureContext,
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
  } = useSpeechRecognitionCustom();

  const {
    audioLevels,
    isAnalyzing,
    startAnalysis,
    stopAnalysis,
    error: audioError,
  } = useAudioVisualization(46);

  // Voice mode functionality - reads out bot messages
  const { isVoiceMode, speechError: voiceError, speakText } = useVoiceMode();

  // Legacy voice mode communication hook removed - using WebSocket-based voice mode instead

  const handleStartVoiceMode = () => {
    console.log(
      "Voice mode toggle clicked. Current state:",
      isWSVoiceModeActive,
    );
    if (isWSVoiceModeActive) {
      console.log("Stopping WebSocket voice mode");
      handleStopVoiceMode();
    } else {
      console.log("Starting WebSocket voice mode - switching to voice URL");

      // Show switching message
      setIsSwitchingMode(true);
      setSwitchingMessage("Switching to voice mode...");

      // Switch to voice mode URL
      console.log("Switching from", currentSocketUrl, "to", SOCKET_URL_VOICE);
      console.log("Persisting session ID:", sessionIdRef.current);
      setCurrentSocketUrl(SOCKET_URL_VOICE);

      // Wait for connection to establish then start voice mode
      setTimeout(() => {
        startWSVoiceMode();
        lastSpokenMessageRef.current = "";
        setIsSwitchingMode(false);
        setSwitchingMessage("");
      }, 1500);
    }
  };

  const handleStopVoiceMode = () => {
    console.log("Stopping voice mode - switching back to chat URL");

    // Show switching message
    setIsSwitchingMode(true);
    setSwitchingMessage("Switching to text mode...");

    // IMPORTANT: Stop voice mode BEFORE switching connection
    // This ensures recording stops immediately
    stopWSVoiceMode();
    lastSpokenMessageRef.current = "";

    // Stop any ongoing WebSocket stream
    if (isStreaming) {
      handleStopQuery();
    }

    // Clear any speech errors when stopping voice mode
    setError(null);

    // Small delay to ensure voice mode cleanup completes
    setTimeout(() => {
      // Switch back to base URL AFTER voice mode is stopped
      console.log("Switching from", currentSocketUrl, "to", SOCKET_URL_BASE);
      console.log("Persisting session ID:", sessionIdRef.current);
      setCurrentSocketUrl(SOCKET_URL_BASE);

      // Hide switching message after connection establishes
      setTimeout(() => {
        setIsSwitchingMode(false);
        setSwitchingMessage("");
      }, 1500);
    }, 300); // 300ms delay to ensure voice recording stops
  };

  const handleVoiceModeXClick = () => {
    console.log("Voice mode X clicked - switching back to chat URL");

    // Show switching message
    setIsSwitchingMode(true);
    setSwitchingMessage("Switching to text mode...");

    // Immediately reset streaming state to prevent stop icon flash
    if (isStreaming) {
      resetStreamingState();
    }

    // IMPORTANT: Stop voice mode BEFORE switching connection
    stopWSVoiceMode();
    lastSpokenMessageRef.current = "";
    setError(null);

    // Small delay to ensure voice mode cleanup completes
    setTimeout(() => {
      // Switch back to base URL AFTER voice mode is stopped
      console.log("Switching from", currentSocketUrl, "to", SOCKET_URL_BASE);
      setCurrentSocketUrl(SOCKET_URL_BASE);

      // Hide switching message
      setTimeout(() => {
        setIsSwitchingMode(false);
        setSwitchingMessage("");
      }, 1500);
    }, 300); // 300ms delay to ensure voice recording stops
  };

  // WebSocket-based voice mode hook
  const {
    isVoiceModeActive: isWSVoiceModeActive,
    isRecording: isWSRecording,
    isPlayingAudio: isWSPlayingAudio,
    isListening: isWSListening,
    error: wsVoiceError,
    startVoiceMode: startWSVoiceMode,
    stopVoiceMode: stopWSVoiceMode,
    playAudioChunk,
  } = useWebSocketVoiceMode({
    isVoiceModeSupported: voiceModeSupported,
    onSendAudio: async (audioBase64, sampleRate, bitrate) => {
      if (readyState === ReadyState.OPEN) {
        try {
          const mapContext = await getCurrentMapState();
          const sendPayload = {
            type: "CHAT/SEND_AUDIO",
            payload: {
              audio_base64: audioBase64,
              sample_rate: String(sampleRate),
              bitrate: String(bitrate),
              turn_complete: false, // Only true for the last chunk
              map_context: mapContext,
            },
            timestamp: Date.now(),
          };
          sendJsonMessage(sendPayload);
          persistentWebSocket.updateActivity();
        } catch (error) {
          console.error("Failed to get map context for audio:", error);
          // Send audio without map context if it fails
          const sendPayload = {
            type: "CHAT/SEND_AUDIO",
            payload: {
              audio_base64: audioBase64,
              sample_rate: String(sampleRate),
              bitrate: String(bitrate),
              turn_complete: false,
            },
            timestamp: Date.now(),
          };
          sendJsonMessage(sendPayload);
          persistentWebSocket.updateActivity();
        }
      }
    },
  });

  // Store the playAudioChunk function in a ref for access in message handler
  const playAudioChunkRef = useRef(playAudioChunk);
  useEffect(() => {
    playAudioChunkRef.current = playAudioChunk;
  }, [playAudioChunk]);

  // Store layer query handler refs for access in message handler
  const handleLayerQueryRequestRef = useRef<((payload: any) => Promise<void>) | null>(null);
  const handleLayerExtentQueryRef = useRef<((payload: any) => Promise<void>) | null>(null);
  const handleLayerStatisticsRequestRef = useRef<((payload: any) => Promise<void>) | null>(null);
  const handleLayerListRequestRef = useRef<((payload: any) => void) | null>(null);

  // Use dynamic URL that switches between chat and voice mode
  const persistentWebSocket = usePersistentWebSocket(
    `${currentSocketUrl}${currentSocketUrl.includes("?") ? "&" : "?"}widget_id=${WIDGET_ID}`,
    {
      onOpen: () => {
        setError(null);
        console.log("websocket connected");
        if (pendingPayloadRef.current) {
          persistentWebSocket.sendJsonMessage(pendingPayloadRef.current);
          pendingPayloadRef.current = null;
        } else if (
          lastSentPayloadRef.current &&
          (thinkingMessage || loadingMessage)
        ) {
          // If we have a thinking/loading message and a last sent payload,
          // resend the last message to get a response and clear the thinking message
          console.log(
            "Reconnected with active thinking message, resending last message",
          );
          persistentWebSocket.sendJsonMessage(lastSentPayloadRef.current);
          persistentWebSocket.updateActivity();
        } else {
          // Clear any stale streaming state on fresh reconnection
          // This handles cases where the backend reloaded mid-stream
          resetStreamingState();
        }
      },
      onError: (error) => {
        console.error("❌ WebSocket error:", error);
        setError("WebSocket connection error. Please refresh the page.");
      },
      onClose: (event) => {
        console.log("webspocket closed");
        if (event.code !== 1000) {
          setError("WebSocket connection lost. Please refresh the page.");
        }
      },
      onMessage: (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data || typeof data !== "object") return;
          console.log("data is: ", data);
          // Ignore non-content messages
          if (
            ["connection", "ping", "pong", "ack", "status", "info"].includes(
              data.type,
            )
          ) {
            return;
          }

          // Handle session information (voice mode capabilities)
          if (data.type === "CHAT/SESSION") {
            const payload = data.payload || {};
            const sttEnabled = payload.stt_enabled === true;
            const ttsEnabled = payload.tts_enabled === true;
            // const voiceModeSupported = sttEnabled && ttsEnabled;
            const voiceModeSupported = true;
            const sessionId = payload.sessionId || payload.session_id;

            console.log("Session info received:", {
              sessionId,
              streaming_enabled: payload.streaming_enabled,
              stt_enabled: sttEnabled,
              tts_enabled: ttsEnabled,
              voiceModeSupported,
            });

            // Update voice mode support status in context
            setVoiceModeSupported(voiceModeSupported);

            // Send initial map context and update URL with session ID
            if (sessionId) {
              // Check if this is a new session or just reconnecting
              const isNewSession = sessionIdRef.current !== sessionId;

              // Store session ID in ref and localStorage for persistence across switches
              sessionIdRef.current = sessionId;
              storeCurrentSessionId(sessionId);

              // Update URL with session ID (always do this)
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.set("session_id", sessionId);
              window.history.pushState({}, "", currentUrl.toString());

              console.log("Session established:", {
                sessionId,
                url: currentUrl.toString(),
                socketUrl: currentSocketUrl,
                storedSessionId: sessionIdRef.current,
                isNewSession,
                hasInitialMapContextSent: hasInitialMapContextSentRef.current,
              });

              // Set flag to send initial map context when map is ready
              if (!hasInitialMapContextSentRef.current && isNewSession) {
                console.log(
                  "New session detected - will send initial map context when map is ready",
                );
                shouldSendInitialContextRef.current = true;
              } else {
                console.log(
                  "Skipping initial map context - already sent or reconnecting to same session",
                );
              }
            }

            return;
          }

          // Handle AI hint for map-related queries (server-side fallback)
          // This is sent by the AI when it detects the response will involve map operations
          // but the client-side keyword detection didn't catch it
          if (data.type === "CHAT/MAP_HINT") {
            if (viewModeContext?.handleMapHint) {
              viewModeContext.handleMapHint();
            }
            return;
          }

          // Handle thinking token messages
          if (data.type === "CHAT/THINKING") {
            const thinkingResponse = data.payload?.response || "";
            if (thinkingResponse.trim()) {
              setThinkingMessage(thinkingResponse);
              setLoadingMessage({
                id: `thinking-${Date.now()}`,
                text: thinkingResponse,
                isVisible: !isWSVoiceModeActive,
              });
            }
            return;
          }

          // Handle agent progress updates
          if (data.type === "CHAT/PROGRESS") {
            const payload = data.payload || {};
            const phase = payload.phase as AgentPhase;
            const message = payload.message || "";
            const agent = payload.agent || "";
            const timestamp = payload.timestamp || Date.now();

            console.log("Agent progress update:", { phase, message, agent });

            setAgentProgress({
              phase,
              message,
              agent,
              timestamp,
            });

            // Auto-generate task items from phase progress (Manus-style)
            const phaseOrder: AgentPhase[] = ["understanding", "routing", "executing", "generating"];
            const phaseLabels: Record<AgentPhase, string> = {
              understanding: "Analyze request and understand intent",
              routing: agent ? `Route to ${agent}` : "Determine best approach",
              executing: agent ? `Execute ${agent} tools` : "Execute tools",
              generating: "Generate response",
            };
            const phaseActions: Record<AgentPhase, ActionType> = {
              understanding: "thinking",
              routing: "analyzing",
              executing: "searching",
              generating: "generating",
            };

            const currentPhaseIndex = phaseOrder.indexOf(phase);
            const newTasks: TaskItem[] = phaseOrder.map((p, index) => {
              let status: TaskProgressStatus = "pending";
              if (index < currentPhaseIndex) {
                status = "completed";
              } else if (index === currentPhaseIndex) {
                status = "in_progress";
              }

              return {
                id: `phase-${p}`,
                label: phaseLabels[p],
                status,
                startTime: index <= currentPhaseIndex ? Date.now() - (currentPhaseIndex - index) * 2000 : undefined,
                endTime: index < currentPhaseIndex ? Date.now() - (currentPhaseIndex - index) * 1000 : undefined,
                currentAction: status === "in_progress" ? {
                  type: phaseActions[p],
                  detail: message || undefined,
                } : undefined,
              };
            });

            setTaskProgress(newTasks);

            // Update loading message with progress info
            if (!isWSVoiceModeActive) {
              setLoadingMessage({
                id: `progress-${Date.now()}`,
                text: message || `Processing: ${phase}`,
                isVisible: true,
              });
            }

            return;
          }

          // Handle detailed task progress updates (Manus-style)
          if (data.type === "CHAT/TASK_PROGRESS") {
            const payload = data.payload || {};
            const tasks = payload.tasks || [];
            const currentAction = payload.current_action;

            console.log("Task progress update:", { tasks, currentAction });

            // Convert backend tasks to frontend TaskItem format
            const taskItems: TaskItem[] = tasks.map((task: any) => ({
              id: task.id || `task-${Date.now()}`,
              label: task.label || "Processing...",
              description: task.description,
              status: task.status as TaskProgressStatus,
              startTime: task.start_time ? task.start_time * 1000 : undefined,
              endTime: task.end_time ? task.end_time * 1000 : undefined,
              currentAction: task.status === "in_progress" && currentAction ? {
                type: currentAction.type as ActionType,
                detail: currentAction.detail,
              } : undefined,
            }));

            setTaskProgress(taskItems);

            // Show loading state if tasks are in progress
            const hasInProgress = taskItems.some(t => t.status === "in_progress");
            if (hasInProgress && !isWSVoiceModeActive) {
              setLoadingMessage({
                id: `task-progress-${Date.now()}`,
                text: "Processing tasks...",
                isVisible: true,
              });
            }

            return;
          }

          if (data.type === "CHAT/STREAM") {
            const streamId = data.payload?.stream_id;
            const streamResponse = data.payload?.stream_response || "";
            const streamStop = data.payload?.stream_stop === true;

            // Enable stop button on first stream message with stream_id
            if (streamId && !currentStreamId && !currentStreamIdRef.current) {
              setCurrentStreamId(streamId);
              currentStreamIdRef.current = streamId;
              setCanStopStream(true);
              console.log("Stream started, stop button enabled:", streamId);
            }

            // Handle immediate complete response (stream_stop: true on first message)
            if (
              streamStop &&
              streamResponse !== null &&
              !lastStreamedMessageRef.current
            ) {
              // This is a complete response in one message (non-streaming mode)
              setLoadingMessage(null);
              setThinkingMessage(null);
              setAgentProgress(null);

              if (
                !stopRequestedRef.current &&
                !streamResponse.toLowerCase().includes("thinking")
              ) {
                const completeMessage = streamResponse;

                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;

                  // Check if there's an existing streaming message to update
                  if (updated[lastIdx]?.isStreaming) {
                    const completedMessage = {
                      ...updated[lastIdx],
                      text: completeMessage,
                      isStreaming: false,
                    };
                    updated[lastIdx] = completedMessage;
                  } else {
                    // If no streaming message exists, create a new bot message
                    const newBotMessage: Message = {
                      id: streamId || Date.now().toString(),
                      sender: "bot",
                      text: completeMessage,
                      time: formatRelativeTime(new Date()),
                      isStreaming: false,
                    };
                    updated.push(newBotMessage);
                  }

                  // Update stored messages
                  updateStoredMessages(updated, clickedLocation);

                  return updated;
                });

                // Handle TTS for voice mode when complete message received
                if (isWSVoiceModeActive && completeMessage) {
                  console.log(
                    "Voice mode: Complete message received:",
                    completeMessage,
                  );
                  lastSpokenMessageRef.current = completeMessage;
                }
              }

              lastStreamedMessageRef.current = "";
              resetStreamingState();
              return;
            }

            // Ignore messages if stop was requested for this stream
            if (
              stopRequestedRef.current &&
              streamId === currentStreamIdRef.current
            ) {
              return;
            }

            // Set streaming state if not already set
            if (!isStreaming) {
              setIsStreaming(true);
              setLoadingMessage(null);
              setThinkingMessage(null);
              setAgentProgress(null);
            }

            // Handle stream_stop: false - accumulate and display chunks
            if (!streamStop) {
              // Skip empty or "thinking" messages
              if (
                !streamResponse ||
                streamResponse.toLowerCase().includes("thinking") ||
                (streamResponse.trim() === "" && !streamResponse.includes("\n"))
              ) {
                return;
              }

              setLoadingMessage(null);
              setThinkingMessage(null);
              setAgentProgress(null);

              // Accumulate the streaming response
              lastStreamedMessageRef.current += streamResponse;

              setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                const currentMessageText = lastStreamedMessageRef.current;

                if (
                  lastMsg &&
                  lastMsg.sender === "bot" &&
                  lastMsg.isStreaming
                ) {
                  // Update existing streaming message
                  return [
                    ...prev.slice(0, -1),
                    {
                      ...lastMsg,
                      text: currentMessageText,
                      isStreaming: true,
                    },
                  ];
                } else {
                  // Create new streaming message
                  const newStreamingMessage: Message = {
                    id: streamId || Date.now().toString(),
                    sender: "bot",
                    text: currentMessageText,
                    time: formatRelativeTime(new Date()),
                    isStreaming: true,
                    is_action: false,
                  };
                  return [...prev, newStreamingMessage];
                }
              });

              return;
            }

            // Handle stream_stop: true - finalize the message
            if (streamStop && !stopRequestedRef.current) {
              // Append the final chunk if there is one
              if (streamResponse && streamResponse.trim()) {
                lastStreamedMessageRef.current += streamResponse;
              }

              const finalMessageText = lastStreamedMessageRef.current.trim();

              // Only process if there's actual content
              if (finalMessageText) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;

                  // Check if there's an existing streaming message to update
                  if (updated[lastIdx]?.isStreaming) {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      text: finalMessageText,
                      isStreaming: false,
                    };
                  } else {
                    // If no streaming message exists, create a new bot message
                    const newBotMessage: Message = {
                      id: streamId || Date.now().toString(),
                      sender: "bot",
                      text: finalMessageText,
                      time: formatRelativeTime(new Date()),
                      isStreaming: false,
                    };
                    updated.push(newBotMessage);
                  }

                  // Update stored messages
                  updateStoredMessages(updated, clickedLocation);

                  return updated;
                });

                // Handle TTS for voice mode when streaming ends (legacy - not used in new implementation)
                if (isWSVoiceModeActive && finalMessageText) {
                  console.log(
                    "Voice mode: Speaking complete streamed message:",
                    finalMessageText,
                  );
                  // speakTextCommunication(finalMessageText); // Not used in new implementation
                  lastSpokenMessageRef.current = finalMessageText;
                }
              }

              lastStreamedMessageRef.current = "";
              resetStreamingState();
            }

            return;
          }

          // Handle regular messages (non-streaming)
          if (data.type === "CHAT/RECEIVE") {
            const messageText = data.payload?.response || "";
            if (messageText.trim()) {
              setLoadingMessage(null);
              setThinkingMessage(null);
              setAgentProgress(null);
              setIsStreaming(false);
              setCurrentStreamId(null);
              currentStreamIdRef.current = null;

              setTimeout(() => restoreFocus(), 100);

              if (
                !messageText.toLowerCase().includes("thinking") &&
                messageText.trim() !== ""
              ) {
                const isAction = !!data.is_action;
                const operation = data.operation;
                const operationData = data.operation_data;
                const filterOutput = data.filter_output;
                const zoomData = data.zoom_data;

                const newMessage: Message = {
                  id: data.payload?.stream_id || Date.now().toString(),
                  sender: "bot" as const,
                  text: messageText,
                  time: formatRelativeTime(new Date()),
                  isStreaming: false,
                  is_action: isAction,
                  operation,
                  operation_data: operationData,
                  filter_output: filterOutput,
                  zoom_data: zoomData,
                };

                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  let updatedMessages;

                  if (
                    lastMsg &&
                    lastMsg.sender === "bot" &&
                    lastMsg.isStreaming
                  ) {
                    updatedMessages = [...prev.slice(0, -1), newMessage];
                  } else {
                    updatedMessages = [...prev, newMessage];
                  }

                  updateStoredMessages(updatedMessages, clickedLocation);

                  return updatedMessages;
                });

                // Call handleAction if applicable and stop not requested
                if (
                  !stopRequestedRef.current &&
                  (newMessage.operation || newMessage.is_action)
                ) {
                  handleAction(newMessage);
                }

                // Handle TTS for voice mode for regular messages (legacy - not used in new implementation)
                if (
                  isWSVoiceModeActive &&
                  messageText !== lastSpokenMessageRef.current
                ) {
                  console.log(
                    "Voice mode: Speaking regular message:",
                    messageText,
                  );
                  // speakTextCommunication(messageText); // Not used in new implementation
                  lastSpokenMessageRef.current = messageText;
                }
              }
            }
            resetStreamingState();
            return;
          }

          // Handle layer query requests from backend
          if (data.type === "LAYER/QUERY_REQUEST") {
            handleLayerQueryRequestRef.current?.(data.payload);
            return;
          }

          if (data.type === "LAYER/QUERY_EXTENT") {
            handleLayerExtentQueryRef.current?.(data.payload);
            return;
          }

          if (data.type === "LAYER/STATISTICS_REQUEST") {
            handleLayerStatisticsRequestRef.current?.(data.payload);
            return;
          }

          if (data.type === "LAYER/LIST_REQUEST") {
            handleLayerListRequestRef.current?.(data.payload);
            return;
          }

          // Handle audio streaming for voice mode
          if (data.type === "CHAT/STREAM_AUDIO") {
            const payload = data.payload || {};
            const audioChunk = payload.audio_chunk;
            const sampleRate = payload.sample_rate || 16000;
            const bitrate = payload.bitrate || 256000;
            const streamStop = payload.stream_stop === true;

            console.log("Audio chunk received:", {
              hasAudio: !!audioChunk,
              sampleRate,
              bitrate,
              streamStop,
            });

            // Play audio chunk if available
            if (audioChunk && playAudioChunkRef.current) {
              playAudioChunkRef.current(audioChunk, sampleRate);
            }

            if (streamStop) {
              console.log("Audio stream stopped");
              // Audio playback will naturally stop when queue is empty
            }

            return;
          }

          if (data.type === "CHAT/OPERATION_DATA") {
            const controller = getMapActionsController();
            const operationPayload = data.payload ?? {};
            const operations: AllOperations[] =
              operationPayload.operations ?? [];

            console.log("All operations are: ", operations);

            operations.forEach((operation) => {
              // Auto-switch to split view if this is a map operation and we're in chat view
              if (viewModeContext?.ensureMapVisible) {
                viewModeContext.ensureMapVisible(operation.type);
              }

              switch (operation.type) {
                case "PLACESTORY_STATUS": {
                  const payload = operation.payload;

                  if (payload.step_id === "placestory_generation_start") {
                    setActiveArtifact({
                      type: "PLACESTORY_SKELETON_ARTIFACT",
                      payload: null,
                    });
                  }

                  if (
                    payload.session_id &&
                    sessionIdRef.current &&
                    payload.session_id !== sessionIdRef.current
                  ) {
                    console.warn(
                      "⚠️ Session ID mismatch - skipping status update",
                    );
                    return;
                  }

                  const messageIdCandidates = [
                    operationPayload.message_id,
                    operationPayload.messageId,
                    operationPayload.stream_id,
                    operationPayload.streamId,
                    currentStreamIdRef.current,
                  ];

                  const effectiveMessageId =
                    messageIdCandidates.find(
                      (candidate): candidate is string =>
                        typeof candidate === "string" &&
                        candidate.trim() !== "",
                    ) || null;

                  const normalizeStatus = (
                    status: string | undefined | null,
                  ): PlaceStoryStatusState => {
                    switch (status) {
                      case "success":
                        return "success";
                      case "done":
                        return "done";
                      case "error":
                        return "error";
                      case "in_progress":
                        return "in_progress";
                      case "pending":
                        return "pending";
                      default:
                        return "pending";
                    }
                  };

                  const parseTimestamp = (ts: unknown): number | null => {
                    if (ts == null) {
                      return null;
                    }

                    if (typeof ts === "number") {
                      if (!Number.isFinite(ts)) {
                        return null;
                      }
                      return ts < 1e12 ? ts * 1000 : ts;
                    }

                    if (typeof ts === "string" && ts.trim().length > 0) {
                      const numeric = Number(ts);
                      if (!Number.isNaN(numeric)) {
                        return numeric < 1e12 ? numeric * 1000 : numeric;
                      }

                      const parsedDate = new Date(ts);
                      return Number.isNaN(parsedDate.getTime())
                        ? null
                        : parsedDate.getTime();
                    }

                    return null;
                  };

                  const normalizedStatus = normalizeStatus(payload.status);
                  const normalizedTimestamp = parseTimestamp(payload.ts);

                  setMessages((prevMessages) => {
                    // Find or create a dedicated PlaceStory status message
                    const statusMessageId = `placestory-${payload.session_id}`;
                    const existingStatusMsgIndex = prevMessages.findIndex(
                      (msg) => msg.id === statusMessageId,
                    );

                    const ensureStatusMessage = (
                      baseMessages: Message[],
                      status: PlaceStoryStatusPayload,
                    ) => {
                      const statusMessage: Message = {
                        id: statusMessageId,
                        sender: "bot",
                        text: "",
                        time: formatRelativeTime(new Date()),
                        placeStoryStatuses: [status],
                      };

                      const nextMessages = [...baseMessages, statusMessage];
                      updateStoredMessages(nextMessages, clickedLocation);
                      return nextMessages;
                    };

                    // If we have an explicit message ID from the backend, use it
                    const targetIndex =
                      effectiveMessageId != null
                        ? prevMessages.findIndex(
                            (msg) => msg.id === effectiveMessageId,
                          )
                        : -1;

                    // Otherwise, use the dedicated status message
                    const resolvedIndex =
                      targetIndex !== -1 ? targetIndex : existingStatusMsgIndex;

                    const nextStatus: PlaceStoryStatusPayload = {
                      step_id: payload.step_id,
                      label: payload.label,
                      details: payload.details ?? null,
                      status: normalizedStatus,
                      session_id: payload.session_id,
                      ts: normalizedTimestamp,
                    };

                    if (resolvedIndex === -1) {
                      console.log(
                        "🔵 No message found - creating new dedicated status message",
                      );
                      return ensureStatusMessage(prevMessages, nextStatus);
                    }

                    const updatedMessages = [...prevMessages];
                    const targetMessage = updatedMessages[resolvedIndex];
                    const existingStatuses =
                      targetMessage.placeStoryStatuses ?? [];

                    console.log("🔵 Target message:", targetMessage);
                    console.log("🔵 Existing statuses:", existingStatuses);

                    const existingIndex = existingStatuses.findIndex(
                      (statusItem) => statusItem.step_id === payload.step_id,
                    );

                    console.log("🔵 Existing status index:", existingIndex);

                    const nextStatuses =
                      existingIndex === -1
                        ? [...existingStatuses, nextStatus]
                        : existingStatuses.map((statusItem, index) =>
                            index === existingIndex
                              ? {
                                  ...statusItem,
                                  status: nextStatus.status,
                                  ts: nextStatus.ts,
                                }
                              : statusItem,
                          );

                    console.log("🔵 Next statuses:", nextStatuses);

                    updatedMessages[resolvedIndex] = {
                      ...targetMessage,
                      placeStoryStatuses: nextStatuses,
                    };

                    console.log(
                      "🔵 Updated message:",
                      updatedMessages[resolvedIndex],
                    );
                    console.log("🔵 All updated messages:", updatedMessages);

                    updateStoredMessages(updatedMessages, clickedLocation);

                    return updatedMessages;
                  });

                  break;
                }
                case "PLACESTORY_GENERATED": {
                  const payload = operation.payload;
                  setActiveArtifact({
                    type: "PLACESTORY_ARTIFACT",
                    payload: {
                      placestory_title: payload.placestory_title,
                      placestory_blocks: payload.placestory_blocks,
                    },
                  });
                  break;
                }
                case "ZOOM_TO_FEATURES":
                  controller.handleZoomToFeatures(operation.payload);
                  break;
                case "APPLY_FILTER":
                  controller.applyFilter(
                    operation.payload.layerId,
                    operation.payload.whereClause,
                    operation.payload.spatialLock,
                  );
                  break;
                case "TOGGLE_LAYER_VISIBILITY":
                  console.log("[ChatBox] Received TOGGLE_LAYER_VISIBILITY:", operation.payload);
                  controller.toggleLayerVisibility(
                    operation.payload.layerId,
                    operation.payload.layerName,
                    operation.payload.visible,
                  );

                  break;
                case "TOGGLE_SUBLAYER_VISIBILITY":
                  controller.toggleSublayerVisibility(
                    operation.payload.layerId,
                    operation.payload.sublayerId,
                    operation.payload.visible,
                  );
                  break;
                case "ZOOM_TO_LOCATION":
                  controller.showLocation(operation.payload.extent);
                  break;
                case "ZOOM_MAP":
                  console.log("Zoom map operation is: ", operation);
                  controller.zoomInZoomOut(
                    operation.payload.zoom_action,
                    operation.payload.zoom_percentage,
                  );
                  break;
                case "PAN_MAP":
                  controller.panMap(
                    operation.payload.direction as PanMapDirectionType,
                    operation.payload.distance,
                  );
                  break;
                case "TOGGLE_LABELS":
                  controller.toggleLabels(
                    operation.payload.layerId,
                    operation.payload.enabled,
                    operation.payload.labelField,
                  );
                  break;
                case "TOGGLE_SUBLAYER_LABELS":
                  controller.toggleSublayerLabels(
                    operation.payload.layerId,
                    operation.payload.sublayerId,
                    operation.payload.enabled,
                  );
                  break;
                case "SUGGEST_PIN":
                  controller.addPins([operation.payload.pins[0]]);
                  break;
                case "ADD_PIN":
                  controller.addPins(operation.payload.pins);
                  break;
                case "REMOVE_PIN":
                  controller.removePins(operation.payload.pinIds);
                  break;
                case "RESET_LAYERS":
                  // controller.resetLayers(operation.payload.layerIds);
                  break;
                case "PLOT_GEOJSON":
                  controller.plotGeoJSON(operation.payload);
                  break;
                default:
                  console.warn("Invalid operation type: ", operation.type);
                  break;
              }
            });

            return;
          }
        } catch (e) {
          console.error("Error processing WebSocket message:", e);
          setError("Failed to process server response. Please try again.");
        }
      },
    },
  );

  const { sendJsonMessage, readyState } = persistentWebSocket;

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingPayloadRef = useRef<object | null>(null);
  const lastSentPayloadRef = useRef<object | null>(null);

  const sendPatchMessage = useCallback(
    async (patchedData: unknown) => {
      if (readyState === ReadyState.OPEN) {
        try {
          const mapContext = await getCurrentMapState();
          const patchPayload = {
            type: "CHAT/PATCH",
            payload: {
              patched_data: patchedData,
              map_context: mapContext,
            },
          };
          sendJsonMessage(patchPayload);
        } catch (error) {
          console.error("Failed to get map context for patch:", error);
          // Send patch without map context if it fails
          const patchPayload = {
            type: "CHAT/PATCH",
            payload: { patched_data: patchedData },
          };
          sendJsonMessage(patchPayload);
        }
      }
    },
    [readyState, sendJsonMessage, getCurrentMapState],
  );

  const generateMapPatches = useCallback(async () => {
    if (!mapView) return [];

    try {
      const currentMapState = await getCurrentMapState();
      const lastState = lastMapStateRef.current;

      if (!lastState) {
        lastMapStateRef.current = currentMapState;
        return [];
      }

      const patches = compare(lastState, currentMapState);
      lastMapStateRef.current = currentMapState;

      return patches;
    } catch (error) {
      console.error("Error generating map patches:", error);
      return [];
    }
  }, [mapView, getCurrentMapState]);

  // Layer Query Handlers - Enable AI to query actual layer data
  const handleLayerQueryRequest = useCallback(
    async (payload: any) => {
      if (!mapView || !mapView.map) return;

      const { request_id, layer_name, geometry, where_clause, out_fields, max_features } = payload;

      try {
        // Find the layer by name
        const layer = mapView.map.allLayers.find(
          (l: any) => l.title === layer_name || l.id === layer_name
        ) as __esri.FeatureLayer;

        if (!layer || layer.type !== "feature") {
          sendJsonMessage({
            type: "LAYER/QUERY_RESPONSE",
            payload: { request_id, features: [], error: `Layer not found: ${layer_name}` }
          });
          return;
        }

        // Build query
        const query = layer.createQuery();
        query.outFields = out_fields || ["*"];
        query.returnGeometry = false;
        query.num = max_features || 1000;

        if (where_clause) {
          query.where = where_clause;
        }

        if (geometry) {
          // Convert GeoJSON to ArcGIS geometry if needed
          const { Polygon } = await import("@arcgis/core/geometry");
          if (geometry.type === "Polygon" && geometry.coordinates) {
            query.geometry = new Polygon({
              rings: geometry.coordinates,
              spatialReference: { wkid: 4326 }
            });
            query.spatialRelationship = "intersects";
          }
        }

        const result = await layer.queryFeatures(query);
        const features = result.features.map((f: any) => ({
          attributes: f.attributes
        }));

        sendJsonMessage({
          type: "LAYER/QUERY_RESPONSE",
          payload: { request_id, features, total_count: features.length }
        });
      } catch (error) {
        console.error("Layer query error:", error);
        sendJsonMessage({
          type: "LAYER/QUERY_RESPONSE",
          payload: { request_id, features: [], error: String(error) }
        });
      }
    },
    [mapView, sendJsonMessage]
  );

  const handleLayerExtentQuery = useCallback(
    async (payload: any) => {
      if (!mapView || !mapView.map) return;

      const { request_id, layer_name, out_fields } = payload;

      try {
        const layer = mapView.map.allLayers.find(
          (l: any) => l.title === layer_name || l.id === layer_name
        ) as __esri.FeatureLayer;

        if (!layer || layer.type !== "feature") {
          sendJsonMessage({
            type: "LAYER/QUERY_RESPONSE",
            payload: { request_id, features: [], error: `Layer not found: ${layer_name}` }
          });
          return;
        }

        // Query features in current extent
        const query = layer.createQuery();
        query.geometry = mapView.extent;
        query.spatialRelationship = "intersects";
        query.outFields = out_fields || ["*"];
        query.returnGeometry = false;

        const result = await layer.queryFeatures(query);
        const features = result.features.map((f: any) => ({
          attributes: f.attributes
        }));

        sendJsonMessage({
          type: "LAYER/QUERY_RESPONSE",
          payload: { request_id, features, total_count: features.length }
        });
      } catch (error) {
        console.error("Layer extent query error:", error);
        sendJsonMessage({
          type: "LAYER/QUERY_RESPONSE",
          payload: { request_id, features: [], error: String(error) }
        });
      }
    },
    [mapView, sendJsonMessage]
  );

  const handleLayerStatisticsRequest = useCallback(
    async (payload: any) => {
      if (!mapView || !mapView.map) return;

      const { request_id, layer_name, stat_field, group_by, geometry } = payload;

      try {
        const layer = mapView.map.allLayers.find(
          (l: any) => l.title === layer_name || l.id === layer_name
        ) as __esri.FeatureLayer;

        if (!layer || layer.type !== "feature") {
          sendJsonMessage({
            type: "LAYER/QUERY_RESPONSE",
            payload: { request_id, features: [], error: `Layer not found: ${layer_name}` }
          });
          return;
        }

        const query = layer.createQuery();
        query.outFields = [stat_field, group_by].filter(Boolean) as string[];
        query.returnGeometry = false;

        if (geometry) {
          const { Polygon } = await import("@arcgis/core/geometry");
          if (geometry.type === "Polygon") {
            query.geometry = new Polygon({
              rings: geometry.coordinates,
              spatialReference: { wkid: 4326 }
            });
            query.spatialRelationship = "intersects";
          }
        }

        const result = await layer.queryFeatures(query);

        // Aggregate results
        const aggregated: Record<string, number> = {};
        result.features.forEach((f: any) => {
          const groupKey = group_by ? f.attributes[group_by] : "total";
          const value = f.attributes[stat_field] || 0;
          aggregated[groupKey] = (aggregated[groupKey] || 0) + value;
        });

        const features = Object.entries(aggregated).map(([key, value]) => ({
          [group_by || "group"]: key,
          [stat_field]: value
        }));

        sendJsonMessage({
          type: "LAYER/QUERY_RESPONSE",
          payload: { request_id, features }
        });
      } catch (error) {
        console.error("Layer statistics error:", error);
        sendJsonMessage({
          type: "LAYER/QUERY_RESPONSE",
          payload: { request_id, features: [], error: String(error) }
        });
      }
    },
    [mapView, sendJsonMessage]
  );

  const handleLayerListRequest = useCallback(
    (payload: any) => {
      if (!mapView || !mapView.map) return;

      const { request_id } = payload;

      try {
        const layers = mapView.map.allLayers.toArray().map((layer: any) => ({
          id: layer.id,
          title: layer.title,
          type: layer.type,
          visible: layer.visible,
          opacity: layer.opacity
        }));

        sendJsonMessage({
          type: "LAYER/QUERY_RESPONSE",
          payload: { request_id, features: layers }
        });
      } catch (error) {
        console.error("Layer list error:", error);
        sendJsonMessage({
          type: "LAYER/QUERY_RESPONSE",
          payload: { request_id, features: [], error: String(error) }
        });
      }
    },
    [mapView, sendJsonMessage]
  );

  // Update layer query handler refs when handlers change
  useEffect(() => {
    handleLayerQueryRequestRef.current = handleLayerQueryRequest;
  }, [handleLayerQueryRequest]);

  useEffect(() => {
    handleLayerExtentQueryRef.current = handleLayerExtentQuery;
  }, [handleLayerExtentQuery]);

  useEffect(() => {
    handleLayerStatisticsRequestRef.current = handleLayerStatisticsRequest;
  }, [handleLayerStatisticsRequest]);

  useEffect(() => {
    handleLayerListRequestRef.current = handleLayerListRequest;
  }, [handleLayerListRequest]);

  useEffect(() => {
    if (!mapView) return;

    const handleMapChange = debounce(async () => {
      try {
        const patches = await generateMapPatches();
        if (patches.length > 0) {
          sendPatchMessage(patches);
        }
      } catch (error) {
        console.error("Error handling map change:", error);
      }
    }, 300);

    // Watch for map state changes
    const extentWatcher = mapView.watch("extent", handleMapChange);
    const zoomWatcher = mapView.watch("zoom", handleMapChange);
    const centerWatcher = mapView.watch("center", handleMapChange);

    // Watch for layer visibility changes
    const layerWatchers: Array<{ remove: () => void } | null> = [];
    if (mapView?.map) {
      layers.forEach((layer) => {
        const arcLayer = mapView.map?.findLayerById(layer.id);
        if (arcLayer) {
          const watcher = arcLayer.watch("visible", handleMapChange);
          layerWatchers.push(watcher);

          // Watch for sublayer visibility changes in GroupLayers
          if ((arcLayer as any).layers && layer.layers) {
            layer.layers.forEach((sublayerConfig: any) => {
              const sublayer = (arcLayer as any).layers.find(
                (sl: any) => sl.id === sublayerConfig.id,
              );
              if (sublayer) {
                const sublayerWatcher = sublayer.watch(
                  "visible",
                  handleMapChange,
                );
                layerWatchers.push(sublayerWatcher);
              }
            });
          }
        }
      });
    }

    return () => {
      extentWatcher?.remove();
      zoomWatcher?.remove();
      centerWatcher?.remove();
      layerWatchers.forEach((watcher) => watcher?.remove());
    };
  }, [mapView, layers, generateMapPatches, sendPatchMessage]);

  useEffect(() => {
    if (!mapView) return;

    const sendPinUpdates = async () => {
      try {
        const patches = await generateMapPatches();
        if (patches.length > 0) {
          sendPatchMessage(patches);
        }
      } catch (error) {
        console.error("Error sending pin updates:", error);
      }
    };

    sendPinUpdates();
  }, [pins, mapView, generateMapPatches, sendPatchMessage]);

  const showLocation = (longitude: number, latitude: number) => {
    if (!mapView) return false;
    try {
      mapView.goTo(
        {
          center: [longitude, latitude],
          zoom: 12,
        },
        {
          duration: 1000,
          easing: "linear",
        },
      );
      return true;
    } catch (error) {
      console.error("Error zooming to location:", error);
      return false;
    }
  };

  const handleAction = async (data: Message) => {
    try {
      if (stopRequestedRef.current) {
        return;
      }

      if (!mapView) {
        setError("Map is not ready. Please wait and try again.");
        return;
      }

      if (
        (data.operation === "Add" || data.operation === "SelectLayer") &&
        data.operation_data
      ) {
        const processed = new Set<string>();

        const operationDataArray = Array.isArray(data.operation_data)
          ? data.operation_data
          : [data.operation_data];

        operationDataArray.forEach(({ id, title, visible, sublayerId }) => {
          const layerId = sublayerId ? `${id}_${sublayerId}` : id;
          if (processed.has(layerId)) return;
          processed.add(layerId);

          const existing = layers.find(
            (l) =>
              l.id.toLowerCase() === layerId.toLowerCase() ||
              l.title.toLowerCase() === title.toLowerCase(),
          );

          if (existing) {
            if (existing.visibility !== (visible ?? true)) {
              const controller = getMapActionsController();
              controller.handleLegacyToggleLayer(existing.id, visible ?? true);
            }
          } else {
            const newLayer: AppliedLayer = {
              id: layerId,
              title: title || "Unnamed Layer",
              visibility: visible ?? true,
              popupEnabled: true,
              type: "Feature Layer",
              layerType: "Feature Service",
            };
            addLayer(newLayer);
          }
        });
      } else if (data.operation === "Remove" && data.operation_data) {
        const processed = new Set<string>();

        const operationDataArray = Array.isArray(data.operation_data)
          ? data.operation_data
          : [data.operation_data];

        operationDataArray.forEach(({ id, title, sublayerId }) => {
          const layerId = sublayerId ? `${id}_${sublayerId}` : id;
          if (processed.has(layerId)) return;
          processed.add(layerId);

          const existing = layers.find(
            (l) =>
              l.id.toLowerCase() === layerId.toLowerCase() ||
              l.title.toLowerCase() === title.toLowerCase(),
          );

          if (existing) {
            if (existing.visibility !== false) {
              const controller = getMapActionsController();
              controller.handleLegacyToggleLayer(existing.id, false);
            }
          }
        });
      } else if (data.operation === "ToggleLayer" && data.operation_data) {
        const processed = new Set<string>();

        const operationDataArray = Array.isArray(data.operation_data)
          ? data.operation_data
          : [data.operation_data];

        operationDataArray.forEach(({ id, title, visible, sublayerId }) => {
          const layerId = sublayerId ? `${id}_${sublayerId}` : id;
          if (processed.has(layerId)) return;
          processed.add(layerId);

          const existing = layers.find(
            (l) =>
              l.id.toLowerCase() === layerId.toLowerCase() ||
              l.title.toLowerCase() === title.toLowerCase(),
          );

          if (existing) {
            const controller = getMapActionsController();
            controller.handleLegacyToggleLayer(existing.id, visible ?? false);
          }
        });
      } else if (data.operation === "ZoomTo" && data.zoom_data) {
        if (data.zoom_data.place) {
          await zoomToPlace(data.zoom_data.place);

          if (data.text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.id
                  ? {
                      ...msg,
                      text: data.text,
                    }
                  : msg,
              ),
            );
          }
        } else if (data.zoom_data.layerId && data.zoom_data.whereClause) {
          await zoomToFeature(
            data.zoom_data.layerId,
            data.zoom_data.whereClause,
          );

          if (data.text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.id
                  ? {
                      ...msg,
                      text: data.text,
                    }
                  : msg,
              ),
            );
          }
        }
      } else if (data.operation === "Zoom Location" && data?.operation_data) {
        let latitude: number | undefined;
        let longitude: number | undefined;

        let operationData;
        if (Array.isArray(data.operation_data)) {
          if (data.operation_data.length > 0) {
            operationData = data.operation_data[0];
          }
        } else {
          operationData = data.operation_data;
        }

        if (operationData) {
          latitude = operationData.latitude;
          longitude = operationData.longitude;
        }

        if (typeof latitude === "number" && typeof longitude === "number") {
          showLocation(longitude, latitude);

          if (data.text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.id
                  ? {
                      ...msg,
                      text: data.text,
                    }
                  : msg,
              ),
            );
          }
        } else if (data.zoom_data?.place) {
          await zoomToPlace(data.zoom_data.place);

          if (data.text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.id
                  ? {
                      ...msg,
                      text: data.text,
                    }
                  : msg,
              ),
            );
          }
        }
      } else if (data.operation === "ZoomIn") {
        try {
          await zoomIn();

          if (data.text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.id
                  ? {
                      ...msg,
                      text: data.text,
                    }
                  : msg,
              ),
            );
          }
        } catch (error) {
          console.error("Zoom in error:", error);
        }
      } else if (data.operation === "ZoomOut") {
        try {
          await zoomOut();

          if (data.text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.id
                  ? {
                      ...msg,
                      text: data.text,
                    }
                  : msg,
              ),
            );
          }
        } catch (error) {
          console.error("Zoom out error:", error);
        }
      } else if (data.operation === "Suggestion/Add" && data.operation_data) {
        if (data.text) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.id ? { ...msg, text: data.text } : msg,
            ),
          );
        }
      } else if (data.operation === "Reset") {
        layers.forEach((layer) => {
          if (layer.visibility) {
            const controller = getMapActionsController();
            controller.handleLegacyToggleLayer(layer.id, false);
          }
        });
      } else if (data.operation === "Enable Labels" && data.operation_data) {
        // Handle Enable Labels operation
        data.operation_data.forEach((layerInfo) => {
          const layer = mapView.map?.findLayerById(
            layerInfo.id,
          ) as __esri.FeatureLayer;
          if (layer && layer.type === "feature") {
            layer.labelingInfo = [
              {
                symbol: {
                  type: "text",
                  color: "green",
                  backgroundColor: [255, 255, 255, 1],
                  borderLineColor: "green",
                  borderLineSize: 1,
                  yoffset: 5,
                  font: {
                    family: "Playfair Display",
                    size: 12,
                    weight: "bold",
                  },
                },
                labelPlacement: "above-center",
                labelExpressionInfo: {
                  expression: `$feature.${layerInfo.label_key || layerInfo.title}`,
                },
              },
            ];
            layer.labelsVisible = true;
          }
        });
      } else if (data.operation === "Disable Labels" && data.operation_data) {
        // Handle Disable Labels operation
        data.operation_data.forEach((layerInfo) => {
          const layer = mapView.map?.findLayerById(
            layerInfo.id,
          ) as __esri.FeatureLayer;
          if (layer && layer.type === "feature") {
            layer.labelingInfo = null;
            layer.labelsVisible = false;
          }
        });
      } else if (data.operation === "Remove Labels" && data.operation_data) {
        // Handle Remove Labels operation (same as Disable Labels)
        data.operation_data.forEach((layerInfo) => {
          const layer = mapView.map?.findLayerById(
            layerInfo.id,
          ) as __esri.FeatureLayer;
          if (layer && layer.type === "feature") {
            layer.labelingInfo = null;
            layer.labelsVisible = false;
          }
        });
      } else if (data.operation === "zoom" && data.operation_data) {
        try {
          let operationData;
          if (Array.isArray(data.operation_data)) {
            operationData = data.operation_data[0];
          } else {
            operationData = data.operation_data;
          }

          const { zoom_action } = operationData;

          if (zoom_action === "zoom_in") {
            await zoomIn();

            if (data.text) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === data.id
                    ? {
                        ...msg,
                        text: data.text,
                      }
                    : msg,
                ),
              );
            }
          } else if (zoom_action === "zoom_out") {
            await zoomOut();

            if (data.text) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === data.id
                    ? {
                        ...msg,
                        text: data.text,
                      }
                    : msg,
                ),
              );
            }
          } else {
            console.log("Unknown zoom_action:", zoom_action);
          }
        } catch (error) {
          console.error("Custom zoom error:", error);
        }
      } else if (data.operation === "pan" && data.operation_data) {
        // Handle pan operation
        try {
          const operationData = Array.isArray(data.operation_data)
            ? data.operation_data[0]
            : data.operation_data;
          const { direction, distance = 2 } = operationData;

          if (!direction) {
            console.error("No direction provided for pan operation");
            return;
          }

          const screenWidth = mapView.width;
          const screenHeight = mapView.height;

          const pixelDistanceX = screenWidth * (distance / 100) * 10;
          const pixelDistanceY = screenHeight * (distance / 100) * 10;

          let newScreenPoint;

          switch (direction.toLowerCase()) {
            case "up":
            case "north":
              newScreenPoint = {
                x: screenWidth / 2,
                y: screenHeight / 2 - pixelDistanceY,
              };
              break;
            case "down":
            case "south":
              newScreenPoint = {
                x: screenWidth / 2,
                y: screenHeight / 2 + pixelDistanceY,
              };
              break;
            case "right":
            case "east":
              newScreenPoint = {
                x: screenWidth / 2 + pixelDistanceX,
                y: screenHeight / 2,
              };
              break;
            case "left":
            case "west":
              newScreenPoint = {
                x: screenWidth / 2 - pixelDistanceX,
                y: screenHeight / 2,
              };
              break;
            default:
              console.error("Invalid pan direction:", direction);
              return;
          }

          const newMapPoint = mapView.toMap(newScreenPoint);

          mapView.goTo(
            { center: [newMapPoint.longitude, newMapPoint.latitude] },
            { duration: 500, easing: "linear" },
          );
        } catch (error) {
          console.error("Pan error:", error);
        }
      }
    } catch (err) {
      console.error(`Action failed for ${data.operation}:`, err);
      setError(`Failed to perform ${data.operation || "action"}.`);
    }
  };

  const handleSend = useCallback(
    async (messageOverride?: string): Promise<void> => {
      const messageToSend = messageOverride || input;

      if (!messageToSend.trim()) return;

      if (isStreaming) {
        setError(
          "Please wait for the current response to finish or click stop to send a new message.",
        );
        setTimeout(() => setError(null), 3000);
        return;
      }

      setError(null);

      // Check if message contains map-related keywords and switch to split view if needed
      // This provides instant feedback before waiting for AI response
      if (viewModeContext?.checkMessageIntent) {
        viewModeContext.checkMessageIntent(messageToSend);
      }

      const newMessage: Message = {
        sender: "user",
        text: messageToSend,
        time: formatRelativeTime(new Date()),
      };

      if (!conversationStarted) {
        setConversationStarted(true);
      }

      setMessages((prev) => {
        const updatedMessages = [...prev, newMessage];
        updateStoredMessages(updatedMessages, clickedLocation);
        return updatedMessages;
      });

      setThinkingMessage(null);
      setAgentProgress(null);
      setLoadingMessage({
        id: `loading-${Date.now()}`,
        text: "Thinking...",
        isVisible: !isWSVoiceModeActive,
      });

      setIsStreaming(true);
      stopRequestedRef.current = false;
      lastStreamedMessageRef.current = "";

      if (!messageOverride) {
        setInput("");
      }

      try {
        // Performance optimization: Skip map context for simple greetings
        const simpleGreetings = new Set([
          "hi",
          "hello",
          "hey",
          "hi there",
          "hello there",
          "good morning",
          "good afternoon",
          "good evening",
        ]);
        const isSimpleGreeting = simpleGreetings.has(
          messageToSend.trim().toLowerCase(),
        );

        // Get map context if map is ready, otherwise send with empty/minimal context
        let mapContext;
        if (isSimpleGreeting) {
          // Skip map context for instant greeting responses
          mapContext = {
            center: null,
            zoom: 0,
            scale: 0,
            extent: null,
            layers: [],
            pins: [],
          };
        } else if (isMapReady && mapView) {
          try {
            mapContext = await getCurrentMapState();
            console.log(`[ChatBox] Got map context with ${mapContext?.layers?.length || 0} layers`);
            if (mapContext?.layers?.length === 0) {
              console.warn("[ChatBox] WARNING: map_context has 0 layers! Layer toggles won't work.");
            }
          } catch (error) {
            console.warn(
              "Failed to get map context, sending with minimal context:",
              error,
            );
            mapContext = {
              center: null,
              zoom: 0,
              scale: 0,
              extent: null,
              layers: [],
              pins: [],
            };
          }
        } else {
          // Map not ready, send with minimal context
          console.log("Map not ready, sending message with minimal context");
          mapContext = {
            center: null,
            zoom: 0,
            scale: 0,
            extent: null,
            layers: [],
            pins: [],
          };
        }

        const sendPayload = {
          type: "CHAT/SEND",
          payload: {
            message: messageToSend,
            map_context: mapContext,
          },
        };

        if (readyState !== ReadyState.OPEN) {
          // Queue the message - onOpen handler will send it when connected
          // Keep "Thinking..." state visible while waiting for connection
          pendingPayloadRef.current = sendPayload;
          return;
        }

        sendJsonMessage(sendPayload);
        persistentWebSocket.updateActivity();
        lastSentPayloadRef.current = sendPayload;
      } catch (error: unknown) {
        console.error("Failed to send message:", error);
        setError(
          `Failed to send message: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
        setLoadingMessage(null);
        setIsStreaming(false);
      }
    },
    [
      input,
      isMapReady,
      mapView,
      getCurrentMapState,
      readyState,
      sendJsonMessage,
      persistentWebSocket,
      clickedLocation,
      conversationStarted,
      isStreaming,
      isWSVoiceModeActive,
    ],
  );

  // Removed debounce for immediate send - user expects instant response
  const debouncedHandleSend = () => {
    const messageToSend = input.trim();
    if (messageToSend) {
      handleSend();
    }
  };

  const handleStartDictation = async () => {
    try {
      console.log("Starting dictation...", {
        isSecureContext,
        browserSupportsSpeechRecognition,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
      });

      resetTranscript();
      setDictationMode(true);
      await startSpeechRecognition();

      try {
        await startAnalysis();
      } catch (err) {
        console.error("Failed to start audio visualization:", err);
      }
    } catch (error) {
      setError(
        `Failed to start dictation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setDictationMode(false);
    }
  };

  const handleStopDictation = () => {
    if (transcript.trim()) setInput(transcript.trim());
    stopSpeechRecognition();
    setDictationMode(false);
    stopAnalysis();
    resetTranscript();
  };

  const handleConfirmDictation = () => {
    handleStopDictation();
    if (transcript.trim()) {
      setInput(transcript.trim());
      handleSend(transcript.trim());
      resetTranscript();
      setInput("");
    }
  };

  const handleStopQuery = async () => {
    if (!canStopStream || (!currentStreamId && !currentStreamIdRef.current)) {
      resetStreamingState();
      return;
    }

    // Set stop requested flag and disable stop button immediately
    stopRequestedRef.current = true;
    setCanStopStream(false);

    const streamIdToStop = currentStreamId || currentStreamIdRef.current;

    try {
      if (streamIdToStop) {
        const result = await stopStream(streamIdToStop);
        console.log("Stop stream result:", result);
      }
    } catch (error) {
      console.error("Error stopping stream:", error);
    }

    // Add a timeout fallback in case server doesn't send stop confirmation
    setTimeout(() => {
      if (stopRequestedRef.current) {
        resetStreamingState();
      }
    }, 5000); // 5 second timeout

    setTimeout(() => {
      restoreFocus();
    }, 50);
  };

  const handleSuggestionClick = (layer: { id: string; title: string }) => {
    handleSend(`Show ${layer.title}`);
  };

  // const handleClickedLocationClick = (suggestion: string) => {
  //   setClickedLocation([]);
  //   if (!conversationStarted) {
  //     setConversationStarted(true);
  //   }
  //   updateStoredMessages(messages, []);
  //   handleSend(suggestion);
  // };

  // TODO: Initialize chat code commented out for now
  // useEffect(() => {
  //   if (widgetInfo && !widgetInfoLoading && !isInitializedRef.current) {
  //     const storedMessages = getStoredMessages() as Message[];
  //     const storedClickedLocation = getStoredClickedLocation();
  //     const hasValidStoredSession =
  //       storedMessages.length > 0 || storedClickedLocation.length > 0;

  //     if (hasValidStoredSession) {
  //       isRestoringSessionRef.current = true;

  //       if (storedMessages.length > 0) {
  //         setMessages(storedMessages);
  //         const hasUserMessages = storedMessages.some(
  //           (msg) => msg.sender === "user"
  //         );
  //         if (hasUserMessages) {
  //           setConversationStarted(true);
  //         }
  //       }

  //       if (storedClickedLocation.length > 0) {
  //         setClickedLocation(storedClickedLocation);
  //       }
  //     }

  //     // else {
  //     //   const initialMessages: Message[] = [];

  //     //   if (
  //     //     widgetInfo?.details?.data?.meta?.initial_message &&
  //     //     widgetInfo?.details?.data?.meta?.initial_message.length > 0
  //     //   ) {
  //     //     widgetInfo?.details?.data?.meta.initial_message.forEach(
  //     //       (message: string) => {
  //     //         initialMessages.push({
  //     //           sender: "bot",
  //     //           text: message,
  //     //           time: formatRelativeTime(new Date()),
  //     //         });
  //     //       }
  //     //     );
  //     //   } else {
  //     //     // initialMessages.push({
  //     //     //   sender: "bot",
  //     //     //   text: "What can I help you with?",
  //     //     //   time: formatRelativeTime(new Date()),
  //     //     // });
  //     //   }

  //     //   setMessages(initialMessages);

  //     //   if (widgetInfo?.details?.data?.meta?.suggested_message) {
  //     //     setClickedLocation(widgetInfo.details.data.meta.suggested_message);
  //     //   }

  //     //   storeChatData(
  //     //       initialMessages,
  //     //       WIDGET_ID,
  //     //       widgetInfo?.details?.data?.meta?.suggested_message
  //     //     );
  //     //   }
  //     // }

  //     isInitializedRef.current = true;
  //   }
  // }, [widgetInfo, widgetInfoLoading, persistentWebSocket]);

  // Store handleSend in a ref to avoid dependency issues
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  useEffect(() => {
    if (
      initialPrompt &&
      initialPrompt.trim() &&
      !voiceModeRedirect &&
      !hasInitialPromptBeenSentRef.current
    ) {
      // Prevent sending the same initial prompt more than once
      if (lastInitialPromptRef.current === initialPrompt) {
        return;
      }

      lastInitialPromptRef.current = initialPrompt;
      selectTab("chat");

      // Send immediately without waiting for map to be ready
      hasInitialPromptBeenSentRef.current = true;
      handleSendRef.current(initialPrompt);
      clearInitialPrompt();
    }

    // Reset the guard when initialPrompt is cleared
    if (!initialPrompt) {
      hasInitialPromptBeenSentRef.current = false;
      lastInitialPromptRef.current = null;
    }
  }, [initialPrompt, clearInitialPrompt, selectTab, voiceModeRedirect]);

  // Handle voice mode redirect from landing page
  useEffect(() => {
    if (voiceModeRedirect && !isWSVoiceModeActive) {
      console.log(
        "Voice mode redirect detected, starting WebSocket voice mode",
      );
      selectTab("chat");

      if (
        initialPrompt &&
        initialPrompt.trim() &&
        !hasInitialPromptBeenSentRef.current
      ) {
        hasInitialPromptBeenSentRef.current = true;
        handleSendRef.current(initialPrompt);
        clearInitialPrompt();
      }

      // Show switching message and switch to voice URL
      setIsSwitchingMode(true);
      setSwitchingMessage("Switching to voice mode...");
      setCurrentSocketUrl(SOCKET_URL_VOICE);

      setTimeout(() => {
        startWSVoiceMode();
        setIsSwitchingMode(false);
        setSwitchingMessage("");
      }, 1500);

      clearVoiceModeRedirect();
    }
  }, [
    voiceModeRedirect,
    isWSVoiceModeActive,
    selectTab,
    startWSVoiceMode,
    clearVoiceModeRedirect,
    initialPrompt,
    clearInitialPrompt,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-read bot messages when voice mode is enabled (old voice mode)
  useEffect(() => {
    if (isVoiceMode && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.sender === "bot" &&
        lastMessage.text &&
        !lastMessage.isStreaming
      ) {
        speakText(lastMessage.text);
      }
    }
  }, [messages, isVoiceMode, speakText]);

  // Send initial map context when map becomes ready
  useEffect(() => {
    if (
      shouldSendInitialContextRef.current &&
      !hasInitialMapContextSentRef.current &&
      mapView &&
      isMapReady &&
      readyState === ReadyState.OPEN
    ) {
      console.log("Map is NOW ready! Sending initial map context...");

      // Mark as sent to prevent duplicates
      hasInitialMapContextSentRef.current = true;
      shouldSendInitialContextRef.current = false;

      // Send initial map context
      (async () => {
        try {
          const mapContext = await getCurrentMapState();

          // Verify we have valid data
          if (!mapContext.center) {
            console.warn(
              "Map context center is null, retrying in 2 seconds...",
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const retryContext = await getCurrentMapState();

            if (!retryContext.center) {
              console.error(
                "Map context still invalid after retry. Not sending.",
              );
              return;
            }

            const initialPayload = {
              type: "CHAT/MAP_CONTEXT",
              payload: {
                map_context: retryContext,
              },
              timestamp: Date.now(),
            };

            sendJsonMessage(initialPayload);
            persistentWebSocket.updateActivity();
            console.log(
              "Sent INITIAL map context (after retry):",
              retryContext,
            );
            return;
          }

          // Send valid map context
          const initialPayload = {
            type: "CHAT/MAP_CONTEXT",
            payload: {
              message: "",
              map_context: mapContext,
            },
            timestamp: Date.now(),
          };

          sendJsonMessage(initialPayload);
          persistentWebSocket.updateActivity();
          console.log("Sent INITIAL map context:", mapContext);
        } catch (error) {
          console.error("Failed to send initial map context:", error);
        }
      })();
    }
  }, [
    mapView,
    isMapReady,
    readyState,
    getCurrentMapState,
    sendJsonMessage,
    persistentWebSocket,
  ]);

  return (
    <WebSocketProvider
      sendJsonMessage={sendJsonMessage}
      readyState={readyState}
    >
      <div
        className="h-full flex flex-col"
        style={{ backgroundColor: "transparent" }}
      >
        <div
          className={`w-full flex-1 px-2 py-0 overflow-hidden flex flex-col justify-end items-start tab-content-container ${
            isWSVoiceModeActive ? "opacity-50 pointer-events-none" : ""
          }`}
          style={{ paddingLeft: "8px", paddingRight: "8px" }}
        >
          {/* Default suggestion buttons when no messages and conversation hasn't started */}
          {!isWSVoiceModeActive &&
            messages.length === 0 &&
            clickedLocation.length > 0 &&
            !conversationStarted && (
              <>
                {clickedLocation.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-[#F5F5F5] rounded border-none flex justify-end items-center gap-2"
                  >
                    <div className="text-[#5C5C5C] text-xs font-normal leading-4">
                      {suggestion}
                    </div>
                  </div>
                ))}
              </>
            )}

          {/* Actual messages or voice mode animation */}
          <div className="w-full flex-1 overflow-y-auto space-y-2  min-h-0">
            {isWSVoiceModeActive ? (
              <VoiceModeAnimation
                isListening={isWSListening || isWSRecording}
                isSpeaking={isWSPlayingAudio}
              />
            ) : (
              <>
                {/* Top spacing for first message - 40px */}
                {messages.filter(
                  (msg) =>
                    !(msg.text || msg.content)
                      ?.toLowerCase()
                      .includes("thinking"),
                ).length > 0 && <div className="h-10 shrink-0 w-full" />}
                {messages
                  .filter(
                    (msg) =>
                      !(msg.text || msg.content)
                        ?.toLowerCase()
                        .includes("thinking"),
                  )
                  .map((msg, i) => {
                    if (msg.placeStoryStatuses?.length) {
                      console.log("🟢 Rendering message with statuses:", msg);
                      console.log(
                        "🟢 placeStoryStatuses:",
                        msg.placeStoryStatuses,
                      );
                    }
                    return (
                      <div key={i} className="flex flex-col w-full">
                        {/* User Message Container */}
                        {msg.sender === "user" ? (
                          <div className="flex flex-col items-end w-full">
                            <div
                              className="bg-[#f3f2f2] text-[#1D1916] whitespace-pre-line"
                              style={{
                                borderRadius: "12px 2px 12px 12px",
                                lineHeight: "1.35",
                                fontSize: "14px",
                                fontFamily: "Switzer, sans-serif",
                                padding: "12px",
                                maxWidth: "340px",
                              }}
                            >
                              {msg.text || msg.content}
                            </div>
                            {/* Spacing after user message - 40px */}
                            <div className="h-10 shrink-0 w-full" />
                          </div>
                        ) : (
                          /* Bot Message Container */
                          <div className="flex flex-col items-start w-full">
                            <div
                              className="flex flex-col text-[#1D1916] w-full"
                              style={{
                                lineHeight: "1.35",
                                fontSize: "14px",
                                fontFamily: "Switzer, sans-serif",
                                gap: "8px",
                              }}
                            >
                              <MarkdownRenderer
                                content={msg.text || msg.content || ""}
                              />
                            </div>
                            {/* Spacing after bot message - 40px or 32px for last */}
                            <div
                              className={`h-10 shrink-0 w-full ${i === messages.filter((m) => !(m.text || m.content)?.toLowerCase().includes("thinking")).length - 1 ? "h-8" : ""}`}
                            />
                          </div>
                        )}
                        {msg.operation === "Suggestion/Add" &&
                          msg.operation_data && (
                            <LayersList
                              layers={msg.operation_data}
                              onSelect={handleSuggestionClick}
                            />
                          )}

                        {msg.placeStoryStatuses &&
                          msg.placeStoryStatuses.length > 0 && (
                            <ProgressIndicator
                              title="Placestory status"
                              subtitle="Generating your personalized place story content"
                              steps={convertToProgressSteps(
                                msg.placeStoryStatuses,
                              )}
                            />
                          )}
                      </div>
                    );
                  })}

                {/* Dummy PlaceStory Progress - For Development Only */}
                {/* {useDummyData && (
                  <div className="w-full">
                    <ProgressIndicator
                      title="Placestory status"
                      subtitle="Generating your personalized place story content"
                      steps={DUMMY_PLACESTORY_STEPS}
                    />
                  </div>
                )} */}

                {loadingMessage && loadingMessage.isVisible && (
                  <div className="flex flex-col w-full">
                    <div className="max-w-[90%] px-2 rounded-md whitespace-pre-line text-gray-950">
                      {/* Show Manus-style TaskProgress when tasks are available */}
                      {taskProgress.length > 0 ? (
                        <TaskProgress
                          tasks={taskProgress}
                          title="Task progress"
                          showElapsedTime={true}
                          collapsible={true}
                          defaultExpanded={true}
                        />
                      ) : agentProgress ? (
                        <AgentProgressIndicator progress={agentProgress} />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className="text-gray-500 animate-pulse"
                            style={{
                              fontSize: "14px",
                              fontFamily: "Switzer, sans-serif",
                              lineHeight: "1.35",
                            }}
                          >
                            {thinkingMessage || loadingMessage.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {isSwitchingMode && switchingMessage && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span className="text-sm text-blue-700 font-medium">
                          {switchingMessage}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Map Loading Indicator - Subtle info, doesn't block interaction */}
          {!isMapReady && !widgetInfoLoading && messages.length === 0 && (
            <div className="px-3 py-2">
              <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                <span className="text-xs text-blue-600">
                  Map is loading in the background...
                </span>
              </div>
            </div>
          )}

          {/* Error Indicator - Only show voice errors when voice mode is active */}
          {(error ||
            audioError ||
            speechError ||
            voiceError ||
            (isWSVoiceModeActive && wsVoiceError)) && (
            <div className="px-3 py-3">
              <div className="flex items-center justify-between gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  <span className="text-sm text-orange-700 font-medium">
                    {error ||
                      audioError ||
                      speechError ||
                      voiceError ||
                      (isWSVoiceModeActive && wsVoiceError)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ClickedLocation Suggestions - only show if conversation hasn't started and not in voice mode */}
          {/* {!isVoiceModeActive &&
          clickedLocation.length > 0 &&
          messages.length > 0 &&
          !conversationStarted && (
            <div className="px-3 py-3">
              <div className="flex flex-wrap gap-3 justify-center">
                {clickedLocation.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleClickedLocationClick(suggestion)}
                    className="h-8 px-3 py-2 text-[12px] bg-[#F5F5F5] text-gray-700 rounded hover:bg-gray-200 transition-colors border-none cursor-pointer opacity-100 flex-shrink-0"
                  >
                    <span className="truncate block w-full text-left">
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )} */}
        </div>

        {/* Input Section */}
        <div className="self-stretch flex flex-col justify-center items-center pb-3 pt-0">
          {!dictationMode && !isWSVoiceModeActive ? (
            <DynamicChatInput
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSend={debouncedHandleSend}
              placeholder={
                isStreaming
                  ? "Streaming..."
                  : isMapReady
                    ? "Ask anything about a location, building, market, or customer segment…"
                    : "Ask anything… (Map is loading in background)"
              }
              disabled={isStreaming}
              autoResize={true}
              minRows={1}
              maxRows={5}
              size="md"
              borderRadius="xl"
              containerClassName="w-full"
              leftActions={
                <button
                  className="shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  title="Add attachment"
                >
                  <PlusIcon
                    size={28}
                    borderColor="#ECEAE9"
                    iconColor="#2A2623"
                  />
                </button>
              }
              rightActions={
                <>
                  {/* Dictate Button */}
                  <motion.button
                    onClick={handleStartDictation}
                    className={`rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${
                      listening ? "bg-red-100 text-red-500 animate-pulse" : ""
                    } ${isStreaming ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={!browserSupportsSpeechRecognition || isStreaming}
                    whileHover={!isStreaming ? { scale: 1.05 } : {}}
                    whileTap={!isStreaming ? { scale: 0.95 } : {}}
                    transition={{ type: "tween", duration: 0.15 }}
                    title="Dictate"
                  >
                    <MicIcon size={28} iconColor="#2A2623" />
                  </motion.button>
                  {/* Send/Voice Mode Button */}
                  {input.trim() ? (
                    <button
                      onClick={debouncedHandleSend}
                      disabled={isStreaming}
                      className="rounded-full flex items-center justify-center cursor-pointer bg-[#2A2623] text-white hover:bg-[#545251] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ padding: "6px" }}
                      title="Send message"
                    >
                      <ArrowUpIcon isEnabled={true} />
                    </button>
                  ) : !isStreaming ? (
                    <button
                      onClick={handleStartVoiceMode}
                      className={`flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${
                        isWSVoiceModeActive ? "ring-2 ring-green-500" : ""
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={!voiceModeSupported}
                      title={
                        isWSVoiceModeActive
                          ? "End voice mode"
                          : voiceModeSupported
                            ? "Voice mode"
                            : "Voice mode not supported"
                      }
                    >
                      <VoiceModeIcon size={28} />
                    </button>
                  ) : null}
                  {isStreaming && (
                    <motion.button
                      onClick={handleStopQuery}
                      disabled={!canStopStream || stopRequestedRef.current}
                      className={`rounded-full flex items-center justify-center transition-colors relative ${
                        stopRequestedRef.current
                          ? "cursor-not-allowed bg-red-100 text-red-500 opacity-75"
                          : canStopStream
                            ? "cursor-pointer bg-gray-200 text-gray-600 hover:bg-gray-200 animate-pulse"
                            : "cursor-not-allowed bg-gray-100 text-gray-400 opacity-50"
                      }`}
                      style={{ padding: "6px" }}
                      title={
                        stopRequestedRef.current
                          ? "Stopping..."
                          : canStopStream
                            ? "Click to stop streaming"
                            : "Loading..."
                      }
                      whileHover={
                        canStopStream && !stopRequestedRef.current
                          ? { scale: 1.05 }
                          : {}
                      }
                      whileTap={
                        canStopStream && !stopRequestedRef.current
                          ? { scale: 0.95 }
                          : {}
                      }
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      <StopIcon />
                    </motion.button>
                  )}
                </>
              }
            />
          ) : dictationMode ? (
            <div
              className="self-stretch relative bg-white flex flex-col overflow-hidden"
              style={{
                borderRadius: "20px",
                border: "1px solid #ECEAE9",
              }}
            >
              <div className="self-stretch p-2 gap-1 opacity-100 rounded bg-white shadow-[0px_48px_48px_-24px_rgba(51,51,51,0.04)] overflow-hidden border-none flex flex-col justify-start">
                {/* Transcript text area */}
                <div className="flex-1 p-2 min-h-[40px] max-h-[120px] overflow-y-auto">
                  <div className="text-gray-950 text-base whitespace-pre-wrap">
                    {transcript || "Listening..."}
                  </div>
                </div>
                {/* Audio visualization and action buttons */}
                <div className="flex items-center justify-between p-2">
                  <div className="flex-1 p-1 flex justify-between items-center">
                    {/* Dynamic Audio visualization bars */}
                    {audioLevels.map((height, i) => (
                      <div
                        key={i}
                        className={`w-[1px] opacity-60 transition-all duration-75 ${
                          isAnalyzing && height > 2
                            ? "bg-[#171717]"
                            : "bg-[#D1D1D1]"
                        }`}
                        style={{
                          height: `${height}px`,
                          transform: isAnalyzing ? "scaleY(1)" : "scaleY(0.3)",
                        }}
                      />
                    ))}
                  </div>
                  <motion.button
                    onClick={handleStopDictation}
                    className="p-2 rounded-full flex items-center justify-center cursor-pointer hover:text-gray-950 hover:bg-gray-200 bg-gray-100 text-gray-600 animate-pulse"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    title="Stop dictation"
                  >
                    <X size={16} className="text-gray-600" />
                  </motion.button>
                  <motion.button
                    onClick={handleConfirmDictation}
                    className="p-2 rounded-full flex items-center justify-center cursor-pointer hover:text-gray-950 hover:bg-gray-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    title="Use dictation"
                  >
                    <Check size={16} className="text-gray-600" />
                  </motion.button>
                  {isStreaming && (
                    <motion.button
                      onClick={handleStopQuery}
                      disabled={!canStopStream || stopRequestedRef.current}
                      className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                        stopRequestedRef.current
                          ? "cursor-not-allowed bg-red-100 text-red-500 opacity-75"
                          : canStopStream
                            ? "cursor-pointer bg-gray-200 text-gray-600 hover:bg-gray-200 animate-pulse"
                            : "cursor-not-allowed bg-gray-100 text-gray-400 opacity-50"
                      }`}
                      title={
                        stopRequestedRef.current
                          ? "Stopping..."
                          : canStopStream
                            ? "Click to stop streaming"
                            : "Loading..."
                      }
                      whileHover={
                        canStopStream && !stopRequestedRef.current
                          ? { scale: 1.05 }
                          : {}
                      }
                      whileTap={
                        canStopStream && !stopRequestedRef.current
                          ? { scale: 0.95 }
                          : {}
                      }
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      <StopIcon />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Voice Mode Active UI - Show stop button
            <div className="w-[376px] h-[48px] p-2 gap-1 opacity-100 rounded bg-white shadow-[0px_48px_48px_-24px_rgba(51,51,51,0.04)] overflow-hidden border-none flex justify-start items-center">
              <div className="flex-1 p-1 flex justify-center items-center">
                <div className="flex items-center gap-2">
                  <VoiceModeIcon
                    isEnabled={true}
                    className="w-4 h-4 animate-pulse"
                  />
                  <span className="text-sm text-gray-950 font-medium">
                    {isWSRecording
                      ? "Recording your speech..."
                      : isWSListening
                        ? "Listening for your map query..."
                        : isWSPlayingAudio
                          ? "Sharing your map response..."
                          : "Ready to explore - speak your map query!"}
                  </span>
                </div>
              </div>
              <motion.button
                onClick={handleVoiceModeXClick}
                disabled={
                  isStreaming && (!canStopStream || stopRequestedRef.current)
                }
                className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                  isStreaming
                    ? stopRequestedRef.current
                      ? "cursor-not-allowed bg-red-100 text-red-500 opacity-75"
                      : canStopStream
                        ? "cursor-pointer bg-gray-200 text-gray-600 hover:bg-gray-200 animate-pulse"
                        : "cursor-not-allowed bg-gray-100 text-gray-400 opacity-50"
                    : "cursor-pointer hover:text-gray-950 hover:bg-gray-200 bg-gray-100 text-gray-600 animate-pulse"
                }`}
                whileHover={
                  isStreaming
                    ? canStopStream && !stopRequestedRef.current
                      ? { scale: 1.05 }
                      : {}
                    : { scale: 1.05 }
                }
                whileTap={
                  isStreaming
                    ? canStopStream && !stopRequestedRef.current
                      ? { scale: 0.95 }
                      : {}
                    : { scale: 0.95 }
                }
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title={
                  isStreaming
                    ? stopRequestedRef.current
                      ? "Stopping..."
                      : canStopStream
                        ? "Click to stop streaming"
                        : "Loading..."
                    : "Stop voice communication"
                }
              >
                <X
                  size={16}
                  className={
                    isStreaming
                      ? canStopStream
                        ? "text-gray-600"
                        : "text-gray-400"
                      : "text-gray-600"
                  }
                />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default ChatBox;
