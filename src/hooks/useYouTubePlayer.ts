import { useCallback, useEffect, useRef, useState } from 'react';
import { MOVIE_CONFIG, PlaybackSpeed } from '../types';

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  setPlaybackRate: (suggestedRate: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

interface PlaySegmentOptions {
  allowLoop?: boolean;
  onSegmentEnd?: () => void;
}

export function useYouTubePlayer(containerId: string, enabled: boolean) {
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);
  const activeSegmentRef = useRef<{
    start: number;
    end: number;
    allowLoop: boolean;
    onSegmentEnd?: () => void;
  } | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [isPlayingSegment, setIsPlayingSegment] = useState(false);
  const [isLoopWaiting, setIsLoopWaiting] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(MOVIE_CONFIG.practiceStart);

  const loopEnabledRef = useRef(loopEnabled);
  useEffect(() => {
    loopEnabledRef.current = loopEnabled;
  }, [loopEnabled]);

  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const clearTimers = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (loopTimeoutRef.current !== null) {
      window.clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  }, []);

  const stopSegment = useCallback(() => {
    clearTimers();
    activeSegmentRef.current = null;
    setIsPlayingSegment(false);
    setIsLoopWaiting(false);
    try {
      playerRef.current?.pauseVideo();
    } catch {
      // Ignore if player is not initialized yet
    }
  }, [clearTimers]);

  // Initialize official YouTube IFrame Player API once container is active
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const initPlayer = () => {
      if (cancelled || playerRef.current || !window.YT?.Player) return;
      const el = document.getElementById(containerId);
      if (!el) return;

      playerRef.current = new window.YT.Player(containerId, {
        videoId: MOVIE_CONFIG.videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          start: MOVIE_CONFIG.practiceStart,
          end: MOVIE_CONFIG.practiceEnd,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1,
          cc_load_policy: 0,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            setIsReady(true);
            try {
              event.target.setPlaybackRate(speedRef.current);
            } catch {
              // Ignore
            }
          },
          onStateChange: (event) => {
            if (cancelled) return;
            // Track current time gently when user scrubs manually
            if (event.data === 2 || event.data === 0) {
              try {
                const t = event.target.getCurrentTime();
                if (typeof t === 'number' && !Number.isNaN(t)) {
                  setCurrentTime(Math.round(t * 10) / 10);
                }
              } catch {
                // Ignore
              }
            }
          },
          onError: (event) => {
            if (cancelled) return;
            // 101 & 150 = embedding disabled by owner; 100 = video not found/private
            if (event.data === 101 || event.data === 150 || event.data === 100) {
              setEmbedError(true);
              clearTimers();
              setIsPlayingSegment(false);
              setIsLoopWaiting(false);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        initPlayer();
      };

      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        tag.onerror = () => {
          if (!cancelled) setEmbedError(true);
        };
        document.head.appendChild(tag);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [containerId, enabled, clearTimers]);

  // Keep currentTime updated periodically while mounted so "Set Start/End = now" is instant
  useEffect(() => {
    if (!enabled || !isReady || embedError) return;
    const id = window.setInterval(() => {
      try {
        const t = playerRef.current?.getCurrentTime();
        if (typeof t === 'number' && !Number.isNaN(t)) {
          setCurrentTime(Math.round(t * 10) / 10);
        }
      } catch {
        // Ignore
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [enabled, isReady, embedError]);

  useEffect(() => {
    return () => {
      clearTimers();
      try {
        playerRef.current?.destroy();
      } catch {
        // Ignore
      }
      playerRef.current = null;
    };
  }, [clearTimers]);

  const startPollingSegment = useCallback(
    (start: number, end: number, allowLoop: boolean, onSegmentEnd?: () => void) => {
      clearTimers();
      activeSegmentRef.current = { start, end, allowLoop, onSegmentEnd };
      setIsPlayingSegment(true);
      setIsLoopWaiting(false);

      const player = playerRef.current;
      if (!player) return;

      try {
        player.setPlaybackRate(speedRef.current);
        player.seekTo(start, true);
        player.playVideo();
      } catch {
        // Ignore
      }

      const startedAt = Date.now();

      pollIntervalRef.current = window.setInterval(() => {
        const currentPlayer = playerRef.current;
        if (!currentPlayer || !activeSegmentRef.current) return;

        let t = start;
        try {
          t = currentPlayer.getCurrentTime();
          if (typeof t === 'number' && !Number.isNaN(t)) {
            setCurrentTime(Math.round(t * 10) / 10);
          }
        } catch {
          return;
        }

        // Wait at least 350ms after seekTo so stale getCurrentTime doesn't prematurely end
        const elapsedMs = Date.now() - startedAt;
        if (elapsedMs > 350 && t >= end) {
          try {
            currentPlayer.pauseVideo();
          } catch {
            // Ignore
          }
          clearTimers();

          const shouldLoop = allowLoop && loopEnabledRef.current;
          if (shouldLoop) {
            setIsLoopWaiting(true);
            loopTimeoutRef.current = window.setTimeout(() => {
              if (!activeSegmentRef.current || !loopEnabledRef.current) {
                setIsPlayingSegment(false);
                setIsLoopWaiting(false);
                return;
              }
              startPollingSegment(start, end, allowLoop, onSegmentEnd);
            }, 1500);
          } else {
            activeSegmentRef.current = null;
            setIsPlayingSegment(false);
            setIsLoopWaiting(false);
            onSegmentEnd?.();
          }
        }
      }, 100);
    },
    [clearTimers]
  );

  const playSegment = useCallback(
    (start: number, end: number, options?: PlaySegmentOptions) => {
      const safeEnd = end > start ? end : start + 1.5;
      const allowLoop = options?.allowLoop ?? true;
      startPollingSegment(start, safeEnd, allowLoop, options?.onSegmentEnd);
    },
    [startPollingSegment]
  );

  const setSpeed = useCallback((nextSpeed: PlaybackSpeed) => {
    setSpeedState(nextSpeed);
    try {
      playerRef.current?.setPlaybackRate(nextSpeed);
    } catch {
      // Ignore
    }
  }, []);

  const getAccurateCurrentTime = useCallback((): number => {
    try {
      const t = playerRef.current?.getCurrentTime();
      if (typeof t === 'number' && !Number.isNaN(t)) {
        return Math.round(t * 10) / 10;
      }
    } catch {
      // Ignore
    }
    return currentTime;
  }, [currentTime]);

  return {
    isReady,
    embedError,
    isPlayingSegment,
    isLoopWaiting,
    loopEnabled,
    setLoopEnabled,
    speed,
    setSpeed,
    currentTime,
    getAccurateCurrentTime,
    playSegment,
    stopSegment,
  };
}
