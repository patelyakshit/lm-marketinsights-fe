import { useState, useRef, useEffect, useCallback } from "react";

interface UseVoiceModeCommunicationOptions {
  onUserSpeechComplete?: (transcript: string) => Promise<string>;
  onBotResponse?: (response: string) => void;
}

interface UseVoiceModeCommunicationReturn {
  isVoiceModeActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  speechError: string | null;
  startVoiceMode: () => void;
  stopVoiceMode: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  browserSupportsSpeechRecognition: boolean;
  isSecureContext: boolean;
}

export const useVoiceModeCommunication = (
  options?: UseVoiceModeCommunicationOptions,
): UseVoiceModeCommunicationReturn => {
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [
    browserSupportsSpeechRecognition,
    setBrowserSupportsSpeechRecognition,
  ] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef(false);
  const shouldRestartRecognitionRef = useRef(false);
  const recognitionRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voicesLoadedRef = useRef(false);
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);

  // Load voices function - defined outside useEffect to be accessible in cleanup
  const loadVoices = useCallback(() => {
    const voices = speechSynthesisRef.current?.getVoices() || [];
    if (voices.length > 0) {
      voicesLoadedRef.current = true;
      console.log("TTS: Voices loaded", voices.length);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      // Cancel all pending speech
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      console.log("TTS: Speech stopped/cancelled");

      // Clear any speech errors that might be from interruption
      setSpeechError(null);
    }
  }, []);

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

    // Initialize speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesisRef.current = window.speechSynthesis;

      // Load voices immediately
      loadVoices();

      // Listen for voices changed event (for browsers that load voices async)
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.addEventListener(
          "voiceschanged",
          loadVoices,
        );
      }
    }

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
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
        speechSynthesisRef.current.removeEventListener(
          "voiceschanged",
          loadVoices,
        );
      }
      if (recognitionRestartTimeoutRef.current) {
        clearTimeout(recognitionRestartTimeoutRef.current);
      }
    };
  }, [loadVoices]);

  const speakText = useCallback(
    (text: string) => {
      console.log("TTS: Attempting to speak text:", text);

      if (!speechSynthesisRef.current || !text.trim()) {
        console.log("TTS: Cannot speak - no synthesis or empty text");
        return;
      }

      // Stop any current speech
      stopSpeaking();

      try {
        // Wait a bit for voices to load if they haven't already
        const attemptSpeak = () => {
          const utterance = new SpeechSynthesisUtterance(text);
          currentUtteranceRef.current = utterance;
          console.log("TTS: Created utterance for text:", text);

          // Configure speech settings
          utterance.rate = 0.9; // Slightly slower for better comprehension
          utterance.pitch = 1.0;
          utterance.volume = 0.8;
          utterance.lang = "en-US";

          // Set voice (try to use a natural-sounding voice)
          const voices = speechSynthesisRef.current?.getVoices() || [];
          console.log("TTS: Available voices:", voices.length);

          if (voices.length > 0) {
            // Try to find a good English voice
            const preferredVoice =
              voices.find(
                (voice) =>
                  voice.lang.startsWith("en") &&
                  voice.localService &&
                  (voice.name.includes("Google") ||
                    voice.name.includes("Microsoft") ||
                    voice.name.includes("Samantha") ||
                    voice.name.includes("Alex")),
              ) || voices.find((voice) => voice.lang.startsWith("en"));

            if (preferredVoice) {
              utterance.voice = preferredVoice;
              console.log("TTS: Using voice:", preferredVoice.name);
            }
          }

          // Event handlers
          utterance.onstart = () => {
            console.log("TTS: Speech started");
            setIsSpeaking(true);
            setSpeechError(null);
            // Stop listening while speaking to avoid feedback
            if (isListening && recognitionRef.current) {
              console.log("TTS: Pausing speech recognition during TTS");
              recognitionRef.current.stop();
            }
          };

          utterance.onend = () => {
            console.log("TTS: Speech ended");
            setIsSpeaking(false);
            currentUtteranceRef.current = null;

            // Restart listening after bot finishes speaking
            if (isVoiceModeActive && shouldRestartRecognitionRef.current) {
              console.log(
                "TTS: Scheduling speech recognition restart after TTS",
              );
              recognitionRestartTimeoutRef.current = setTimeout(() => {
                if (
                  isVoiceModeActive &&
                  !isSpeaking &&
                  startListeningRef.current
                ) {
                  console.log(
                    "TTS: Restarting speech recognition after bot response",
                  );
                  startListeningRef.current();
                }
              }, 1000); // Increased delay to ensure speech synthesis is completely finished
            }
          };

          utterance.onerror = (event) => {
            console.error("TTS: Speech synthesis error:", event);

            // Don't show error for interrupted speech when voice mode is stopped
            if (event.error === "interrupted" && !isVoiceModeActive) {
              console.log(
                "TTS: Speech interrupted due to voice mode stop - not showing error",
              );
              setIsSpeaking(false);
              currentUtteranceRef.current = null;
              return;
            }

            // Only show error for other types of speech errors
            if (event.error !== "interrupted") {
              setSpeechError(`Speech error: ${event.error}`);
            }

            setIsSpeaking(false);
            currentUtteranceRef.current = null;

            // Still restart listening on error (except for interrupted)
            if (
              isVoiceModeActive &&
              shouldRestartRecognitionRef.current &&
              event.error !== "interrupted"
            ) {
              recognitionRestartTimeoutRef.current = setTimeout(() => {
                if (isVoiceModeActive && startListeningRef.current) {
                  startListeningRef.current();
                }
              }, 1000);
            }
          };

          // Speak the text
          console.log("TTS: Calling speechSynthesis.speak()");
          speechSynthesisRef.current?.speak(utterance);
        };

        // If voices aren't loaded yet, wait a bit
        if (!voicesLoadedRef.current && speechSynthesisRef.current) {
          setTimeout(attemptSpeak, 100);
        } else {
          attemptSpeak();
        }
      } catch (error) {
        console.error("Error creating speech utterance:", error);
        setSpeechError(
          `Failed to create speech: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [stopSpeaking, isListening, isVoiceModeActive, isSpeaking],
  );

  const startListening = useCallback(async () => {
    console.log("STT: startListening called");
    // Clear any previous errors
    setSpeechError(null);

    if (!browserSupportsSpeechRecognition) {
      console.log("STT: Speech recognition not supported");
      setSpeechError("Speech recognition is not supported in this browser.");
      return;
    }
    if (!isSecureContext) {
      console.log("STT: Not secure context");
      setSpeechError("Speech recognition requires HTTPS or localhost.");
      return;
    }

    // Don't start listening if we're currently speaking
    // Temporarily disabled to debug
    // if (isSpeaking) {
    //   console.log("STT: Skipping start listening - currently speaking, isSpeaking:", isSpeaking);
    //   return;
    // }

    // Stop any existing recognition before starting new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Error stopping previous recognition:", err);
      }
      recognitionRef.current = null;
    }

    // Clear any pending restart
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
      recognitionRestartTimeoutRef.current = null;
    }

    try {
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor();

      // Configure recognition settings
      recognition.continuous = false; // Changed to false for better control
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("STT: Voice mode speech recognition started");
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onend = () => {
        console.log("STT: Voice mode speech recognition ended");
        setIsListening(false);

        // Only restart recognition if voice mode is still active, we're not processing, and not speaking
        if (
          isVoiceModeActive &&
          !isProcessingRef.current &&
          !isSpeaking &&
          shouldRestartRecognitionRef.current
        ) {
          console.log("STT: Scheduling recognition restart");
          recognitionRestartTimeoutRef.current = setTimeout(() => {
            if (isVoiceModeActive && !isSpeaking && startListeningRef.current) {
              startListeningRef.current();
            }
          }, 500); // Delay to prevent rapid restart loops
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("STT: Voice mode speech recognition error:", event.error);
        setIsListening(false);

        // Handle specific error cases
        if (event.error === "not-allowed") {
          setSpeechError(
            "Microphone permission denied. Please allow microphone access and try again.",
          );
        } else if (event.error === "no-speech") {
          console.log("STT: No speech detected, will retry");
          // Don't set error for no-speech, just restart
          if (isVoiceModeActive && !isSpeaking) {
            recognitionRestartTimeoutRef.current = setTimeout(() => {
              if (
                isVoiceModeActive &&
                !isSpeaking &&
                startListeningRef.current
              ) {
                startListeningRef.current();
              }
            }, 1000);
          }
        } else if (event.error === "audio-capture") {
          setSpeechError(
            "No microphone found. Please check your microphone connection.",
          );
        } else if (event.error === "network") {
          setSpeechError(
            "Network error occurred. Please check your connection and try again.",
          );
          // Retry for network errors
          if (isVoiceModeActive && !isSpeaking) {
            recognitionRestartTimeoutRef.current = setTimeout(() => {
              if (
                isVoiceModeActive &&
                !isSpeaking &&
                startListeningRef.current
              ) {
                startListeningRef.current();
              }
            }, 2000);
          }
        } else if (event.error === "aborted") {
          // Don't restart for aborted errors (user manually stopped)
          console.log("STT: Speech recognition was aborted");
        } else {
          // For other errors, try to restart
          console.log("STT: Other error, attempting restart:", event.error);
          if (isVoiceModeActive && !isSpeaking) {
            recognitionRestartTimeoutRef.current = setTimeout(() => {
              if (
                isVoiceModeActive &&
                !isSpeaking &&
                startListeningRef.current
              ) {
                startListeningRef.current();
              }
            }, 1000);
          }
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcriptPart;
          }
        }

        // Process final transcript for voice mode
        if (finalTranscript.trim() && !isProcessingRef.current) {
          isProcessingRef.current = true;
          const fullTranscript = finalTranscript.trim();

          console.log("STT: Voice mode final transcript:", fullTranscript);

          // Stop current speech when user starts speaking
          if (isSpeaking) {
            console.log("STT: Stopping current speech for user input");
            stopSpeaking();
          }

          // Stop current recognition
          try {
            recognition.stop();
          } catch (err) {
            console.warn("Error stopping recognition after transcript:", err);
          }

          // Call the callback to handle the user speech
          if (options?.onUserSpeechComplete) {
            options
              .onUserSpeechComplete(fullTranscript)
              .then((response) => {
                console.log("STT: User speech processing completed");
                if (response && options?.onBotResponse) {
                  options.onBotResponse(response);
                }
                // Set flag to restart recognition after bot response
                shouldRestartRecognitionRef.current = true;
              })
              .catch((error) => {
                console.error("Error processing voice mode speech:", error);
                setSpeechError(`Error processing speech: ${error.message}`);
                // Still restart recognition even on error
                shouldRestartRecognitionRef.current = true;
              })
              .finally(() => {
                isProcessingRef.current = false;
              });
          } else {
            isProcessingRef.current = false;
          }
        }
      };

      recognition.onnomatch = () => {
        console.log("STT: No speech was recognized in voice mode");
        // Don't show error for no match, just restart
        if (isVoiceModeActive && !isSpeaking) {
          recognitionRestartTimeoutRef.current = setTimeout(() => {
            if (isVoiceModeActive && !isSpeaking && startListeningRef.current) {
              startListeningRef.current();
            }
          }, 500);
        }
      };

      recognition.onspeechstart = () => {
        console.log("STT: Speech has been detected in voice mode");
        setSpeechError(null);

        // Stop any current speech when user starts speaking
        if (isSpeaking) {
          console.log("STT: Stopping current speech for user input");
          stopSpeaking();
        }
      };

      recognition.onspeechend = () => {
        console.log("STT: Speech has stopped being detected in voice mode");
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start voice mode speech recognition:", err);
      setSpeechError(
        `Failed to start speech recognition: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setIsListening(false);
    }
  }, [
    browserSupportsSpeechRecognition,
    isSecureContext,
    options,
    isSpeaking,
    isVoiceModeActive,
    stopSpeaking,
  ]);

  // Store the startListening function in ref to avoid circular dependency
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("STT: Voice mode speech recognition stopped manually");
      } catch (err) {
        console.error("Error stopping voice mode speech recognition:", err);
      }
      recognitionRef.current = null;
    }

    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
      recognitionRestartTimeoutRef.current = null;
    }

    setIsListening(false);
  }, []);

  const startVoiceMode = useCallback(() => {
    console.log("Voice mode communication: Starting voice mode");

    setIsVoiceModeActive(true);
    setSpeechError(null);
    shouldRestartRecognitionRef.current = true;
    isProcessingRef.current = false;

    // Start listening immediately when voice mode is activated
    setTimeout(() => {
      console.log("Voice mode: Starting listening after timeout");
      startListening();
    }, 500); // Small delay to ensure state is updated
  }, [startListening]);

  const stopVoiceMode = useCallback(() => {
    console.log("Voice mode communication: Stopping voice mode");
    setIsVoiceModeActive(false);
    shouldRestartRecognitionRef.current = false;
    isProcessingRef.current = false;

    // Stop speaking first to avoid interruption errors
    stopSpeaking();
    stopListening();

    // Clear any speech errors after stopping
    setSpeechError(null);

    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
      recognitionRestartTimeoutRef.current = null;
    }
  }, [stopListening, stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
      if (recognitionRestartTimeoutRef.current) {
        clearTimeout(recognitionRestartTimeoutRef.current);
      }
    };
  }, [stopListening, stopSpeaking]);

  return {
    isVoiceModeActive,
    isListening,
    isSpeaking,
    speechError,
    startVoiceMode,
    stopVoiceMode,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    browserSupportsSpeechRecognition,
    isSecureContext,
  };
};
