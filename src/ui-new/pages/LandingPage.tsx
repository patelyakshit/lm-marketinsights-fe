import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, X, Check } from "lucide-react";

import { usePromptContext } from "../../hooks/usePromptContext";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useSpeechRecognitionCustom } from "../../hooks/useSpeechRecognitionCustom";
import useAudioVisualization from "../../hooks/useAudioVisualization";

import { Header } from "../components/layout/Header";
import { ActionButton } from "../components/composite/ActionButton";
import { Tooltip } from "../components/base/Tooltip";
import { colors, typography } from "../design-system";

import {
  PlusIcon,
  MegaphoneIcon,
  MapPinIcon,
  FileTextIcon,
} from "../assets/icons";

import VoiceModeIcon from "../../components/svg/VoiceModeIcon";
import MicIcon from "../../components/svg/MicIcon";
import ArrowUpIcon from "../../components/svg/ArrowUpIcon";

const LandingPage: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [dictationMode, setDictationMode] = useState(false);
  const [hoveredSuggestionIndex, setHoveredSuggestionIndex] = useState<
    number | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceModeBrowserSupported, setVoiceModeBrowserSupported] =
    useState(false);
  const router = useNavigate();
  const {
    setInitialPrompt,
    setVoiceModeRedirect,
    setVoiceModeSupported,
    setHasStartedChat,
  } = usePromptContext();
  const { widgetInfo, isLoading: widgetInfoLoading } = useWidgetInfo();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    transcript,
    error: speechError,
    resetTranscript,
    browserSupportsSpeechRecognition,
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
  } = useSpeechRecognitionCustom();

  const { audioLevels, isAnalyzing, startAnalysis, stopAnalysis } =
    useAudioVisualization(46);

  useEffect(() => {
    if (!textareaRef.current || dictationMode) return;

    const textarea = textareaRef.current;
    const adjustHeight = () => {
      textarea.style.height = "auto";
      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = parseInt(computedStyle.lineHeight) || 24;
      const minHeight = lineHeight * 1;
      const maxHeight = lineHeight * 5;
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight));
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    };

    adjustHeight();
    const handleInput = () => adjustHeight();
    textarea.addEventListener("input", handleInput);
    return () => textarea.removeEventListener("input", handleInput);
  }, [prompt, dictationMode]);

  useEffect(() => {
    const checkVoiceModeSupport = () => {
      const hasMediaDevices = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      );
      const hasAudioContext = !!(
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      );
      const hasMediaRecorder = typeof MediaRecorder !== "undefined";

      const isSupported =
        hasMediaDevices && hasAudioContext && hasMediaRecorder;

      setVoiceModeBrowserSupported(isSupported);
    };

    checkVoiceModeSupport();
  }, []);

  const handleSubmitPrompt = () => {
    if (prompt.trim() && !isSubmitting) {
      setIsSubmitting(true);
      setInitialPrompt(prompt);
      setHasStartedChat(true);
      router("/dashboard");
    }
  };

  const handleStartDictation = async () => {
    resetTranscript();
    setDictationMode(true);

    try {
      await startSpeechRecognition();
      try {
        await startAnalysis();
      } catch (err) {
        console.error("Failed to start audio visualization:", err);
      }
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setDictationMode(false);
    }
  };

  const handleStopDictation = () => {
    if (transcript.trim()) setPrompt(transcript.trim());
    stopSpeechRecognition();
    setDictationMode(false);
    stopAnalysis();
    resetTranscript();
  };

  const handleConfirmDictation = () => {
    const currentTranscript = transcript.trim();
    handleStopDictation();
    if (currentTranscript && !isSubmitting) {
      setIsSubmitting(true);
      setInitialPrompt(currentTranscript);
      setHasStartedChat(true);
      router("/dashboard");
    }
  };

  const handleVoiceModeRedirect = () => {
    if (!isSubmitting && voiceModeBrowserSupported) {
      setIsSubmitting(true);
      setVoiceModeRedirect(true);
      setVoiceModeSupported(true);
      setInitialPrompt(prompt.trim() || "");
      setHasStartedChat(true);
      router("/dashboard");
    }
  };

  const suggestions = widgetInfo?.details?.data?.meta?.suggested_message || [
    "Is Uptown Dallas a good area for opening a car wash?",
    "Scan competition within 3 miles of Scottsdale Fashion Square.",
    "Compare Plano, TX and Frisco, TX for a new gym location.",
  ];

  const actionButtons = [
    {
      icon: MegaphoneIcon,
      label: "Create Marketing Post",
      onClick: () => {},
      disabled: false,
    },
    {
      icon: MapPinIcon,
      label: "Create Placestory",
      onClick: () => {},
      disabled: true,
      badge: "Soon",
    },
    {
      icon: FileTextIcon,
      label: "Create Report",
      onClick: () => {},
      disabled: true,
      badge: "Soon",
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitPrompt();
    }
  };

  return (
    <>
      <style>
        {`
          .landing-page-textarea::placeholder {
            font-family: Switzer, sans-serif;
            font-weight: 400;
            font-style: normal;
            font-size: 16px;
            line-height: 24px;
            letter-spacing: -0.08px;
            color: ${colors.text.soft[400]};
          }
        `}
      </style>
      <div
        className="h-[100vh] w-full relative"
        style={{ backgroundColor: colors.bg.weaker[25] }}
      >
        {/* Header - Absolutely positioned at top */}
        <div
          className="absolute top-0 left-0 w-full flex items-center justify-between"
          style={{ padding: "20px" }}
        >
          <Header className="w-full" />
        </div>

        {/* Main Content - Absolutely centered */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
          style={{ width: "740px", maxWidth: "100%", padding: "0 20px" }}
        >
          <div
            className="flex flex-col items-center justify-center w-full"
            style={{ gap: "32px" }}
          >
            <h1
              className="text-center w-full"
              style={{
                fontFamily: "Switzer, sans-serif",
                fontSize: "32px",
                fontWeight: 400,
                fontStyle: "normal",
                lineHeight: "40px",
                letterSpacing: "0",
                color: "#292a2e",
              }}
            >
              What business decision can I help you with?
            </h1>

            {/* Chat Input Container */}
            <div
              className="flex flex-col gap-5 items-center justify-center w-full"
              style={{ gap: "20px" }}
            >
              <div
                className="bg-white border rounded-[24px] w-full overflow-hidden"
                style={{ borderColor: "#dddee1" }}
              >
                <div
                  className="flex gap-2 items-start w-full"
                  style={{
                    minHeight: "60px",
                    padding: "20px",
                  }}
                >
                  {!dictationMode ? (
                    <>
                      <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 outline-none border-none resize-none bg-transparent landing-page-textarea"
                        style={{
                          fontFamily: "Switzer, sans-serif",
                          fontSize: "16px",
                          fontWeight: 400,
                          fontStyle: "normal",
                          lineHeight: "24px",
                          letterSpacing: "-0.08px",
                          color: prompt
                            ? colors.text.strong[950]
                            : colors.text.soft[400],
                          minHeight: "24px",
                        }}
                        placeholder="Ask anything about a location, building, market, or customer segment…"
                        disabled={isSubmitting}
                        rows={1}
                      />
                    </>
                  ) : (
                    <div className="w-full h-[48px] p-2 gap-1 opacity-100 rounded bg-white shadow-[0px_48px_48px_-24px_rgba(51,51,51,0.04)] overflow-hidden border-none flex justify-start items-center">
                      <div className="flex-1 p-1 flex justify-between items-center">
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
                              transform: isAnalyzing
                                ? "scaleY(1)"
                                : "scaleY(0.3)",
                            }}
                          />
                        ))}
                      </div>
                      <motion.button
                        onClick={handleStopDictation}
                        className="p-2 rounded-full flex items-center justify-center cursor-pointer hover:text-gray-950 hover:bg-gray-200 bg-gray-100 text-gray-600 animate-pulse"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                        title="Stop dictation"
                      >
                        <X size={16} className="text-gray-600" />
                      </motion.button>
                      <motion.button
                        onClick={handleConfirmDictation}
                        className="p-2 rounded-full flex items-center justify-center cursor-pointer hover:text-gray-950 hover:bg-gray-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                        title="Use dictation"
                      >
                        <Check size={16} className="text-gray-600" />
                      </motion.button>
                    </div>
                  )}
                </div>

                <div
                  className="flex items-center justify-between w-full"
                  style={{ padding: "12px" }}
                >
                  <Tooltip content="Add files and more" side="top">
                    <div className="cursor-pointer">
                      <PlusIcon
                        size={36}
                        borderColor={colors.neutral[200]}
                        iconColor={colors.neutral[800]}
                      />
                    </div>
                  </Tooltip>

                  {!dictationMode && (
                    <div className="flex gap-1.5 items-center">
                      <Tooltip
                        content={
                          !browserSupportsSpeechRecognition
                            ? "Speech recognition not supported in this browser"
                            : "Dictate"
                        }
                        side="top"
                      >
                        <motion.button
                          onClick={handleStartDictation}
                          disabled={
                            !browserSupportsSpeechRecognition || isSubmitting
                          }
                          className="rounded-full flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            color: colors.icon.strong[950],
                          }}
                          whileHover={
                            !isSubmitting && browserSupportsSpeechRecognition
                              ? { scale: 1.15, color: "#030712" }
                              : {}
                          }
                          whileTap={
                            !isSubmitting && browserSupportsSpeechRecognition
                              ? { scale: 0.95 }
                              : {}
                          }
                          transition={{ type: "tween", duration: 0.15 }}
                        >
                          <MicIcon size={36} />
                        </motion.button>
                      </Tooltip>

                      {!prompt.trim() && (
                        <Tooltip
                          content={
                            voiceModeBrowserSupported
                              ? "Voice mode"
                              : "Voice mode not supported in this browser"
                          }
                          side="top"
                        >
                          <button
                            onClick={handleVoiceModeRedirect}
                            disabled={
                              !voiceModeBrowserSupported || isSubmitting
                            }
                            className={`rounded-full flex items-center justify-center ${
                              voiceModeBrowserSupported
                                ? "cursor-pointer text-gray-950 hover:bg-[#545251]"
                                : "cursor-not-allowed text-gray-400"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <VoiceModeIcon size={36} />
                          </button>
                        </Tooltip>
                      )}

                      {prompt.trim() && !isSubmitting && (
                        <Tooltip content="Send message" side="top">
                          <button
                            onClick={handleSubmitPrompt}
                            className="rounded-full flex items-center justify-center cursor-pointer bg-gray-900 text-white hover:bg-[#545251]"
                          >
                            <ArrowUpIcon isEnabled={true} size={32} />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="flex items-center justify-center flex-wrap"
                style={{ gap: "8px" }}
              >
                {actionButtons.map((button, index) => (
                  <ActionButton
                    key={index}
                    icon={button.icon}
                    label={button.label}
                    onClick={button.onClick}
                    disabled={button.disabled || isSubmitting}
                    badge={button.badge}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{
            maxWidth: "740px",
            width: "100%",
            padding: "0 20px 40px",
          }}
        >
          <div className="flex flex-col w-full" style={{ gap: "12px" }}>
            <p
              className="text-center w-full"
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: "14px",
                fontWeight: typography.fontWeight.regular,
                lineHeight: "20px",
                letterSpacing: "-0.084px",
                color: colors.neutral[500],
              }}
            >
              Here are a few ways to get started.
            </p>

            <div className="flex items-start w-full" style={{ gap: "12px" }}>
              {widgetInfoLoading ? (
                <div
                  className="flex items-center gap-2 w-full justify-center"
                  style={{ color: colors.text.sub[600] }}
                >
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-sm">Loading suggestions...</span>
                </div>
              ) : (
                suggestions.map((suggestion, index) => {
                  const isHovered = hoveredSuggestionIndex === index;
                  return (
                    <motion.div
                      key={index}
                      className="flex-1 min-w-0 cursor-pointer"
                      style={{
                        backgroundColor: isHovered
                          ? colors.neutral[600]
                          : colors.neutral[200],
                        borderRadius: "6px",
                        padding: "20px",
                      }}
                      onMouseEnter={() => setHoveredSuggestionIndex(index)}
                      onMouseLeave={() => setHoveredSuggestionIndex(null)}
                      onClick={() => {
                        if (!isSubmitting) {
                          setIsSubmitting(true);
                          setInitialPrompt(suggestion);
                          setHasStartedChat(true);
                          router("/dashboard");
                        }
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "tween", duration: 0.15 }}
                    >
                      <p
                        style={{
                          fontFamily: typography.fontFamily.primary,
                          fontSize: "14px",
                          fontWeight: typography.fontWeight.regular,
                          lineHeight: "20px",
                          letterSpacing: "-0.084px", // -0.6% of 14px
                          color: isHovered
                            ? colors.static.white
                            : colors.neutral[900], // #ffffff on hover, #1d1916 default
                        }}
                      >
                        {suggestion}
                      </p>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {isSubmitting && (
          <motion.div
            className="absolute top-2 right-2 z-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-full"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            >
              <Loader2
                className="w-4 h-4 animate-spin"
                style={{ color: colors.brand.orange[500] }}
              />
              <span className="text-sm" style={{ color: colors.text.sub[600] }}>
                Processing...
              </span>
            </div>
          </motion.div>
        )}

        {speechError && (
          <motion.div
            className="absolute top-20 left-1/2 -translate-x-1/2 z-20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg"
              style={{ color: "#dc2626" }}
            >
              {speechError}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default LandingPage;
