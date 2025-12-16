import { useState, useRef, useCallback } from "react";

interface TextToSpeechOptions {
  lang?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (text: string, options?: TextToSpeechOptions) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  error: string | null;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Load available voices
  const loadVoices = useCallback(() => {
    if (!isSupported) return;

    const availableVoices = speechSynthesis.getVoices();
    setVoices(availableVoices);
  }, [isSupported]);

  // Load voices on mount and when voices change
  useState(() => {
    if (!isSupported) return;

    loadVoices();

    // Some browsers load voices asynchronously
    const handleVoicesChanged = () => {
      loadVoices();
    };

    speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  });

  const speak = useCallback(
    async (text: string, options: TextToSpeechOptions = {}) => {
      if (!isSupported) {
        setError("Text-to-speech is not supported in this browser");
        return;
      }

      if (!text.trim()) {
        setError("No text provided for speech synthesis");
        return;
      }

      // Stop any current speech
      stop();

      setError(null);

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Set default options
        utterance.lang = options.lang || "en-US";
        utterance.pitch = options.pitch || 1;
        utterance.rate = options.rate || 1;
        utterance.volume = options.volume || 1;

        // Set voice if provided
        if (options.voice) {
          utterance.voice = options.voice;
        } else {
          // Try to find a good default voice
          const englishVoices = voices.filter(
            (voice) => voice.lang.startsWith("en") && voice.localService,
          );
          if (englishVoices.length > 0) {
            utterance.voice = englishVoices[0];
          }
        }

        // Event handlers
        utterance.onstart = () => {
          setIsSpeaking(true);
          setError(null);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        };

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event);
          setError(`Speech synthesis error: ${event.error}`);
          setIsSpeaking(false);
          utteranceRef.current = null;
        };

        utterance.onpause = () => {
          setIsSpeaking(false);
        };

        utterance.onresume = () => {
          setIsSpeaking(true);
        };

        // Start speaking
        speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Failed to start speech synthesis:", err);
        setError(
          `Failed to start speech synthesis: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        setIsSpeaking(false);
      }
    },
    [isSupported, voices],
  );

  const stop = useCallback(() => {
    if (!isSupported) return;

    speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;

    speechSynthesis.pause();
    setIsSpeaking(false);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;

    speechSynthesis.resume();
    setIsSpeaking(true);
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    voices,
    speak,
    stop,
    pause,
    resume,
    error,
  };
};
