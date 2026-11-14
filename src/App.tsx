import { useCallback, useEffect, useRef, useState } from 'react';
import { EditSentencesScreen } from './components/EditSentencesScreen';
import { FinishScreen } from './components/FinishScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { SentenceListScreen } from './components/SentenceListScreen';
import { StartScreen } from './components/StartScreen';
import { VideoStage } from './components/VideoStage';
import {
  createEmptyProgress,
  DEFAULT_SENTENCES,
  loadProgress,
  loadSentences,
  saveProgress,
  saveSentences,
} from './data/initialSentences';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useSpeechCheck } from './hooks/useSpeechCheck';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import {
  PlaybackSpeed,
  PracticeStep,
  ScreenName,
  SelfCheckRating,
  Sentence,
  SentenceProgress,
} from './types';

const YT_CONTAINER_ID = 'yt-shadowing-player';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('start');
  const [prevScreen, setPrevScreen] = useState<ScreenName>('start');
  const [sentences, setSentences] = useState<Sentence[]>(() => loadSentences());
  const [progressMap, setProgressMap] = useState<Record<number, SentenceProgress>>(
    () => loadProgress()
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeStep, setActiveStep] = useState<PracticeStep>(1);
  const [hideText, setHideText] = useState(true);
  const [hideMeaning, setHideMeaning] = useState(false);

  const hasVideoScreen =
    screen === 'list' || screen === 'practice' || screen === 'edit';

  const yt = useYouTubePlayer(YT_CONTAINER_ID, hasVideoScreen);
  const recorder = useAudioRecorder();
  const speechCheck = useSpeechCheck();

  const recordEndTimerRef = useRef<number | null>(null);
  const activeStepRef = useRef(activeStep);
  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  const clearRecordEndTimer = useCallback(() => {
    if (recordEndTimerRef.current !== null) {
      window.clearTimeout(recordEndTimerRef.current);
      recordEndTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearRecordEndTimer();
  }, [clearRecordEndTimer]);

  const stopAllMedia = useCallback(() => {
    clearRecordEndTimer();
    yt.stopSegment();
    recorder.stopRecording();
    recorder.stopMyVoice();
    speechCheck.stopCheck();
  }, [clearRecordEndTimer, yt, recorder, speechCheck]);

  const handleSaveSentences = useCallback((next: Sentence[]) => {
    setSentences(next);
    saveSentences(next);
    setCurrentIndex((prev) => {
      if (next.length === 0) return 0;
      return Math.min(prev, next.length - 1);
    });
  }, []);

  const handleResetDefaults = useCallback(() => {
    handleSaveSentences(DEFAULT_SENTENCES);
  }, [handleSaveSentences]);

  const updateSentenceProgress = useCallback(
    (
      sentenceId: number,
      updater: (prev: SentenceProgress) => SentenceProgress
    ) => {
      setProgressMap((prev) => {
        const current = prev[sentenceId] ?? createEmptyProgress(sentenceId);
        const updated = updater(current);
        const nextMap = { ...prev, [sentenceId]: updated };
        saveProgress(nextMap);
        return nextMap;
      });
    },
    []
  );

  const navigateTo = useCallback(
    (nextScreen: ScreenName) => {
      stopAllMedia();
      setScreen((current) => {
        if (current !== nextScreen) {
          setPrevScreen(current);
        }
        return nextScreen;
      });
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    [stopAllMedia]
  );

  const openPracticeAt = useCallback(
    (index: number) => {
      stopAllMedia();
      const safeIndex = Math.max(0, Math.min(index, Math.max(0, sentences.length - 1)));
      setCurrentIndex(safeIndex);
      setActiveStep(1);
      setHideText(true);
      setScreen((current) => {
        if (current !== 'practice') {
          setPrevScreen(current);
        }
        return 'practice';
      });
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    [stopAllMedia, sentences.length]
  );

  const currentSentence = sentences[currentIndex] ?? null;

  const handleSelectStep = useCallback((step: PracticeStep) => {
    setActiveStep(step);
    setHideText(step !== 3);
  }, []);

  const handlePlayOriginal = useCallback(() => {
    if (!currentSentence) return;
    recorder.stopMyVoice();
    updateSentenceProgress(currentSentence.id, (prev) => ({
      ...prev,
      plays: prev.plays + 1,
    }));
    yt.playSegment(currentSentence.start, currentSentence.end, {
      allowLoop: true,
    });
  }, [currentSentence, recorder, updateSentenceProgress, yt]);

  const handleRecord = useCallback(async () => {
    if (!currentSentence) return;
    clearRecordEndTimer();
    yt.stopSegment();
    recorder.stopMyVoice();
    speechCheck.stopCheck();

    const clipDurationMs = Math.max(
      1000,
      ((currentSentence.end - currentSentence.start) / yt.speed) * 1000
    );

    const onRecordingSaved = (sentenceId: number) => {
      updateSentenceProgress(sentenceId, (prev) => {
        const nextStatus =
          prev.status === 'done' || activeStepRef.current === 4
            ? 'done'
            : 'practiced';
        return {
          ...prev,
          recordings: prev.recordings + 1,
          status: nextStatus,
        };
      });
    };

    // Record user voice cleanly without playing the video
    await recorder.startRecording(
      currentSentence.id,
      Math.max(10000, clipDurationMs + 8000),
      onRecordingSaved
    );
  }, [
    currentSentence,
    clearRecordEndTimer,
    yt,
    recorder,
    speechCheck,
    updateSentenceProgress,
  ]);

  const handleStopRecordingEarly = useCallback(() => {
    clearRecordEndTimer();
    yt.stopSegment();
    recorder.stopRecording();
  }, [clearRecordEndTimer, yt, recorder]);

  const handleRateSelfCheck = useCallback(
    (questionIndex: 0 | 1 | 2, rating: SelfCheckRating) => {
      if (!currentSentence) return;
      updateSentenceProgress(currentSentence.id, (prev) => {
        const nextCheck: [SelfCheckRating, SelfCheckRating, SelfCheckRating] = [
          ...prev.selfCheck,
        ] as [SelfCheckRating, SelfCheckRating, SelfCheckRating];
        nextCheck[questionIndex] = rating;
        return {
          ...prev,
          selfCheck: nextCheck,
        };
      });
    },
    [currentSentence, updateSentenceProgress]
  );

  const handleChangeSpeed = useCallback(
    (nextSpeed: PlaybackSpeed) => {
      yt.setSpeed(nextSpeed);
    },
    [yt]
  );

  const handlePrevSentence = useCallback(() => {
    if (currentIndex <= 0) return;
    openPracticeAt(currentIndex - 1);
  }, [currentIndex, openPracticeAt]);

  const handleNextSentence = useCallback(() => {
    if (currentIndex >= sentences.length - 1) {
      navigateTo('finish');
      return;
    }
    openPracticeAt(currentIndex + 1);
  }, [currentIndex, sentences.length, navigateTo, openPracticeAt]);

  return (
    <div className="min-h-dvh w-full bg-[#F4EFEA] flex justify-center">
      <main className="w-full max-w-[480px] min-h-dvh bg-[#FAF8F6] sm:border-x sm:border-[#EAE1DE] sm:shadow-sm flex flex-col">
        {hasVideoScreen && (
          <VideoStage
            containerId={YT_CONTAINER_ID}
            embedError={yt.embedError}
            isLoopWaiting={yt.isLoopWaiting}
          />
        )}

        {screen === 'start' && (
          <StartScreen
            sentenceCount={sentences.length}
            onStartPractice={() => navigateTo('list')}
            onOpenEdit={() => navigateTo('edit')}
          />
        )}

        {screen === 'list' && (
          <SentenceListScreen
            sentences={sentences}
            progressMap={progressMap}
            hideText={hideText}
            onToggleHideText={() => setHideText((v) => !v)}
            onSelectSentence={(idx) => openPracticeAt(idx)}
            onBackStart={() => navigateTo('start')}
            onOpenEdit={() => navigateTo('edit')}
            onOpenFinish={() => navigateTo('finish')}
          />
        )}

        {screen === 'practice' && currentSentence && (
          <PracticeScreen
            sentence={currentSentence}
            sentenceIndex={currentIndex}
            totalSentences={sentences.length}
            progress={
              progressMap[currentSentence.id] ??
              createEmptyProgress(currentSentence.id)
            }
            activeStep={activeStep}
            hideText={hideText}
            hideMeaning={hideMeaning}
            isPlayingSegment={yt.isPlayingSegment}
            isLoopWaiting={yt.isLoopWaiting}
            loopEnabled={yt.loopEnabled}
            speed={yt.speed}
            embedError={yt.embedError}
            recording={recorder.recordings[currentSentence.id]}
            isRecording={recorder.isRecording}
            micDenied={recorder.micDenied}
            playingVoiceId={recorder.playingVoiceId}
            speechSupported={speechCheck.isSupported}
            isSpeechListening={speechCheck.isListening}
            wordCheckResult={speechCheck.resultsBySentence[currentSentence.id]}
            speechStatusMessage={speechCheck.statusMessage}
            onSelectStep={handleSelectStep}
            onToggleHideText={() => setHideText((v) => !v)}
            onToggleHideMeaning={() => setHideMeaning((v) => !v)}
            onPlayOriginal={handlePlayOriginal}
            onStopPlayback={yt.stopSegment}
            onToggleLoop={() => yt.setLoopEnabled((v) => !v)}
            onChangeSpeed={handleChangeSpeed}
            onRecord={handleRecord}
            onStopRecording={handleStopRecordingEarly}
            onPlayMyVoice={() => recorder.playMyVoice(currentSentence.id)}
            onRateSelfCheck={handleRateSelfCheck}
            onStartWordCheck={() =>
              speechCheck.startCheck(currentSentence.id, currentSentence.text)
            }
            onStopWordCheck={speechCheck.stopCheck}
            onPrevSentence={handlePrevSentence}
            onNextSentence={handleNextSentence}
            onBackToList={() => navigateTo('list')}
          />
        )}

        {screen === 'practice' && !currentSentence && (
          <div className="p-6 text-center flex flex-col items-center gap-4">
            <p className="text-[18px] font-medium text-[#1F1A1C]">
              No sentences yet. Tap Edit Sentences to add some.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('edit')}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#C93B68] text-white font-semibold cursor-pointer"
            >
              Edit Sentences / 문장 편집
            </button>
          </div>
        )}

        {screen === 'edit' && (
          <EditSentencesScreen
            sentences={sentences}
            currentTime={yt.currentTime}
            getAccurateCurrentTime={yt.getAccurateCurrentTime}
            onTestSegment={(start, end) =>
              yt.playSegment(start, end, { allowLoop: false })
            }
            onSaveSentences={handleSaveSentences}
            onResetDefaults={handleResetDefaults}
            onBack={() =>
              navigateTo(prevScreen === 'start' ? 'start' : 'list')
            }
          />
        )}

        {screen === 'finish' && (
          <FinishScreen
            sentences={sentences}
            progressMap={progressMap}
            onPracticeSentence={(idx) => openPracticeAt(idx)}
            onBack={() =>
              navigateTo(
                prevScreen === 'practice' && sentences.length > 0
                  ? 'practice'
                  : 'list'
              )
            }
            onBackToList={() => navigateTo('list')}
            onBackToStart={() => navigateTo('start')}
          />
        )}
      </main>
    </div>
  );
}
