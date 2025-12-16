/**
 * Audio utilities for WebSocket-based voice mode
 */

// Convert Float32Array PCM audio data to Int16Array
export function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

// Convert Int16Array to base64 string
export function int16ArrayToBase64(int16Array: Int16Array): string {
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

// Convert base64 string to Int16Array
export function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

// Convert Int16Array PCM to Float32Array for audio playback
export function int16ToFloat32(int16Array: Int16Array): Float32Array {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    const int16 = int16Array[i];
    float32Array[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
  }
  return float32Array;
}

// Resample audio from source sample rate to target sample rate using linear interpolation
export function resampleAudio(
  audioData: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number,
): Float32Array {
  if (sourceSampleRate === targetSampleRate) {
    return audioData;
  }

  const sampleRateRatio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(audioData.length / sampleRateRatio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const sourceIndex = i * sampleRateRatio;
    const indexFloor = Math.floor(sourceIndex);
    const indexCeil = Math.min(indexFloor + 1, audioData.length - 1);
    const fraction = sourceIndex - indexFloor;

    // Linear interpolation
    result[i] =
      audioData[indexFloor] * (1 - fraction) + audioData[indexCeil] * fraction;
  }

  return result;
}

// Audio recorder class for capturing microphone input and converting to PCM with silence detection

export class PCMAudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;
  private sampleRate: number;
  private actualSampleRate: number = 0; // Browser's actual sample rate
  private onAudioData:
    | ((audioBase64: string, sampleRate: number, isFinal?: boolean) => void)
    | null = null;
  private audioBuffer: Int16Array[] = [];
  private sendInterval = 200; // Send chunks every 200ms
  private lastSendTime = 0;

  constructor(sampleRate = 16000) {
    this.sampleRate = sampleRate;
  }

  /**
   * Start recording audio from microphone with continuous streaming
   */
  async start(
    onAudioData: (
      audioBase64: string,
      sampleRate: number,
      isFinal?: boolean,
    ) => void,
  ): Promise<void> {
    if (this.isRecording) {
      console.warn("Already recording");
      return;
    }

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: this.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context with the desired sample rate for better browser compatibility
      const AudioContextConstructor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioContext = new AudioContextConstructor();
      this.actualSampleRate = this.audioContext.sampleRate;
      console.log(
        `AudioContext created with sample rate: ${this.actualSampleRate}Hz`,
      );
      console.log(`Will resample to ${this.sampleRate}Hz for backend`);
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create script processor for audio processing
      const bufferSize = 4096;
      this.processor = this.audioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.onAudioData = onAudioData;

      // Reset state
      this.audioBuffer = [];
      this.lastSendTime = Date.now();

      // Process audio data with continuous streaming (no silence detection)
      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const currentTime = Date.now();

        // Resample from actual sample rate to target sample rate (16kHz)
        const resampledData = resampleAudio(
          inputData,
          this.actualSampleRate,
          this.sampleRate,
        );

        // Convert resampled audio to 16-bit PCM and buffer
        const pcmData = floatTo16BitPCM(resampledData);
        this.audioBuffer.push(pcmData);

        // Send chunks continuously at regular intervals (200ms)
        if (currentTime - this.lastSendTime >= this.sendInterval) {
          this.sendBufferedChunks();
          this.lastSendTime = currentTime;
        }
      };

      // Connect nodes
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isRecording = true;
      console.log("PCM audio recording started");
    } catch (error) {
      console.error("Error starting audio recording:", error);
      throw error;
    }
  }

  // Stop recording audio

  stop(): void {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;

    // Send any remaining buffered audio
    if (this.audioBuffer.length > 0 && this.onAudioData) {
      console.log("Sending final buffered audio on stop");
      this.sendBufferedChunks(true); // Mark as final chunk
    }

    // Disconnect and cleanup
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Reset state
    this.onAudioData = null;
    this.audioBuffer = [];

    console.log("PCM audio recording stopped");
  }

  // Check if currently recording
  getIsRecording(): boolean {
    return this.isRecording;
  }

  // Send buffered audio chunks continuously
  private sendBufferedChunks(isFinal: boolean = false): void {
    if (this.audioBuffer.length === 0 || !this.onAudioData) return;

    // Combine all buffered audio chunks (Int16Array chunks)
    const totalLength = this.audioBuffer.reduce(
      (sum, chunk) => sum + chunk.length,
      0,
    );
    const combinedAudio = new Int16Array(totalLength);

    let offset = 0;
    for (const chunk of this.audioBuffer) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to base64 using the buffer directly
    const base64Data = int16ArrayToBase64(combinedAudio);

    // Send data via callback with isFinal flag
    this.onAudioData(base64Data, this.sampleRate, isFinal);

    // Clear the buffer after sending
    this.audioBuffer = [];

    console.log(
      `Sent audio chunk: ${base64Data.length} chars, isFinal: ${isFinal}`,
    );
  }
}

// Audio player class for playing PCM audio received from server
export class PCMAudioPlayer {
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private onPlaybackEnd: (() => void) | null = null;

  constructor() {
    // Initialize audio context lazily
  }

  // Initialize audio context
  private async initAudioContext(): Promise<void> {
    if (!this.audioContext) {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioContext = new AudioContextConstructor();
    }

    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Add audio chunk to play queue
   */
  async addAudioChunk(base64Audio: string, sampleRate: number): Promise<void> {
    await this.initAudioContext();

    if (!this.audioContext) {
      console.error("Audio context not initialized");
      return;
    }

    try {
      // Convert base64 to PCM Int16Array
      const pcmData = base64ToInt16Array(base64Audio);

      // Convert to Float32Array for audio buffer
      const floatData = int16ToFloat32(pcmData);

      // Create audio buffer
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        floatData.length,
        sampleRate,
      );

      // Copy data to audio buffer
      audioBuffer.getChannelData(0).set(floatData);

      // Add to queue
      this.audioQueue.push(audioBuffer);

      // Start playback if not already playing
      if (!this.isPlaying) {
        this.playNext();
      }
    } catch (error) {
      console.error("Error adding audio chunk:", error);
    }
  }

  /**
   * Play next audio chunk in queue
   */
  private playNext(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      if (this.onPlaybackEnd) {
        this.onPlaybackEnd();
      }
      return;
    }

    if (!this.audioContext) {
      console.error("Audio context not initialized");
      return;
    }

    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift()!;

    // Create buffer source
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    this.currentSource.connect(this.audioContext.destination);

    // Play next chunk when this one ends
    this.currentSource.onended = () => {
      this.playNext();
    };

    this.currentSource.start();
  }

  /**
   * Stop playback and clear queue
   */
  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Ignore if already stopped
      }
      this.currentSource = null;
    }

    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Set callback for when playback ends
   */
  setOnPlaybackEnd(callback: () => void): void {
    this.onPlaybackEnd = callback;
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stop();
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}
