import {
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Sentence, SentenceProgress, SentenceStatus } from '../types';

interface SentenceListScreenProps {
  sentences: Sentence[];
  progressMap: Record<number, SentenceProgress>;
  hideText: boolean;
  onToggleHideText: () => void;
  onSelectSentence: (index: number) => void;
  onBackStart: () => void;
  onOpenEdit: () => void;
  onOpenFinish: () => void;
}

function getStatusMeta(status: SentenceStatus): {
  symbol: string;
  label: string;
  colorClass: string;
} {
  if (status === 'done') {
    return {
      symbol: '★',
      label: 'Done',
      colorClass: 'text-[#9A6700]',
    };
  }
  if (status === 'practiced') {
    return {
      symbol: '◐',
      label: 'Practiced',
      colorClass: 'text-[#9D244B]',
    };
  }
  return {
    symbol: '☆',
    label: 'New',
    colorClass: 'text-[#5E5458]',
  };
}

export function SentenceListScreen({
  sentences,
  progressMap,
  hideText,
  onToggleHideText,
  onSelectSentence,
  onBackStart,
  onOpenEdit,
  onOpenFinish,
}: SentenceListScreenProps) {
  const completedCount = sentences.filter(
    (s) => progressMap[s.id]?.status === 'done'
  ).length;
  const practicedCount = sentences.filter(
    (s) =>
      progressMap[s.id]?.status === 'practiced' ||
      progressMap[s.id]?.status === 'done'
  ).length;

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackStart}
          className="min-h-[48px] px-3.5 py-2 rounded-xl bg-white border border-[#EAE1DE] hover:bg-[#FDF1F5] text-[#1F1A1C] inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#9D244B] shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-start leading-tight text-left">
            <span className="text-[14px] font-semibold">Back</span>
            <span className="text-[11px] text-[#5E5458]">뒤로</span>
          </span>
        </button>

        <div className="text-right">
          <h2 className="font-display text-[19px] font-bold text-[#1F1A1C] leading-tight">
            Sentence List
          </h2>
          <p className="text-[13px] text-[#5E5458] font-mono-nums">
            {practicedCount}/{sentences.length} practiced · {completedCount} done
          </p>
        </div>
      </div>

      {/* Action Row: Hide Text & Edit */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onToggleHideText}
          className={`min-h-[48px] px-3.5 py-2 rounded-xl border inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            hideText
              ? 'bg-[#FFF8DB] border-[#F3D36B] text-[#5C3D00]'
              : 'bg-white border-[#EAE1DE] text-[#1F1A1C] hover:bg-[#FAF8F6]'
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
          onClick={onOpenEdit}
          className="min-h-[48px] px-3.5 py-2 rounded-xl bg-white border border-[#EAE1DE] hover:bg-[#FDF1F5] text-[#1F1A1C] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#9D244B] shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-start leading-tight text-left">
            <span className="text-[14px] font-semibold">Edit</span>
            <span className="text-[11px] text-[#5E5458]">문장 편집</span>
          </span>
        </button>
      </div>

      {/* Sentences List or Empty State */}
      {sentences.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#EAE1DE] p-6 text-center flex flex-col items-center gap-4">
          <p className="text-[18px] font-medium text-[#1F1A1C]">
            No sentences yet. Tap Edit Sentences to add some.
          </p>
          <p className="text-[14px] text-[#5E5458]">
            아직 등록된 문장이 없어요. 문장 편집에서 문장을 추가해 보세요.
          </p>
          <button
            type="button"
            onClick={onOpenEdit}
            className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#C93B68] hover:bg-[#B12F58] text-white font-semibold text-[15px] inline-flex flex-col items-center justify-center leading-tight cursor-pointer"
          >
            <span>Edit Sentences</span>
            <span className="text-[11px] text-white/90 font-normal">문장 편집</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sentences.map((sentence, idx) => {
            const prog = progressMap[sentence.id];
            const status = prog?.status ?? 'new';
            const statusMeta = getStatusMeta(status);

            return (
              <button
                key={sentence.id}
                type="button"
                onClick={() => onSelectSentence(idx)}
                className="w-full min-h-[68px] text-left rounded-2xl bg-white hover:bg-[#FDF7F9] active:scale-[0.995] border border-[#EAE1DE] px-4 py-3.5 flex items-center gap-3.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C93B68]"
              >
                <span className="font-mono-nums text-[15px] font-semibold text-[#9D244B] w-6 shrink-0">
                  {idx + 1}.
                </span>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[13px] text-[#5E5458]">
                    <span className="font-semibold text-[#1F1A1C]">
                      {sentence.speaker || 'Speaker'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-nums">
                      {sentence.start.toFixed(1)}s–{sentence.end.toFixed(1)}s
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={`font-medium ${statusMeta.colorClass}`}>
                      {statusMeta.symbol} {statusMeta.label}
                    </span>
                  </div>

                  {hideText ? (
                    <p className="text-[16px] italic text-[#7A6F73]">
                      Text hidden — tap to listen &amp; shadow
                    </p>
                  ) : (
                    <p className="text-[18px] font-medium text-[#1F1A1C] leading-snug">
                      {sentence.text}
                    </p>
                  )}
                </div>

                <ChevronRight
                  className="w-5 h-5 text-[#8B7E83] shrink-0"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Finish Summary Button */}
      {sentences.length > 0 && (
        <button
          type="button"
          onClick={onOpenFinish}
          className="mt-2 w-full min-h-[52px] px-4 py-2.5 rounded-2xl bg-[#FFF8DB] hover:bg-[#FCEFB8] border border-[#F3D36B] text-[#5C3D00] flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-start leading-tight text-left">
            <span className="text-[15px] font-semibold">Finish &amp; Review</span>
            <span className="text-[12px] opacity-85">연습 마무리하기</span>
          </span>
        </button>
      )}
    </div>
  );
}
