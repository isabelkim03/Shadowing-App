import { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Mic,
  Pause,
  Play,
  Repeat,
  Square,
  Volume2,
} from 'lucide-react';
import {
  AudioRecording,
  PlaybackSpeed,
  PracticeStep,
  SelfCheckRating,
  Sentence,
  SentenceProgress,
  WordCheckResult,
} from '../types';

interface PracticeScreenProps {
  sentence: Sentence;
  sentenceIndex: number;
  totalSentences: number;
  progress: SentenceProgress;
  activeStep: PracticeStep;
  hideText: boolean;
  hideMeaning: boolean;
  isPlayingSegment: boolean;
  isLoopWaiting: boolean;
  loopEnabled: boolean;
  speed: PlaybackSpeed;
  embedError: boolean;
  recording: AudioRecording | undefined;
  isRecording: boolean;
  micDenied: boolean;
  playingVoiceId: number | null;
  speechSupported: boolean;
  isSpeechListening: boolean;
  wordCheckResult: WordCheckResult | undefined;
  speechStatusMessage: string | null;
  onSelectStep: (step: PracticeStep) => void;
  onToggleHideText: () => void;
  onToggleHideMeaning: () => void;
  onPlayOriginal: () => void;
  onStopPlayback: () => void;
  onToggleLoop: () => void;
  onChangeSpeed: (speed: PlaybackSpeed) => void;
  onRecord: () => void;
  onStopRecording: () => void;
  onPlayMyVoice: () => void;
  onRateSelfCheck: (questionIndex: 0 | 1 | 2, rating: SelfCheckRating) => void;
  onStartWordCheck: () => void;
  onStopWordCheck: () => void;
  onPrevSentence: () => void;
  onNextSentence: () => void;
  onBackToList: () => void;
}

const STEP_CONFIG: Array<{
  step: PracticeStep;
  title: string;
  koTitle: string;
  instructionEn: string;
  instructionKo: string;
}> = [
  {
    step: 1,
    title: 'Step 1 Listen',
    koTitle: '1. 듣기',
    instructionEn: 'Keep the text hidden and just listen 2–3 times.',
    instructionKo: '문장을 가린 채로 소리만 2~3번 집중해서 들어보세요.',
  },
  {
    step: 2,
    title: 'Step 2 Mumble',
    koTitle: '2. 웅얼거리기',
    instructionEn: 'Keep the text hidden and quietly follow the sound.',
    instructionKo: '문장을 보지 않고 들리는 리듬을 작게 따라해 보세요.',
  },
  {
    step: 3,
    title: 'Step 3 Read & Shadow',
    koTitle: '3. 보고 쉐도잉',
    instructionEn: 'Look at the bold stress words and speak with the video.',
    instructionKo: '굵은 강세 단어를 보며 영상과 동시에 말해보세요.',
  },
  {
    step: 4,
    title: 'Step 4 Shadow',
    koTitle: '4. 실전 쉐도잉',
    instructionEn: 'Hide the text and speak right alongside the actor.',
    instructionKo: '문장을 가리고 배우와 똑같은 속도로 말해보세요.',
  },
];

const SELF_CHECK_QUESTIONS: Array<{ en: string; ko: string }> = [
  {
    en: 'Did I keep up with the speed?',
    ko: '영상 속도를 잘 따라갔나요?',
  },
  {
    en: 'Did I stress the bold words?',
    ko: '굵게 표시된 단어에 강세를 주었나요?',
  },
  {
    en: 'Did my voice go up and down like the actor?',
    ko: '배우처럼 억양의 높낮이를 살렸나요?',
  },
];

const RATING_OPTIONS: Array<{
  value: Exclude<SelfCheckRating, null>;
  emoji: string;
  label: string;
}> = [
  { value: 'good', emoji: '😀', label: 'Good' },
  { value: 'okay', emoji: '🙂', label: 'Okay' },
  { value: 'tricky', emoji: '😐', label: 'Try again' },
];

function renderHighlightedText(text: string, stressWords: string[]) {
  const normalizedStress = new Set(
    stressWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean)
  );

  const tokens = text.split(/(\s+)/);
  return tokens.map((token, i) => {
    if (/^\s+$/.test(token)) {
      return <span key={i}>{token}</span>;
    }
    const clean = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isStress = clean.length > 0 && normalizedStress.has(clean);
    if (isStress) {
      return (
        <strong
          key={i}
          className="font-bold text-[#1F1A1C] bg-[#FFF2B2] px-1 rounded underline decoration-[#E0A800] decoration-2 underline-offset-4"
        >
          {token}
        </strong>
      );
    }
    return (
      <span key={i} className="font-normal text-[#352E31]">
        {token}
      </span>
    );
  });
}

export function PracticeScreen({
  sentence,
  sentenceIndex,
  totalSentences,
  progress,
  activeStep,
  hideText,
  hideMeaning,
  isPlayingSegment,
  isLoopWaiting,
  loopEnabled,
  speed,
  recording,
  isRecording,
  micDenied,
  playingVoiceId,
  speechSupported,
  isSpeechListening,
  wordCheckResult,
  speechStatusMessage,
  onSelectStep,
  onToggleHideText,
  onToggleHideMeaning,
  onPlayOriginal,
  onStopPlayback,
  onToggleLoop,
  onChangeSpeed,
  onRecord,
  onStopRecording,
  onPlayMyVoice,
  onRateSelfCheck,
  onStartWordCheck,
  onStopWordCheck,
  onPrevSentence,
  onNextSentence,
  onBackToList,
}: PracticeScreenProps) {
  const currentStepInfo =
    STEP_CONFIG.find((s) => s.step === activeStep) ?? STEP_CONFIG[0];
  const hasRecorded = Boolean(recording) || progress.recordings > 0;
  const selfCheckRef = useRef<HTMLDivElement | null>(null);

  // Gently bring self-check into view right after first recording completes
  const prevRecordingCountRef = useRef(progress.recordings);
  useEffect(() => {
    if (progress.recordings > prevRecordingCountRef.current) {
      selfCheckRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevRecordingCountRef.current = progress.recordings;
  }, [progress.recordings]);

  const isPlayingMyVoice = playingVoiceId === sentence.id;

  return (
    <div className="px-4 py-4 flex flex-col gap-4 pb-8">
      {/* Top Counter & Navigation Row */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToList}
          className="min-h-[48px] px-3.5 py-2 rounded-xl bg-white border border-[#EAE1DE] hover:bg-[#FDF1F5] text-[#1F1A1C] inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#9D244B] shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-start leading-tight text-left">
            <span className="text-[14px] font-semibold">Back</span>
            <span className="text-[11px] text-[#5E5458]">뒤로</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrevSentence}
            disabled={sentenceIndex === 0}
            aria-label="Previous sentence"
            className="min-w-[48px] min-h-[48px] rounded-xl bg-white border border-[#EAE1DE] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-[#1F1A1C] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="px-2 text-center">
            <p className="font-mono-nums text-[15px] font-semibold text-[#1F1A1C] whitespace-nowrap">
              Sentence {sentenceIndex + 1} / {totalSentences}
            </p>
            <p className="text-[12px] text-[#5E5458]">{sentence.speaker}</p>
          </div>

          <button
            type="button"
            onClick={onNextSentence}
            aria-label={
              sentenceIndex === totalSentences - 1 ? 'Finish practice' : 'Next sentence'
            }
            className="min-w-[48px] min-h-[48px] rounded-xl bg-white border border-[#EAE1DE] hover:bg-[#FAF8F6] flex items-center justify-center text-[#1F1A1C] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 4-Step Guide Tabs */}
      <section aria-label="Shadowing steps" className="flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-1.5">
          {STEP_CONFIG.map((item) => {
            const isActive = activeStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => onSelectStep(item.step)}
                className={`min-h-[48px] px-1.5 py-2 rounded-xl border text-center flex flex-col items-center justify-center leading-tight transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#C93B68] border-[#C93B68] text-white'
                    : 'bg-white border-[#EAE1DE] text-[#4A4044] hover:bg-[#FDF1F5]'
                }`}
              >
                <span className="text-[12px] font-bold">Step {item.step}</span>
                <span
                  className={`text-[11px] mt-0.5 ${
                    isActive ? 'text-white/95' : 'text-[#5E5458]'
                  }`}
                >
                  {item.koTitle.replace(/^\d+\.\s*/, '')}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl bg-[#FFFDF5] border border-[#F2DC91] px-3.5 py-2.5">
          <p className="text-[15px] font-semibold text-[#1F1A1C]">
            {currentStepInfo.title}: {currentStepInfo.instructionEn}
          </p>
          <p className="text-[13px] text-[#5C3D00] mt-0.5">
            {currentStepInfo.instructionKo}
          </p>
        </div>
      </section>

      {/* Sentence Text & Korean Meaning Card */}
      <section className="rounded-2xl bg-white border border-[#EAE1DE] p-4 flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-2 text-[13px] text-[#5E5458]">
          <span>
            <strong className="text-[#1F1A1C] font-semibold">{sentence.speaker}</strong>{' '}
            ·{' '}
            <span className="font-mono-nums">
              {sentence.start.toFixed(1)}s–{sentence.end.toFixed(1)}s
            </span>
          </span>

          <span className="font-medium text-[#9D244B]">
            {progress.status === 'done'
              ? '★ Done'
              : progress.status === 'practiced'
                ? '◐ Practiced'
                : '☆ New'}
          </span>
        </div>

        {/* Large Practice Sentence (>= 22px) */}
        <div className="min-h-[72px] flex items-center">
          {hideText ? (
            <div className="w-full py-3 px-4 rounded-xl bg-[#FAF8F6] border border-dashed border-[#D8CCD0] text-center">
              <p className="text-[16px] font-medium text-[#5E5458]">
                Text is hidden · 문장이 숨겨져 있어요
              </p>
              <p className="text-[13px] text-[#7A6F73] mt-0.5">
                Focus on listening and copying the sound
              </p>
            </div>
          ) : (
            <p className="text-[24px] leading-[1.45] tracking-[-0.01em] text-[#1F1A1C]">
              {renderHighlightedText(sentence.text, sentence.stress)}
            </p>
          )}
        </div>

        {/* Korean Meaning */}
        {!hideMeaning ? (
          <p className="text-[16px] text-[#5E5458] leading-snug">{sentence.korean}</p>
        ) : (
          <p className="text-[14px] italic text-[#8B7E83]">
            Korean meaning hidden · 뜻 숨김
          </p>
        )}

        {/* Hide Text & Hide Meaning Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onToggleHideText}
            className={`min-h-[48px] px-3 py-2 rounded-xl border inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              hideText
                ? 'bg-[#FFF8DB] border-[#F3D36B] text-[#5C3D00]'
                : 'bg-[#FAF8F6] border-[#EAE1DE] text-[#1F1A1C] hover:bg-[#FDF1F5]'
            }`}
          >
            {hideText ? (
              <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <EyeOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[14px] font-semibold">
                {hideText ? 'Show Text' : 'Hide Text'}
              </span>
              <span className="text-[11px] opacity-80">
                {hideText ? '문장 보기' : '문장 숨기기'}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleHideMeaning}
            className={`min-h-[48px] px-3 py-2 rounded-xl border inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              hideMeaning
                ? 'bg-[#FFF8DB] border-[#F3D36B] text-[#5C3D00]'
                : 'bg-[#FAF8F6] border-[#EAE1DE] text-[#1F1A1C] hover:bg-[#FDF1F5]'
            }`}
          >
            {hideMeaning ? (
              <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <EyeOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[14px] font-semibold">
                {hideMeaning ? 'Show Meaning' : 'Hide Meaning'}
              </span>
              <span className="text-[11px] opacity-80">
                {hideMeaning ? '뜻 보기' : '뜻 숨기기'}
              </span>
            </span>
          </button>
        </div>
      </section>

      {/* Playback Control Row: Play, Loop, Speed */}
      <section className="rounded-2xl bg-white border border-[#EAE1DE] p-3.5 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={isPlayingSegment ? onStopPlayback : onPlayOriginal}
            disabled={isRecording}
            className={`min-h-[52px] px-4 py-2 rounded-xl font-semibold inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 ${
              isPlayingSegment
                ? 'bg-[#1F1A1C] text-white'
                : 'bg-[#C93B68] hover:bg-[#B12F58] text-white'
            }`}
          >
            {isPlayingSegment ? (
              <Pause className="w-5 h-5 fill-current shrink-0" aria-hidden="true" />
            ) : (
              <Play className="w-5 h-5 fill-current shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[15px] font-semibold">
                {isPlayingSegment ? 'Pause' : 'Play'}
              </span>
              <span className="text-[11px] text-white/90 font-normal">
                {isPlayingSegment
                  ? isLoopWaiting
                    ? '잠시 멈춤 (말하기)'
                    : '일시정지'
                  : '재생'}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleLoop}
            className={`min-h-[52px] px-4 py-2 rounded-xl border inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer ${
              loopEnabled
                ? 'bg-[#FFF8DB] border-[#F3D36B] text-[#5C3D00]'
                : 'bg-[#FAF8F6] border-[#EAE1DE] text-[#1F1A1C] hover:bg-[#FDF1F5]'
            }`}
          >
            <Repeat className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[15px] font-semibold">
                Loop: {loopEnabled ? 'ON' : 'OFF'}
              </span>
              <span className="text-[11px] opacity-80">
                {loopEnabled ? '1.5초 후 반복 켜짐' : '반복 꺼짐'}
              </span>
            </span>
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[#5E5458] shrink-0">
            Speed / 속도
          </span>
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {([0.5, 0.75, 1.0] as PlaybackSpeed[]).map((rate) => {
              const active = speed === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onChangeSpeed(rate)}
                  className={`min-h-[48px] rounded-xl border font-mono-nums text-[15px] font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#FDF1F5] border-[#C93B68] text-[#9D244B]'
                      : 'bg-[#FAF8F6] border-[#EAE1DE] text-[#4A4044] hover:bg-white'
                  }`}
                >
                  {rate === 1.0 ? '1.0×' : `${rate}×`}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Record & Compare Area */}
      <section className="rounded-2xl bg-white border border-[#EAE1DE] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-[18px] font-semibold text-[#1F1A1C]">
              Voice Practice / 목소리 녹음
            </h3>
            <p className="text-[13px] text-[#5E5458]">
              Records only your voice while the video stays paused. Tap again to stop.
            </p>
          </div>
        </div>

        {micDenied && (
          <div className="rounded-xl bg-[#FFF8DB] border border-[#F3D36B] px-3.5 py-2.5 text-[15px] text-[#5C3D00]">
            Mic is off. You can still listen and shadow out loud.
            <span className="block text-[13px] mt-0.5">
              마이크가 꺼져 있어요. 소리 내어 따라 말하며 계속 연습할 수 있어요.
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={isRecording ? onStopRecording : onRecord}
          className={`w-full min-h-[54px] px-4 py-2.5 rounded-xl font-semibold inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer ${
            isRecording
              ? 'bg-[#9D244B] text-white'
              : 'bg-[#FDF1F5] hover:bg-[#F9E1EA] border border-[#F2B8CB] text-[#9D244B]'
          }`}
        >
          {isRecording ? (
            <Square className="w-5 h-5 fill-current shrink-0" aria-hidden="true" />
          ) : (
            <Mic className="w-5 h-5 shrink-0" aria-hidden="true" />
          )}
          <span className="flex flex-col items-start leading-tight text-left">
            <span className="text-[16px] font-semibold">
              {isRecording ? 'Recording… Tap to Stop' : 'Record'}
            </span>
            <span className="text-[12px] opacity-85 font-normal">
              {isRecording
                ? '녹음 중 · 끝나면 눌러서 정지'
                : '녹음 (영상 정지 상태로 내 목소리만)'}
            </span>
          </span>
        </button>

        {recording && (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onPlayMyVoice}
              disabled={isRecording}
              className={`min-h-[48px] px-3 py-2 rounded-xl border inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 ${
                isPlayingMyVoice
                  ? 'bg-[#FFF8DB] border-[#F3D36B] text-[#5C3D00]'
                  : 'bg-[#FAF8F6] border-[#EAE1DE] text-[#1F1A1C] hover:bg-white'
              }`}
            >
              <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="flex flex-col items-start leading-tight text-left">
                <span className="text-[14px] font-semibold">
                  {isPlayingMyVoice ? 'Stop Voice' : 'My Voice'}
                </span>
                <span className="text-[11px] opacity-80">
                  {isPlayingMyVoice ? '멈추기' : '내 목소리'}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={onPlayOriginal}
              disabled={isRecording}
              className="min-h-[48px] px-3 py-2 rounded-xl bg-[#FAF8F6] hover:bg-white border border-[#EAE1DE] text-[#1F1A1C] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 text-[#9D244B] shrink-0" aria-hidden="true" />
              <span className="flex flex-col items-start leading-tight text-left">
                <span className="text-[14px] font-semibold">Original</span>
                <span className="text-[11px] text-[#5E5458]">원음 다시 듣기</span>
              </span>
            </button>
          </div>
        )}
      </section>

      {/* Self-Check (shown after recording) */}
      {hasRecorded && (
        <section
          ref={selfCheckRef}
          className="rounded-2xl bg-[#FFFDF5] border border-[#F2DC91] p-4 flex flex-col gap-3.5"
        >
          <div>
            <h3 className="font-display text-[18px] font-semibold text-[#1F1A1C]">
              Self-Check / 스스로 확인하기
            </h3>
            <p className="text-[13px] text-[#5C3D00]">
              How did it feel? Tap an emoji — every try helps!
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {SELF_CHECK_QUESTIONS.map((q, qIdx) => {
              const currentRating = progress.selfCheck[qIdx];
              return (
                <div
                  key={q.en}
                  className="rounded-xl bg-white border border-[#EAE1DE] p-3 flex flex-col gap-2.5"
                >
                  <div>
                    <p className="text-[16px] font-medium text-[#1F1A1C] leading-snug">
                      {q.en}
                    </p>
                    <p className="text-[13px] text-[#5E5458]">{q.ko}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {RATING_OPTIONS.map((opt) => {
                      const selected = currentRating === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            onRateSelfCheck(qIdx as 0 | 1 | 2, opt.value)
                          }
                          className={`min-h-[48px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center leading-tight transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#FDF1F5] border-[#C93B68] text-[#9D244B] font-semibold'
                              : 'bg-[#FAF8F6] border-[#EAE1DE] text-[#4A4044] hover:bg-white'
                          }`}
                        >
                          <span className="text-[20px]" aria-hidden="true">
                            {opt.emoji}
                          </span>
                          <span className="text-[11px] mt-0.5">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Optional Word Check (Web Speech API) */}
      {speechSupported && (
        <section className="rounded-2xl bg-white border border-[#EAE1DE] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-[17px] font-semibold text-[#1F1A1C]">
                Word Check / 단어 확인
              </h3>
              <p className="text-[13px] text-[#5E5458]">
                Optional · Speak the line in English to see matched words
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={isSpeechListening ? onStopWordCheck : onStartWordCheck}
            className={`w-full min-h-[48px] px-4 py-2 rounded-xl border inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isSpeechListening
                ? 'bg-[#C93B68] border-[#C93B68] text-white'
                : 'bg-[#FAF8F6] hover:bg-[#FDF1F5] border-[#EAE1DE] text-[#1F1A1C]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[15px] font-semibold">
                {isSpeechListening ? 'Listening… Tap to Stop' : 'Check My Words'}
              </span>
              <span className="text-[11px] opacity-80">
                {isSpeechListening ? '듣고 있어요…' : '단어 확인'}
              </span>
            </span>
          </button>

          {speechStatusMessage && (
            <p className="text-[14px] text-[#5E5458]">{speechStatusMessage}</p>
          )}

          {wordCheckResult && (
            <div className="rounded-xl bg-[#FAF8F6] border border-[#EAE1DE] p-3.5 flex flex-col gap-2">
              <p className="text-[15px] font-semibold text-[#1F1A1C] font-mono-nums">
                You said {wordCheckResult.matchedCount} of {wordCheckResult.totalCount}{' '}
                words.
              </p>
              <p className="text-[19px] leading-relaxed flex flex-wrap gap-x-1.5 gap-y-1">
                {wordCheckResult.tokens.map((tok, idx) => (
                  <span
                    key={idx}
                    className={
                      tok.matched
                        ? 'text-[#15803D] font-semibold'
                        : 'text-[#6B6266] underline decoration-[#9CA3AF] underline-offset-4'
                    }
                  >
                    {tok.display}
                  </span>
                ))}
              </p>
              {wordCheckResult.transcript && (
                <p className="text-[13px] text-[#5E5458]">
                  Heard: &ldquo;{wordCheckResult.transcript}&rdquo;
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Bottom Next / Finish CTA */}
      <button
        type="button"
        onClick={onNextSentence}
        className="w-full min-h-[54px] px-5 py-3 rounded-2xl bg-[#C93B68] hover:bg-[#B12F58] text-white inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
      >
        <span className="flex flex-col items-center leading-tight">
          <span className="text-[17px] font-semibold">
            {sentenceIndex === totalSentences - 1 ? 'Finish Practice' : 'Next'}
          </span>
          <span className="text-[12px] text-white/90 font-normal">
            {sentenceIndex === totalSentences - 1 ? '연습 완료' : '다음 문장'}
          </span>
        </span>
        <ChevronRight className="w-5 h-5 shrink-0" aria-hidden="true" />
      </button>
    </div>
  );
}
