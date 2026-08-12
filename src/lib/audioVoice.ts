/**
 * Audio synthesis utility for Natural AI Voice ("Advocate Naya / Mera Wakeel AI").
 * Uses Gemini 3.1 Flash TTS API (`gemini-3.1-flash-tts-preview`) for studio-quality human voice,
 * with automatic fallback to browser SpeechSynthesis.
 */

let isCurrentlySpeaking = false;
let currentAudioCtx: AudioContext | null = null;
let currentBufferSource: AudioBufferSourceNode | null = null;
let currentAudioElement: HTMLAudioElement | null = null;

// Pre-load voices on module import for immediate access
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

/**
 * Stop any ongoing speech playback (both Gemini TTS & browser SpeechSynthesis)
 */
export function stopNaturalVoice() {
  isCurrentlySpeaking = false;

  if (currentBufferSource) {
    try {
      currentBufferSource.onended = null;
      currentBufferSource.stop();
    } catch (e) {}
    currentBufferSource = null;
  }

  if (currentAudioCtx) {
    try {
      currentAudioCtx.close();
    } catch (e) {}
    currentAudioCtx = null;
  }

  if (currentAudioElement) {
    try {
      currentAudioElement.onended = null;
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch (e) {}
    currentAudioElement = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

/**
 * Play PCM 24kHz 16-bit audio from Gemini TTS via Web Audio API
 */
function playPcmAudio(base64Pcm: string, sampleRate: number = 24000): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM buffer into Float32Array (-1.0 to 1.0)
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass({ sampleRate });
      currentAudioCtx = ctx;

      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch (e) {}
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentBufferSource = source;

      source.onended = () => {
        currentBufferSource = null;
        try { ctx.close(); } catch (e) {}
        currentAudioCtx = null;
        resolve(true);
      };

      source.start(0);
    } catch (err) {
      console.warn('PCM playback failed:', err);
      resolve(false);
    }
  });
}

/**
 * Helper to get available female/Indian voices in browser based on text script
 * Prioritizes natural neural voices (Microsoft Natural, Google Hindi, etc.)
 */
function getBestVoiceAndLang(
  text: string,
  preferredLanguage: 'hi' | 'en' | 'hinglish'
): { voice: SpeechSynthesisVoice | null; lang: string } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, lang: 'hi-IN' };
  }
  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length === 0) return { voice: null, lang: 'hi-IN' };

  const isDevanagari = /[\u0900-\u097F]/.test(text);

  // 1. Premium natural neural voices (Microsoft Natural, Google Neural)
  const naturalNeuralVoice = voices.find((v) => {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();
    return (
      (name.includes('natural') || name.includes('online') || name.includes('google')) &&
      (name.includes('hindi') || name.includes('हिन्दी') || lang.includes('hi'))
    );
  });

  // 2. Google Hindi voice
  const googleHindiVoice = voices.find((v) => {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();
    return name.includes('google') && (name.includes('hindi') || name.includes('हिन्दी') || lang.startsWith('hi'));
  });

  // 3. Indian English / Aditi / Swara / Kajal / Veena / Heera / Rishi
  const indianFemaleVoice = voices.find((v) => {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();
    return (
      (lang.includes('in') || lang.includes('hi') || lang.includes('en')) &&
      (name.includes('swara') ||
        name.includes('madhur') ||
        name.includes('aditi') ||
        name.includes('kajal') ||
        name.includes('heera') ||
        name.includes('veena') ||
        name.includes('rishi') ||
        name.includes('india'))
    );
  });

  // 4. Any Hindi voice
  const anyHindiVoice = voices.find((v) => {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();
    return lang.startsWith('hi') || name.includes('hindi') || name.includes('हिन्दी');
  });

  if (isDevanagari || preferredLanguage === 'hi') {
    if (naturalNeuralVoice) return { voice: naturalNeuralVoice, lang: 'hi-IN' };
    if (googleHindiVoice) return { voice: googleHindiVoice, lang: 'hi-IN' };
    if (indianFemaleVoice) return { voice: indianFemaleVoice, lang: 'hi-IN' };
    if (anyHindiVoice) return { voice: anyHindiVoice, lang: 'hi-IN' };
  }

  if (preferredLanguage === 'hinglish') {
    if (naturalNeuralVoice) return { voice: naturalNeuralVoice, lang: 'hi-IN' };
    if (googleHindiVoice) return { voice: googleHindiVoice, lang: 'hi-IN' };
    if (indianFemaleVoice) return { voice: indianFemaleVoice, lang: 'en-IN' };
    if (anyHindiVoice) return { voice: anyHindiVoice, lang: 'hi-IN' };
  }

  const anyIndian = voices.find((v) => v.lang.toUpperCase().includes('IN') || v.lang.toLowerCase().startsWith('hi'));
  if (anyIndian) return { voice: anyIndian, lang: anyIndian.lang };

  const defaultVoice = voices.find((v) => v.default) || voices[0];
  return { voice: defaultVoice, lang: defaultVoice ? defaultVoice.lang : 'hi-IN' };
}

/**
 * Fallback Web Speech Synthesis with natural cadence
 */
function speakWebSpeechFallback(
  cleanedText: string,
  language: 'hi' | 'en' | 'hinglish',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      resolve();
      return;
    }

    if (onStart) onStart();
    isCurrentlySpeaking = true;

    // Ensure speech synthesis is unpaused
    if (window.speechSynthesis.paused) {
      try { window.speechSynthesis.resume(); } catch (e) {}
    }

    const sentences = cleanedText
      .split(/(?<=[.!?।\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length === 0) {
      isCurrentlySpeaking = false;
      if (onEnd) onEnd();
      resolve();
      return;
    }

    let currentIndex = 0;

    const speakNext = () => {
      if (!isCurrentlySpeaking || currentIndex >= sentences.length) {
        isCurrentlySpeaking = false;
        if (onEnd) onEnd();
        resolve();
        return;
      }

      const currentSentence = sentences[currentIndex++];
      const { voice, lang } = getBestVoiceAndLang(currentSentence, language);
      const utterance = new SpeechSynthesisUtterance(currentSentence);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = lang;
      } else {
        utterance.lang = 'hi-IN';
      }

      // Natural speech cadence settings - smooth & slightly faster pace
      utterance.rate = 1.15;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (currentIndex < sentences.length && isCurrentlySpeaking) {
          setTimeout(speakNext, 30);
        } else {
          isCurrentlySpeaking = false;
          if (onEnd) onEnd();
          resolve();
        }
      };

      utterance.onerror = () => {
        if (currentIndex < sentences.length && isCurrentlySpeaking) {
          setTimeout(speakNext, 20);
        } else {
          isCurrentlySpeaking = false;
          if (onEnd) onEnd();
          resolve();
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        isCurrentlySpeaking = false;
        if (onEnd) onEnd();
        resolve();
      }
    };

    speakNext();
  });
}

/**
  * Fetch TTS audio chunk from server /api/tts endpoint
  */
async function fetchTtsChunk(
  textChunk: string,
  language: string,
  voice: string = 'Charon'
): Promise<{ audio: string; mimeType: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout per sentence chunk

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textChunk, language, voice }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.audio) {
        return { audio: data.audio, mimeType: data.mimeType || 'audio/mp3' };
      }
    }
  } catch (e) {
    // Timeout or network glitch
  }
  return null;
}

/**
 * Play a single audio chunk (PCM or MP3)
 */
async function playAudioChunk(audioData: { audio: string; mimeType: string }): Promise<boolean> {
  if (!isCurrentlySpeaking) return false;

  if (audioData.mimeType && audioData.mimeType.includes('pcm')) {
    return playPcmAudio(audioData.audio, 24000);
  }

  return new Promise<boolean>((resolve) => {
    try {
      const dataUrl = `data:${audioData.mimeType || 'audio/mp3'};base64,${audioData.audio}`;
      const audio = new Audio(dataUrl);
      currentAudioElement = audio;

      audio.onended = () => {
        currentAudioElement = null;
        resolve(true);
      };

      audio.onerror = () => {
        currentAudioElement = null;
        resolve(false);
      };

      audio.play().catch(() => {
        currentAudioElement = null;
        resolve(false);
      });
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Play text using natural AI voice.
 * Uses server-side Gemini 2.5 Flash / Google Natural Speech (/api/tts) with sentence chunking
 * for low-latency, studio-quality, consistent human speech playback on all devices.
 */
export async function speakNaturalMaleVoice(
  text: string,
  language: 'hi' | 'en' | 'hinglish' = 'hi',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  stopNaturalVoice();

  // Clean text of all symbols, markdown, bullet markers, disclaimers
  const cleanedText = text
    .replace(/\[\[.*?\]\]/gi, '')
    .replace(/Ye guidance sirf jaankari ke liye hai[^\.\n]*/gi, '')
    .replace(/This guidance is for informational purposes only[^\.\n]*/gi, '')
    .replace(/यह मार्गदर्शन केवल जानकारी के लिए है[^\.\n]*/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[*_#`~/\\]/g, ' ')
    .replace(/^[\s\-*•\d\.\)]+/gm, '')
    .replace(/\b\d+\.\s*/g, ' ')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedText) {
    if (onEnd) onEnd();
    return;
  }

  isCurrentlySpeaking = true;

  // Split into sentence-level chunks for sub-second start latency
  const rawSentences = cleanedText
    .split(/(?<=[.!?।\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (rawSentences.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  // Combine small sentences into ~150 char chunks for natural cadence
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    if ((currentChunk + ' ' + sentence).length <= 160) {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  try {
    // 1. Fetch first chunk immediately
    const firstChunkData = await fetchTtsChunk(chunks[0], language, 'Charon');

    if (firstChunkData && isCurrentlySpeaking) {
      let hasStarted = false;

      // Start prefetching remaining chunks while playing
      const chunkPromises = chunks.map((chunkText, idx) => {
        if (idx === 0) return Promise.resolve(firstChunkData);
        return fetchTtsChunk(chunkText, language, 'Charon');
      });

      for (let i = 0; i < chunks.length; i++) {
        if (!isCurrentlySpeaking) break;

        const chunkData = await chunkPromises[i];
        if (!chunkData) {
          // If a chunk fetch failed, break to fallback or continue
          continue;
        }

        if (!hasStarted) {
          hasStarted = true;
          if (onStart) onStart();
        }

        const playedOk = await playAudioChunk(chunkData);
        if (!playedOk) break;
      }

      if (hasStarted && isCurrentlySpeaking) {
        isCurrentlySpeaking = false;
        if (onEnd) onEnd();
        return;
      }
    }
  } catch (err) {
    console.warn('Server TTS pipeline error, falling back to Web Speech:', err);
  }

  // Fallback to Web Speech Synthesis if server TTS unavailable
  if (isCurrentlySpeaking) {
    await speakWebSpeechFallback(cleanedText, language, onStart, onEnd);
  }
}

// Export alias for natural female voice
export const speakNaturalFemaleVoice = speakNaturalMaleVoice;

