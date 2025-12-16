import { useState, useRef, useCallback, useEffect } from "react";
import { PCMAudioRecorder, PCMAudioPlayer } from "../utils/audioUtils";

interface UseWebSocketVoiceModeOptions {
  onSendAudio?: (
    audioBase64: string,
    sampleRate: number,
    bitrate: number,
    isFinal?: boolean,
  ) => void;
  isVoiceModeSupported?: boolean;
}

interface UseWebSocketVoiceModeReturn {
  isVoiceModeActive: boolean;
  isRecording: boolean;
  isPlayingAudio: boolean;
  isListening: boolean;
  error: string | null;
  startVoiceMode: () => Promise<void>;
  stopVoiceMode: () => void;
  playAudioChunk: (audioChunk: string, sampleRate: number) => Promise<void>;
  stopAudioPlayback: () => void;
}

export const useWebSocketVoiceMode = (
  options: UseWebSocketVoiceModeOptions,
): UseWebSocketVoiceModeReturn => {
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRecorderRef = useRef<PCMAudioRecorder | null>(null);
  const audioPlayerRef = useRef<PCMAudioPlayer | null>(null);
  const stopVoiceModeRef = useRef<(() => void) | null>(null);

  // Initialize audio player
  useEffect(() => {
    audioPlayerRef.current = new PCMAudioPlayer();

    // Set callback for when playback ends
    audioPlayerRef.current.setOnPlaybackEnd(() => {
      setIsPlayingAudio(false);
      console.log("Audio playback ended");
    });

    return () => {
      // Cleanup on unmount
      if (audioPlayerRef.current) {
        audioPlayerRef.current.cleanup();
        audioPlayerRef.current = null;
      }
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
    };
  }, []);

  /**
   * Start voice mode - initializes recording
   */
  const startVoiceMode = useCallback(async () => {
    if (!options.isVoiceModeSupported) {
      setError("Voice mode is not supported by the server");
      return;
    }

    if (isVoiceModeActive) {
      console.warn("Voice mode is already active");
      return;
    }

    try {
      setError(null);
      setIsVoiceModeActive(true);

      // Create audio recorder
      const sampleRate = 16000; // 16kHz sample rate
      audioRecorderRef.current = new PCMAudioRecorder(sampleRate);

      // Start recording with continuous streaming
      await audioRecorderRef.current.start(
        (audioBase64, sampleRate, isFinal = false) => {
          if (options.onSendAudio) {
            // Calculate bitrate (16-bit PCM = 16 bits per sample * sample rate)
            const bitrate = 16 * sampleRate;
            options.onSendAudio(audioBase64, sampleRate, bitrate, isFinal);
          }
        },
      );

      setIsRecording(true);
      console.log("Voice mode started - continuous streaming");
    } catch (err) {
      console.error("Error starting voice mode:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start voice mode. Please check microphone permissions.",
      );
      setIsVoiceModeActive(false);
      setIsRecording(false);

      // Cleanup on error
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
    }
  }, [isVoiceModeActive, options]);

  /**
   * Stop voice mode - stops recording
   */
  const stopVoiceMode = useCallback(() => {
    if (!isVoiceModeActive) {
      return;
    }

    console.log("Stopping voice mode");

    // Stop recording
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }

    // Stop any ongoing playback
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
    }

    setIsRecording(false);
    setIsListening(false);
    setIsPlayingAudio(false);
    setIsVoiceModeActive(false);
    setError(null);
  }, [isVoiceModeActive]);

  // Store stopVoiceMode in ref to avoid circular dependency
  useEffect(() => {
    stopVoiceModeRef.current = stopVoiceMode;
  }, [stopVoiceMode]);

  /**
   * Play audio chunk received from server
   */
  const playAudioChunk = useCallback(
    async (audioChunk: string, sampleRate: number) => {
      if (!audioPlayerRef.current) {
        console.error("Audio player not initialized");
        return;
      }

      try {
        // Temporarily stop recording while playing audio to avoid feedback
        const wasRecording = isRecording;
        if (wasRecording && audioRecorderRef.current) {
          console.log("Pausing recording during audio playback");
          audioRecorderRef.current.stop();
          setIsRecording(false);
        }

        setIsPlayingAudio(true);
        await audioPlayerRef.current.addAudioChunk(audioChunk, sampleRate);

        // Restart recording after a short delay if it was active
        if (wasRecording && isVoiceModeActive) {
          setTimeout(async () => {
            if (isVoiceModeActive && options.onSendAudio) {
              try {
                const newRecorder = new PCMAudioRecorder(16000);
                audioRecorderRef.current = newRecorder;

                await newRecorder.start((audioBase64, sr) => {
                  if (options.onSendAudio) {
                    const br = 16 * sr;
                    options.onSendAudio(audioBase64, sr, br);
                  }
                });

                setIsRecording(true);
                console.log("Recording resumed after audio playback");
              } catch (err) {
                console.error("Error resuming recording:", err);
              }
            }
          }, 500);
        }
      } catch (err) {
        console.error("Error playing audio chunk:", err);
        setError("Failed to play audio response");
        setIsPlayingAudio(false);
      }
    },
    [isRecording, isVoiceModeActive, options],
  );

  /**
   * Stop audio playback
   */
  const stopAudioPlayback = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
      setIsPlayingAudio(false);
      console.log("Audio playback stopped");
    }
  }, []);

  // Cleanup when voice mode is disabled
  useEffect(() => {
    if (!isVoiceModeActive) {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stop();
      }
      setIsRecording(false);
      setIsPlayingAudio(false);
    }
  }, [isVoiceModeActive]);

  return {
    isVoiceModeActive,
    isRecording,
    isPlayingAudio,
    isListening,
    error,
    startVoiceMode,
    stopVoiceMode,
    playAudioChunk,
    stopAudioPlayback,
  };
};
