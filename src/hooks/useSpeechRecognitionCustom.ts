import { useState, useRef, useEffect, useCallback } from "react";

interface SpeechRecognitionCustom {
  transcript: string;
  listening: boolean;
  error: string | null;
  browserSupportsSpeechRecognition: boolean;
  isSecureContext: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognitionCustom = (): SpeechRecognitionCustom => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [
    browserSupportsSpeechRecognition,
    setBrowserSupportsSpeechRecognition,
  ] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(false);

  // Check browser support and secure context on mount
  useEffect(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SpeechRecognitionConstructor;
    setBrowserSupportsSpeechRecognition(supported);
    setIsSecureContext(
      window.isSecureContext ||
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1",
    );

    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.warn("Error stopping recognition on cleanup:", err);
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    // Clear any previous errors
    setError(null);

    if (!browserSupportsSpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    if (!isSecureContext) {
      setError("Speech recognition requires HTTPS or localhost.");
      return;
    }

    // Stop any existing recognition before starting new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Error stopping previous recognition:", err);
      }
      recognitionRef.current = null;
    }

    try {
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor();

      // Configure recognition settings
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("Speech recognition started");
        setListening(true);
        setError(null);
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        setListening(false);
        // Don't clear transcript on end, let user decide when to clear
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        setListening(false);

        // Handle specific error cases
        if (event.error === "not-allowed") {
          setError(
            "Microphone permission denied. Please allow microphone access and try again.",
          );
        } else if (event.error === "no-speech") {
          setError("No speech detected. Please try again.");
        } else if (event.error === "audio-capture") {
          setError(
            "No microphone found. Please check your microphone connection.",
          );
        } else if (event.error === "network") {
          setError(
            "Network error occurred. Please check your connection and try again.",
          );
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        // Update transcript with both final and interim results
        const newTranscript = finalTranscript + interimTranscript;
        setTranscript(newTranscript);

        console.log("Speech result:", {
          final: finalTranscript,
          interim: interimTranscript,
          full: newTranscript,
        });
      };

      recognition.onnomatch = () => {
        console.log("No speech was recognized");
        setError("No speech was recognized. Please try again.");
      };

      recognition.onspeechstart = () => {
        console.log("Speech has been detected");
        setError(null);
      };

      recognition.onspeechend = () => {
        console.log("Speech has stopped being detected");
      };

      recognition.onsoundstart = () => {
        console.log("Some sound has been detected");
      };

      recognition.onsoundend = () => {
        console.log("Sound has stopped being detected");
      };

      recognition.onaudiostart = () => {
        console.log("Audio capture has started");
      };

      recognition.onaudioend = () => {
        console.log("Audio capture has ended");
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError(
        `Failed to start speech recognition: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setListening(false);
    }
  }, [browserSupportsSpeechRecognition, isSecureContext]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("Speech recognition stopped manually");
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
      recognitionRef.current = null;
    }
    setListening(false);
    // Don't clear transcript here - let the user decide when to clear it
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    transcript,
    listening,
    error,
    browserSupportsSpeechRecognition,
    isSecureContext,
    startListening,
    stopListening,
    resetTranscript,
  };
};
