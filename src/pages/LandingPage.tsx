import { EllipsisVertical, X, Check, Loader2 } from "lucide-react";
import LmLogo from "../components/svg/LmLogo";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
// @ts-expect-error - Particles component import issue
import Particles from "../components/Particles";
import { usePromptContext } from "../hooks/usePromptContext";
import { useWidgetInfo } from "../hooks/useWidgetInfo";
import { useSpeechRecognitionCustom } from "../hooks/useSpeechRecognitionCustom";
import useAudioVisualization from "../hooks/useAudioVisualization";
import { Textarea } from "../components/ui/textarea";
import MicIcon from "../components/svg/MicIcon";
import ArrowUpIcon from "../components/svg/ArrowUpIcon";
import VoiceModeIcon from "../components/svg/VoiceModeIcon";

const recentProjects = [
  {
    id: 1,
    label: "Market Insights AI",
    image: "https://placehold.co/400",
    time: "10 min ago",
  },
  {
    id: 2,
    label: "Real Estate Trends",
    image: "https://placehold.co/400",
    time: "1 week ago",
  },
  {
    id: 3,
    label: "Market Insights AI",
    image: "https://placehold.co/400",
    time: "2 months ago",
  },
];

const LandingPage = () => {
  const [prompt, setPrompt] = useState("");
  const [dictationMode, setDictationMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceModeBrowserSupported, setVoiceModeBrowserSupported] =
    useState(false);
  const router = useNavigate();
  const { setInitialPrompt, setVoiceModeRedirect, setVoiceModeSupported } =
    usePromptContext();
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

  // Check browser support for voice mode on mount
  useEffect(() => {
    const checkVoiceModeSupport = () => {
      // Check for required Web APIs
      const hasMediaDevices = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      );
      const hasAudioContext = !!(
        window.AudioContext || (window as any).webkitAudioContext
      );
      const hasMediaRecorder = typeof MediaRecorder !== "undefined";

      // Voice mode requires all three APIs
      const isSupported =
        hasMediaDevices && hasAudioContext && hasMediaRecorder;

      console.log("Voice mode browser support check:", {
        hasMediaDevices,
        hasAudioContext,
        hasMediaRecorder,
        isSupported,
      });

      setVoiceModeBrowserSupported(isSupported);
    };

    checkVoiceModeSupport();
  }, []);

  const handleSubmitPrompt = () => {
    if (prompt.trim() && !isSubmitting) {
      setIsSubmitting(true);
      setInitialPrompt(prompt);
      router("/map");
    }
  };

  const handleStartDictation = async () => {
    resetTranscript();
    setDictationMode(true);

    try {
      await startSpeechRecognition();

      // Start audio visualization
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

    // Stop audio visualization
    stopAnalysis();
    resetTranscript();
  };

  const handleConfirmDictation = () => {
    // Capture transcript before stopping dictation (which resets it)
    const currentTranscript = transcript.trim();
    handleStopDictation();
    if (currentTranscript && !isSubmitting) {
      setIsSubmitting(true);
      setInitialPrompt(currentTranscript);
      router("/map");
    }
  };

  const handleVoiceModeRedirect = () => {
    if (!isSubmitting && voiceModeBrowserSupported) {
      setIsSubmitting(true);
      setVoiceModeRedirect(true);
      setVoiceModeSupported(true); // Set voice mode as supported in context
      setInitialPrompt(prompt.trim() || ""); // Pass the current prompt if any, or empty string
      router("/map");
    }
  };

  // Get suggestions from widget info or use fallback
  const suggestions = widgetInfo?.details?.data?.meta?.suggested_message || [
    "Move the map to San Diego, CA.",
    "Drop a pin on the H-E-B in McKinney Texas.",
    "Tell me about 4915 Lemmon Ave, Dallas Texas.",
  ];

  return (
    <div className="h-[100vh] w-full bg-[#F7F7F7] p-1.5 flex flex-col relative">
      {/* Particles Background */}

      <div className="pt-2 pb-3.5 px-3.5 flex flex-row justify-between items-center relative z-10">
        <LmLogo />
        <div className="flex flex-row gap-2">
          <button
            className="py-1.5 px-4 border border-gray-200 rounded-[7px] text-[#171717] font-[500] text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
            // onClick={() => router("/map")}
          >
            Login
          </button>
          <button
            className="py-1.5 px-4 border border-gray-200 rounded-[7px] text-white bg-black font-[500] text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
            // onClick={() => router("/map")}
          >
            Get Started
          </button>
        </div>
      </div>

      <motion.div
        className="bg-white border border-gray-200 rounded-[9px] flex-1 p-2.5 flex flex-col justify-center items-center py-10 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Particles Background - positioned behind content */}
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <Particles
            particleColors={["#FA7319", "#FA7319"]}
            particleCount={100}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>

        {/* heading */}
        <motion.div
          className="flex flex-col gap-3 w-[50vw] relative z-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <motion.p
            className="flex items-center text-[#171717] font-[600] text-[56px] leading-none"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          >
            Location
            <motion.span
              className="px-4"
              animate={{
                rotate: [0, 8, -8, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M17.4068 9.47944C17.189 8.8908 16.6276 8.5 16 8.5C15.3723 8.5 14.811 8.8908 14.5932 9.47944L13.5615 12.2676C12.1611 16.0522 11.592 17.4978 10.5449 18.545C9.49786 19.592 8.05224 20.161 4.26756 21.5616L1.47944 22.5932C0.8908 22.811 0.5 23.3724 0.5 24C0.5 24.6276 0.8908 25.189 1.47944 25.4068L4.26756 26.4384C8.05224 27.839 9.49786 28.408 10.5449 29.455C11.592 30.5022 12.1611 31.9478 13.5615 35.7324L14.5932 38.5206C14.811 39.1092 15.3723 39.5 16 39.5C16.6276 39.5 17.189 39.1092 17.4068 38.5206L18.4384 35.7324C19.839 31.9478 20.408 30.5022 21.455 29.455C22.5022 28.408 23.9478 27.839 27.7324 26.4384L30.5206 25.4068C31.1092 25.189 31.5 24.6276 31.5 24C31.5 23.3724 31.1092 22.811 30.5206 22.5932L27.7324 21.5616C23.9478 20.161 22.5022 19.592 21.455 18.545C20.408 17.4978 19.839 16.0522 18.4384 12.2676L17.4068 9.47944ZM33.4068 1.47944C33.189 0.8908 32.6276 0.5 32 0.5C31.3724 0.5 30.811 0.8908 30.5932 1.47944L30.151 2.67434C29.5236 4.3699 29.341 4.77096 29.056 5.056C28.771 5.34106 28.3698 5.52366 26.6744 6.15106L25.4794 6.59322C24.8908 6.81104 24.5 7.37234 24.5 8C24.5 8.62766 24.8908 9.18896 25.4794 9.40678L26.6744 9.84894C28.37 10.4763 28.771 10.6589 29.056 10.944C29.341 11.229 29.5236 11.6301 30.151 13.3256L30.5932 14.5206C30.811 15.1092 31.3724 15.5 32 15.5C32.6276 15.5 33.189 15.1092 33.4068 14.5206L33.849 13.3257C34.4764 11.6301 34.659 11.229 34.944 10.944C35.229 10.6589 35.6302 10.4763 37.3256 9.84894L38.5206 9.40678C39.1092 9.18896 39.5 8.62766 39.5 8C39.5 7.37234 39.1092 6.81104 38.5206 6.59322L37.3256 6.15106C35.6302 5.52366 35.229 5.34106 34.944 5.056C34.659 4.77096 34.4764 4.3699 33.849 2.67434L33.4068 1.47944Z"
                  fill="#FA7319"
                />
              </svg>
            </motion.span>
            intelligence
          </motion.p>
          <motion.p
            className="flex items-center text-[#171717] font-[600] text-[56px] leading-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          >
            made simple.
          </motion.p>
          <motion.p
            className="text-[#5C5C5C] font-[400] text-[18px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
          >
            From complex data to clear insights, in seconds.
          </motion.p>
        </motion.div>

        {/* chatArea */}
        <motion.div
          className="bg-[#F7F7F7] rounded-[20px] w-[50vw] mt-12 p-1 relative z-10"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
        >
          {/* Loading indicator */}
          {isSubmitting && (
            <motion.div
              className="absolute top-2 right-2 z-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-lg">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span className="text-sm text-gray-600">Processing...</span>
              </div>
            </motion.div>
          )}
          <motion.div
            className="bg-white rounded-[17px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] px-1.5"
            whileHover={{
              boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
              scale: 1.002,
            }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            <Textarea
              ref={textareaRef}
              value={dictationMode ? transcript : prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Locaition Matters to find data centers in Texas"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitPrompt();
                }
              }}
              autoResize={true}
              minRows={1}
              maxRows={5}
              variant="filled"
              className="w-full outline-none border-none shadow-none gap-4 focus-visible:ring-0 text-base resize-none px-3 pt-3 pb-0 min-h-[48px] max-h-[150px] overflow-y-auto placeholder:text-[#A3A3A3] placeholder:font-[400] placeholder:text-base placeholder:leading-6 placeholder:tracking-[-0.176px]"
              style={{ fontSize: "16px" }}
            />
            <div className="flex flex-row gap-2 items-center justify-end pb-3 pr-3">
              {!dictationMode ? (
                <>
                  <motion.button
                    onClick={handleStartDictation}
                    className={`rounded-full flex items-center justify-center cursor-pointer ${"text-gray-950  hover:bg-gray-100 cursor-pointer"}`}
                    disabled={!browserSupportsSpeechRecognition}
                    whileHover={{ scale: 1.15, color: "#030712" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "tween", duration: 0.15 }}
                    title={
                      !browserSupportsSpeechRecognition
                        ? "Speech recognition not supported in this browser"
                        : "Dictate"
                    }
                  >
                    <MicIcon />
                  </motion.button>

                  {/* Show voice mode icon only when input is empty */}
                  {!prompt.trim() && (
                    <motion.button
                      onClick={handleVoiceModeRedirect}
                      className={`rounded-full flex items-center justify-center ${
                        voiceModeBrowserSupported
                          ? "cursor-pointer text-gray-950 hover:bg-gray-100"
                          : "cursor-not-allowed text-gray-400"
                      }`}
                      disabled={!voiceModeBrowserSupported}
                      whileHover={
                        voiceModeBrowserSupported
                          ? { scale: 1.15, color: "#030712" }
                          : {}
                      }
                      whileTap={
                        voiceModeBrowserSupported ? { scale: 0.95 } : {}
                      }
                      transition={{ type: "tween", duration: 0.15 }}
                      title={
                        voiceModeBrowserSupported
                          ? "Voice mode"
                          : "Voice mode not supported in this browser"
                      }
                    >
                      <VoiceModeIcon size={36} />
                    </motion.button>
                  )}

                  {/* Show send arrow only when there is text */}
                  {prompt.trim() && (
                    <motion.button
                      onClick={handleSubmitPrompt}
                      className="rounded-full flex items-center justify-center cursor-pointer bg-gray-900 text-white hover:bg-gray-700 hover:scale-105 hover:shadow-lg transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "tween", duration: 0.15 }}
                      title="Send message"
                    >
                      <ArrowUpIcon isEnabled={true} />
                    </motion.button>
                  )}
                </>
              ) : (
                <div className="w-full h-[48px] p-2 gap-1 opacity-100 rounded bg-white shadow-[0px_48px_48px_-24px_rgba(51,51,51,0.04)] overflow-hidden border-none flex justify-start items-center">
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
                </div>
              )}
            </div>
          </motion.div>
          {/* Speech recognition error display */}
          {speechError && (
            <motion.div
              className="text-red-500 text-[12px] font-[400] text-center pt-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {speechError}
            </motion.div>
          )}

          <motion.p
            className="text-[#5C5C5C] text-[13px] font-[400] text-center pt-2.5 pb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
          >
            Powered by{" "}
            <motion.span
              className="text-[#FA7319] cursor-pointer"
              onClick={() =>
                window.open("https://www.locaitionmatters.com/", "_blank")
              }
              whileHover={{
                scale: 1.05,
                textShadow: "0 0 8px rgba(250,115,25,0.4)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "tween", duration: 0.15 }}
            >
              Locaition Matters
            </motion.span>
          </motion.p>
        </motion.div>

        {/* suggestions */}
        <motion.div
          className="flex gap-[5px] mt-6 w-[50vw] relative z-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
        >
          {widgetInfoLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-sm">Loading suggestions...</span>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                onClick={() => {
                  if (!isSubmitting) {
                    setIsSubmitting(true);
                    setInitialPrompt(suggestion);
                    router("/map");
                  }
                }}
                className={`flex px-3 py-2 justify-end items-center gap-2 rounded bg-[#F5F5F5] cursor-pointer hover:bg-[#EBEBEB] transition-colors ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.9 + index * 0.05,
                  ease: "easeOut",
                }}
                whileHover={{
                  scale: 1.03,
                  backgroundColor: "#EBEBEB",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                <p className="text-[#5C5C5C] text-[12px] font-[400]">
                  {suggestion}
                </p>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* recent projects */}
        <motion.div
          className="mt-15 w-[50vw] relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
        >
          <motion.p
            className="text-[#171717] text-[24px] font-[500]"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 1.1, ease: "easeOut" }}
          >
            Recent Projects
          </motion.p>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {recentProjects.map((project, index) => (
              <motion.div
                key={project.id}
                className="border border-gray-100 rounded-[8px] p-1 flex flex-row justify-between items-start gap-6"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 1.2 + index * 0.08,
                  ease: "easeOut",
                }}
                whileHover={{
                  scale: 1.01,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                  borderColor: "#d1d5db",
                }}
              >
                <div className="flex flex-row gap-2 items-center">
                  <motion.img
                    src={project.image}
                    alt={project.label}
                    className="w-[44px] h-[44px] object-cover rounded-[6px]"
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "tween", duration: 0.15 }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-[500] text-[#171717] truncate">
                      {project.label}
                    </p>
                    <p className="text-[12px] font-[400] text-[#5C5C5C] truncate">
                      {project.time}
                    </p>
                  </div>
                </div>
                <motion.div
                  className="mt-[5px] pr-1 cursor-pointer"
                  whileHover={{ scale: 1.15, color: "#FA7319" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "tween", duration: 0.15 }}
                >
                  <EllipsisVertical strokeWidth={1.5} className="w-3 h-3" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
