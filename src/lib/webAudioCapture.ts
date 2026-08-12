/**
 * Web Audio API helper for cross-browser microphone stream capture,
 * real-time voice activity volume analysis, and Groq Whisper API transcription.
 */

export interface AudioCaptureSession {
  stream: MediaStream;
  audioContext: AudioContext;
  analyserNode: AnalyserNode;
  mediaRecorder: MediaRecorder;
  stopAndTranscribe: (language?: string) => Promise<string>;
  cancel: () => void;
}

/**
 * Detect best supported MediaRecorder MIME type across Chrome, Safari, Firefox, Edge, Mobile
 */
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac',
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

/**
 * Post recorded audio blob to Groq Whisper transcription endpoint
 */
export async function transcribeAudioBlob(blob: Blob, language: string = 'hi'): Promise<string> {
  if (!blob || blob.size === 0) return '';

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;
        if (!base64Data) {
          resolve('');
          return;
        }

        const response = await fetch('/api/groq/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: blob.type || 'audio/webm',
            language,
          }),
        });

        if (!response.ok) {
          console.warn('Groq transcription API status:', response.status);
          resolve('');
          return;
        }

        const data = await response.json();
        resolve(data.text || '');
      } catch (err) {
        console.error('Audio transcription request failed:', err);
        resolve('');
      }
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
}

/**
 * Start capturing Web Audio stream from microphone with real-time volume detection & VAD (Voice Activity Detection)
 */
export async function startWebAudioCapture(
  onVolumeLevel?: (volume: number) => void,
  onSpeechDetected?: () => void,
  onSilenceAfterSpeech?: () => void,
  silenceDurationMs: number = 1500
): Promise<AudioCaptureSession | null> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia is not supported on this browser');
      return null;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Initialize Web Audio API Context & Analyser
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const sourceNode = audioContext.createMediaStreamSource(stream);
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.5;
    sourceNode.connect(analyserNode);

    // VAD State variables
    let animationFrameId: number | null = null;
    let silenceTimer: any = null;
    let hasUserSpoken = false;
    let speechNoticeFired = false;
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

    const checkVolume = () => {
      analyserNode.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Normalized volume score 0-100
      const normalizedVolume = Math.min(100, Math.round((average / 128) * 100));

      if (onVolumeLevel) {
        onVolumeLevel(normalizedVolume);
      }

      // Voice Activity Detection (VAD) Logic
      if (normalizedVolume >= 8) {
        hasUserSpoken = true;

        if (silenceTimer !== null) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }

        if (!speechNoticeFired) {
          speechNoticeFired = true;
          if (onSpeechDetected) onSpeechDetected();
        }
      } else if (normalizedVolume < 8 && hasUserSpoken) {
        if (silenceTimer === null) {
          silenceTimer = setTimeout(() => {
            hasUserSpoken = false;
            speechNoticeFired = false;
            silenceTimer = null;
            if (onSilenceAfterSpeech) {
              onSilenceAfterSpeech();
            }
          }, silenceDurationMs);
        }
      }

      animationFrameId = requestAnimationFrame(checkVolume);
    };

    checkVolume();

    // Initialize MediaRecorder
    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : undefined;
    const mediaRecorder = new MediaRecorder(stream, options);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start(100); // Collect slice every 100ms

    const cleanup = () => {
      if (silenceTimer !== null) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      try {
        audioContext.close();
      } catch (e) {}
    };

    const stopAndTranscribe = async (language: string = 'hi'): Promise<string> => {
      return new Promise<string>((resolve) => {
        if (mediaRecorder.state === 'inactive') {
          cleanup();
          const blob = new Blob(audioChunks, { type: mimeType || 'audio/webm' });
          transcribeAudioBlob(blob, language).then(resolve);
          return;
        }

        mediaRecorder.onstop = async () => {
          cleanup();
          const blob = new Blob(audioChunks, { type: mimeType || 'audio/webm' });
          const transcribedText = await transcribeAudioBlob(blob, language);
          resolve(transcribedText);
        };

        try {
          mediaRecorder.stop();
        } catch (e) {
          cleanup();
          resolve('');
        }
      });
    };

    const cancel = () => {
      try {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      } catch (e) {}
      cleanup();
    };

    return {
      stream,
      audioContext,
      analyserNode,
      mediaRecorder,
      stopAndTranscribe,
      cancel,
    };
  } catch (err) {
    console.error('Failed to start Web Audio Capture:', err);
    return null;
  }
}
