import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceModeReturn {
  isVoiceMode: boolean;
  isSpeaking: boolean;
  speechError: string | null;
  startVoiceMode: () => void;
  stopVoiceMode: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
}

export const useVoiceMode = (): UseVoiceModeReturn => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!speechSynthesisRef.current || !text.trim()) {
      return;
    }

    // Stop any current speech
    stopSpeaking();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;

      // Configure speech settings
      utterance.rate = 0.9; // Slightly slower for better comprehension
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      // Set voice (try to use a natural-sounding voice)
      const voices = speechSynthesisRef.current.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.includes("Google") ||
            voice.name.includes("Microsoft") ||
            voice.name.includes("Samantha")),
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeechError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setSpeechError(`Speech error: ${event.error}`);
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };

      // Speak the text
      speechSynthesisRef.current.speak(utterance);
    } catch (error) {
      console.error("Error creating speech utterance:", error);
      setSpeechError(
        `Failed to create speech: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  const startVoiceMode = useCallback(() => {
    setIsVoiceMode(true);
    setSpeechError(null);
  }, []);

  const stopVoiceMode = useCallback(() => {
    setIsVoiceMode(false);
    stopSpeaking();
    setSpeechError(null);
  }, [stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    isVoiceMode,
    isSpeaking,
    speechError,
    startVoiceMode,
    stopVoiceMode,
    speakText,
    stopSpeaking,
  };
};
