import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioRecording } from '../types';

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch {
      // Ignore
    }
  }
  return '';
}

export function useAudioRecorder() {
  const [recordings, setRecordings] = useState<Record<number, AudioRecording>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSentenceId, setRecordingSentenceId] = useState<number | null>(null);
  const [micDenied, setMicDenied] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimeoutRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const recordingsRef = useRef(recordings);

  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

  const stopMyVoice = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
      audioElRef.current = null;
    }
    setPlayingVoiceId(null);
  }, []);

  const stopRecording = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
  }, []);

  const startRecording = useCallback(
    async (
      sentenceId: number,
      autoStopAfterMs: number,
      onSaved?: (sentenceId: number) => void
    ): Promise<boolean> => {
      stopMyVoice();
      stopRecording();

      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setMicDenied(true);
        return false;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setMicDenied(false);

        const mimeType = pickSupportedMimeType();
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const finalType = recorder.mimeType || mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: finalType });
          const url = URL.createObjectURL(blob);

          setRecordings((prev) => {
            const old = prev[sentenceId];
            if (old?.url) {
              URL.revokeObjectURL(old.url);
            }
            return {
              ...prev,
              [sentenceId]: {
                url,
                mimeType: finalType,
                recordedAt: Date.now(),
              },
            };
          });

          // Release mic tracks cleanly after each recording
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          mediaRecorderRef.current = null;
          setIsRecording(false);
          setRecordingSentenceId(null);
          onSaved?.(sentenceId);
        };

        recorder.start();
        setIsRecording(true);
        setRecordingSentenceId(sentenceId);

        stopTimeoutRef.current = window.setTimeout(() => {
          stopRecording();
        }, Math.max(1500, autoStopAfterMs));

        return true;
      } catch {
        setMicDenied(true);
        setIsRecording(false);
        setRecordingSentenceId(null);
        return false;
      }
    },
    [stopMyVoice, stopRecording]
  );

  const playMyVoice = useCallback(
    (sentenceId: number) => {
      const rec = recordingsRef.current[sentenceId];
      if (!rec) return;

      if (playingVoiceId === sentenceId) {
        stopMyVoice();
        return;
      }

      stopMyVoice();
      const audio = new Audio(rec.url);
      audioElRef.current = audio;
      setPlayingVoiceId(sentenceId);

      audio.onended = () => {
        setPlayingVoiceId(null);
        audioElRef.current = null;
      };
      audio.onerror = () => {
        setPlayingVoiceId(null);
        audioElRef.current = null;
      };

      audio.play().catch(() => {
        setPlayingVoiceId(null);
      });
    },
    [playingVoiceId, stopMyVoice]
  );

  useEffect(() => {
    return () => {
      stopMyVoice();
      stopRecording();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(recordingsRef.current).forEach((rec) => {
        if (rec.url) URL.revokeObjectURL(rec.url);
      });
    };
  }, [stopMyVoice, stopRecording]);

  return {
    recordings,
    isRecording,
    recordingSentenceId,
    micDenied,
    playingVoiceId,
    startRecording,
    stopRecording,
    playMyVoice,
    stopMyVoice,
  };
}
