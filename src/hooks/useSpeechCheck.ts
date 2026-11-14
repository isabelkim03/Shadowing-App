import { useCallback, useMemo, useRef, useState } from 'react';
import { WordCheckResult } from '../types';

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function evaluateSpeechMatch(targetSentence: string, spokenTranscript: string): WordCheckResult {
  const rawTokens = targetSentence.trim().split(/\s+/).filter(Boolean);
  const spokenNormalized = spokenTranscript
    .trim()
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  // Track counts so repeated words are matched fairly
  const remainingCounts = new Map<string, number>();
  for (const w of spokenNormalized) {
    remainingCounts.set(w, (remainingCounts.get(w) ?? 0) + 1);
  }

  let matchedCount = 0;
  const tokens = rawTokens.map((display) => {
    const norm = normalizeWord(display);
    const available = remainingCounts.get(norm) ?? 0;
    const matched = norm.length > 0 && available > 0;
    if (matched) {
      remainingCounts.set(norm, available - 1);
      matchedCount += 1;
    }
    return { display, matched };
  });

  return {
    transcript: spokenTranscript,
    matchedCount,
    totalCount: rawTokens.length,
    tokens,
  };
}

export function useSpeechCheck() {
  const isSupported = useMemo(() => getSpeechRecognitionCtor() !== null, []);
  const [isListening, setIsListening] = useState(false);
  const [resultsBySentence, setResultsBySentence] = useState<Record<number, WordCheckResult>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const stopCheck = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore
    }
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startCheck = useCallback(
    (sentenceId: number, targetSentence: string) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) return;

      stopCheck();
      setStatusMessage(null);

      try {
        const recognition = new Ctor();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;
        recognitionRef.current = recognition;

        let gotResult = false;

        recognition.onresult = (event) => {
          gotResult = true;
          const parts: string[] = [];
          for (let i = 0; i < event.results.length; i += 1) {
            const alt = event.results[i]?.[0]?.transcript;
            if (alt) parts.push(alt);
          }
          const transcript = parts.join(' ').trim();
          const evaluation = evaluateSpeechMatch(targetSentence, transcript);
          setResultsBySentence((prev) => ({
            ...prev,
            [sentenceId]: evaluation,
          }));
        };

        recognition.onerror = (event) => {
          if (event.error === 'not-allowed') {
            setStatusMessage('Mic permission is needed for word check.');
          } else if (event.error === 'no-speech') {
            setStatusMessage('No speech heard. Tap Check My Words and try again!');
          } else {
            setStatusMessage('Could not hear clearly. Try again when ready!');
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          if (!gotResult && !statusMessage) {
            setIsListening(false);
          } else {
            setIsListening(false);
          }
          recognitionRef.current = null;
        };

        setIsListening(true);
        recognition.start();
      } catch {
        setIsListening(false);
        setStatusMessage('Speech check is unavailable right now.');
      }
    },
    [stopCheck, statusMessage]
  );

  const clearResultForSentence = useCallback((sentenceId: number) => {
    setResultsBySentence((prev) => {
      if (!(sentenceId in prev)) return prev;
      const copy = { ...prev };
      delete copy[sentenceId];
      return copy;
    });
    setStatusMessage(null);
  }, []);

  return {
    isSupported,
    isListening,
    resultsBySentence,
    statusMessage,
    startCheck,
    stopCheck,
    clearResultForSentence,
  };
}
