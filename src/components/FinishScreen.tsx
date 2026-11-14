import { ArrowLeft, Award, Home, List, RotateCcw } from 'lucide-react';
import { Sentence, SentenceProgress } from '../types';
import { OneLineCredit } from './VideoStage';

interface FinishScreenProps {
  sentences: Sentence[];
  progressMap: Record<number, SentenceProgress>;
  onPracticeSentence: (index: number) => void;
  onBack: () => void;
  onBackToList: () => void;
  onBackToStart: () => void;
}

export function FinishScreen({
  sentences,
  progressMap,
  onPracticeSentence,
  onBack,
  onBackToList,
  onBackToStart,
}: FinishScreenProps) {
  const completedCount = sentences.filter(
    (s) => progressMap[s.id]?.status === 'done'
  ).length;
  const practicedOrDoneCount = sentences.filter((s) => {
    const st = progressMap[s.id]?.status;
    return st === 'done' || st === 'practiced';
  }).length;
  const totalRecordings = sentences.reduce(
    (sum, s) => sum + (progressMap[s.id]?.recordings ?? 0),
    0
  );

  // Sentences marked "😐" (tricky) on any of the 3 self-check questions
  const trickySentences = sentences
    .map((sentence, idx) => ({ sentence, idx, prog: progressMap[sentence.id] }))
    .filter(({ prog }) => prog?.selfCheck?.some((r) => r === 'tricky'));

  return (
    <div className="px-5 py-5 flex flex-col gap-5 min-h-[calc(100dvh-2rem)] justify-between">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-white border border-[#EAE1DE] hover:bg-[#FDF1F5] text-[#1F1A1C] inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#9D244B] shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[14px] font-semibold">Back</span>
              <span className="text-[11px] text-[#5E5458]">뒤로</span>
            </span>
          </button>
        </div>

        {/* Celebration Hero */}
        <header className="rounded-2xl bg-[#FFFDF5] border border-[#F2DC91] p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 text-[#9A6700]">
            <Award className="w-6 h-6 shrink-0" aria-hidden="true" />
            <span className="text-[14px] font-semibold">Session Summary · 연습 결과</span>
          </div>

          <h1 className="font-display text-[30px] leading-tight font-bold text-[#1F1A1C]">
            Great job!
          </h1>
          <p className="text-[18px] text-[#4A4044] leading-snug">
            정말 잘했어요! 한 문장씩 꾸준히 따라 말한 것 자체가 큰 성장입니다.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl bg-white border border-[#EAE1DE] p-3.5">
              <p className="text-[13px] text-[#5E5458]">Completed / 완료 문장</p>
              <p className="font-mono-nums text-[26px] font-bold text-[#9D244B] mt-0.5">
                {completedCount}
                <span className="text-[16px] font-medium text-[#5E5458]">
                  {' '}
                  / {sentences.length}
                </span>
              </p>
              <p className="text-[12px] text-[#5E5458] mt-0.5 font-mono-nums">
                {practicedOrDoneCount} practiced
              </p>
            </div>

            <div className="rounded-xl bg-white border border-[#EAE1DE] p-3.5">
              <p className="text-[13px] text-[#5E5458]">Recordings / 총 녹음</p>
              <p className="font-mono-nums text-[26px] font-bold text-[#9A6700] mt-0.5">
                {totalRecordings}
              </p>
              <p className="text-[12px] text-[#5E5458] mt-0.5">voice takes</p>
            </div>
          </div>
        </header>

        {/* Sentences marked 😐 */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-[20px] font-semibold text-[#1F1A1C]">
              Marked 😐 to Try Again
            </h2>
            <p className="text-[14px] text-[#5E5458]">
              스스로 😐 표시한 문장을 한 번 더 가볍게 연습해 보세요.
            </p>
          </div>

          {trickySentences.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#EAE1DE] p-5">
              <p className="text-[17px] font-medium text-[#1F1A1C]">
                No sentences marked 😐 right now.
              </p>
              <p className="text-[14px] text-[#5E5458] mt-1">
                아직 😐 로 표시한 문장이 없어요. 다른 문장도 자유롭게 다시 들어보세요!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {trickySentences.map(({ sentence, idx }) => (
                <div
                  key={sentence.id}
                  className="rounded-2xl bg-white border border-[#EAE1DE] p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] text-[#5E5458]">
                      Sentence {idx + 1} · {sentence.speaker}
                    </span>
                    <p className="text-[18px] font-semibold text-[#1F1A1C] leading-snug">
                      {sentence.text}
                    </p>
                    <p className="text-[14px] text-[#5E5458]">{sentence.korean}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onPracticeSentence(idx)}
                    className="w-full min-h-[48px] px-4 py-2 rounded-xl bg-[#FDF1F5] hover:bg-[#F9E1EA] border border-[#F2B8CB] text-[#9D244B] font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="text-[15px]">
                      Practice again <span className="text-[13px] font-normal">/ 다시 연습</span>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Navigation Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onBackToList}
            className="min-h-[52px] px-4 py-2.5 rounded-xl bg-[#C93B68] hover:bg-[#B12F58] text-white inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <List className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[15px] font-semibold">Sentence List</span>
              <span className="text-[11px] text-white/90">문장 목록</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onBackToStart}
            className="min-h-[52px] px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F6] border border-[#EAE1DE] text-[#1F1A1C] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#5E5458] shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[15px] font-semibold">Start Screen</span>
              <span className="text-[11px] text-[#5E5458]">처음으로</span>
            </span>
          </button>
        </div>
      </div>

      {/* Mandatory One-Line Credit at Bottom */}
      <footer className="pt-4 border-t border-[#EAE1DE]">
        <OneLineCredit />
      </footer>
    </div>
  );
}
