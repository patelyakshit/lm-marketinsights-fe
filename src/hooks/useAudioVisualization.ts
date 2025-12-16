import { useState, useEffect, useRef, useCallback } from "react";

interface AudioVisualizationHook {
  audioLevels: number[];
  isAnalyzing: boolean;
  startAnalysis: () => Promise<void>;
  stopAnalysis: () => void;
  error: string | null;
}

const useAudioVisualization = (
  barCount: number = 46,
): AudioVisualizationHook => {
  const [audioLevels, setAudioLevels] = useState<number[]>(
    Array(barCount).fill(2), // Default height of 2px
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Create frequency bands for visualization
    const frequencyBands = barCount;
    const bandSize = Math.floor(dataArrayRef.current.length / frequencyBands);
    const newLevels: number[] = [];

    for (let i = 0; i < frequencyBands; i++) {
      const start = i * bandSize;
      const end = start + bandSize;

      let sum = 0;
      for (let j = start; j < end && j < dataArrayRef.current.length; j++) {
        sum += dataArrayRef.current[j];
      }
      const average = sum / bandSize;

      const height = Math.max(2, Math.min(20, (average / 255) * 18 + 2));
      newLevels.push(Math.round(height));
    }

    setAudioLevels(newLevels);

    if (isAnalyzing) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [barCount, isAnalyzing]);

  const startAnalysis = useCallback(async () => {
    try {
      setError(null);

      if (!window.isSecureContext && window.location.protocol !== "https:") {
        console.warn("Audio analysis requires HTTPS context");
        setError("Audio visualization requires HTTPS");
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("getUserMedia not supported");
        setError("Microphone access not supported");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      // Create audio context with better error handling
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      } catch (audioContextError) {
        console.error("Failed to create AudioContext:", audioContextError);
        setError("Audio context not supported");
        return;
      }

      // Check if AudioContext is suspended (common on mobile)
      if (audioContextRef.current.state === "suspended") {
        try {
          await audioContextRef.current.resume();
        } catch (resumeError) {
          console.error("Failed to resume AudioContext:", resumeError);
          setError("Audio context suspended");
          return;
        }
      }

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; // Higher resolution for better visualization
      analyserRef.current.smoothingTimeConstant = 0.8;

      sourceRef.current =
        audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      setIsAnalyzing(true);
    } catch (err) {
      console.error("Error starting audio analysis:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to access microphone";

      // Provide more specific error messages
      if (errorMessage.includes("Permission denied")) {
        setError(
          "Microphone permission denied. Please allow microphone access.",
        );
      } else if (errorMessage.includes("NotAllowedError")) {
        setError(
          "Microphone access denied. Please check your browser permissions.",
        );
      } else if (errorMessage.includes("NotFoundError")) {
        setError("No microphone found. Please connect a microphone.");
      } else {
        setError(`Failed to access microphone: ${errorMessage}`);
      }
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;

    // Reset to default levels
    setAudioLevels(Array(barCount).fill(2));
  }, [barCount]);

  useEffect(() => {
    if (isAnalyzing && analyserRef.current && dataArrayRef.current) {
      analyzeAudio();
    }
  }, [isAnalyzing, analyzeAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, [stopAnalysis]);

  return {
    audioLevels,
    isAnalyzing,
    startAnalysis,
    stopAnalysis,
    error,
  };
};

export default useAudioVisualization;
