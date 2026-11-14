import { BookOpen, ExternalLink, Play, SlidersHorizontal } from 'lucide-react';
import { formatSecondsToTime, MOVIE_CONFIG } from '../types';

interface StartScreenProps {
  sentenceCount: number;
  onStartPractice: () => void;
  onOpenEdit: () => void;
}

function isKnown(val: string): boolean {
  return val.trim().length > 0 && val.trim().toLowerCase() !== 'unknown';
}

export function StartScreen({
  sentenceCount,
  onStartPractice,
  onOpenEdit,
}: StartScreenProps) {
  const practiceRangeLabel = `${formatSecondsToTime(MOVIE_CONFIG.displayStartSeconds)} – ${formatSecondsToTime(MOVIE_CONFIG.displayEndSeconds)}`;

  const sourceRows: Array<{ label: string; value: string; isLink?: boolean }> = [
    {
      label: 'Movie',
      value: isKnown(MOVIE_CONFIG.movieTitleKo)
        ? `${MOVIE_CONFIG.movieTitleEn} (${MOVIE_CONFIG.movieTitleKo})`
        : MOVIE_CONFIG.movieTitleEn,
    },
    { label: 'Release year', value: MOVIE_CONFIG.releaseYear },
    { label: 'Director', value: MOVIE_CONFIG.director },
    { label: 'Screenplay', value: MOVIE_CONFIG.screenplay },
    { label: 'Production', value: MOVIE_CONFIG.production },
    { label: 'Distribution', value: MOVIE_CONFIG.distribution },
    { label: 'Scene', value: MOVIE_CONFIG.sceneDescription },
    { label: 'YouTube title', value: MOVIE_CONFIG.youtubeTitle },
    { label: 'Channel', value: MOVIE_CONFIG.youtubeChannel },
    { label: 'YouTube URL', value: MOVIE_CONFIG.youtubeUrl, isLink: true },
    { label: 'Practice range', value: practiceRangeLabel },
    { label: 'Made by', value: MOVIE_CONFIG.madeBy },
  ].filter((row) => isKnown(row.value));

  return (
    <div className="px-5 pt-7 pb-8 flex flex-col gap-6">
      {/* Hero Header */}
      <header className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-[14px] font-medium text-[#9D244B]">
          <span>{MOVIE_CONFIG.movieTitleEn}</span>
          <span aria-hidden="true">·</span>
          <span>{MOVIE_CONFIG.movieTitleKo}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-nums">{MOVIE_CONFIG.releaseYear}</span>
        </div>

        <h1 className="font-display text-[32px] leading-[1.15] font-bold tracking-tight text-[#1F1A1C]">
          {MOVIE_CONFIG.appName}
        </h1>

        <p className="text-[18px] leading-snug font-medium text-[#4A4044]">
          {MOVIE_CONFIG.appTagline}
        </p>

        <p className="text-[15px] leading-relaxed text-[#5E5458]">
          {MOVIE_CONFIG.sceneDescription}
        </p>
      </header>

      {/* Primary Actions */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onStartPractice}
          className="w-full min-h-[56px] px-5 py-3 rounded-2xl bg-[#C93B68] hover:bg-[#B12F58] active:scale-[0.99] text-white flex items-center justify-center gap-3 shadow-sm transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C93B68]"
        >
          <Play className="w-5 h-5 fill-current shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-start text-left leading-tight">
            <span className="text-[18px] font-semibold">Start Practice</span>
            <span className="text-[13px] text-white/90 font-normal">
              연습 시작 · {sentenceCount} sentences
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenEdit}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-white hover:bg-[#FDF1F5] border border-[#E5DADF] text-[#4A4044] flex items-center justify-center gap-2.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C93B68]"
        >
          <SlidersHorizontal className="w-4 h-4 shrink-0 text-[#9D244B]" aria-hidden="true" />
          <span className="text-[16px] font-medium">
            Edit Sentences <span className="text-[14px] text-[#5E5458]">/ 문장 편집</span>
          </span>
        </button>
      </div>

      {/* What is shadowing? */}
      <section
        aria-labelledby="what-is-shadowing-title"
        className="rounded-2xl bg-[#FFFDF5] border border-[#F2DC91] p-5 flex flex-col gap-3.5"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#9A6700] shrink-0" aria-hidden="true" />
          <h2
            id="what-is-shadowing-title"
            className="font-display text-[20px] font-semibold text-[#1F1A1C]"
          >
            What is shadowing?
          </h2>
        </div>

        <ul className="flex flex-col gap-3 text-[18px] leading-snug text-[#1F1A1C]">
          <li className="flex items-start gap-2.5">
            <span className="font-mono-nums text-[15px] font-semibold text-[#9A6700] mt-1 shrink-0">
              1.
            </span>
            <div>
              <p className="font-medium">Listen carefully to the actor&apos;s voice.</p>
              <p className="text-[14px] text-[#5E5458] mt-0.5">
                배우의 목소리와 속도에 집중하며 들어보세요.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-mono-nums text-[15px] font-semibold text-[#9A6700] mt-1 shrink-0">
              2.
            </span>
            <div>
              <p className="font-medium">Speak at the same time, copying rhythm and stress.</p>
              <p className="text-[14px] text-[#5E5458] mt-0.5">
                강세와 억양을 따라 하며 거의 동시에 말해보세요.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-mono-nums text-[15px] font-semibold text-[#9A6700] mt-1 shrink-0">
              3.
            </span>
            <div>
              <p className="font-medium">We all make mistakes — record and try freely.</p>
              <p className="text-[14px] text-[#5E5458] mt-0.5">
                실수해도 괜찮아요! 녹음하며 편하게 다시 연습해 보세요.
              </p>
            </div>
          </li>
        </ul>
      </section>

      {/* Educational Use & Source Card (Mandatory Section 0-3) */}
      <section
        aria-labelledby="edu-notice-title"
        className="rounded-2xl bg-white border border-[#EAE1DE] p-5 flex flex-col gap-4"
      >
        <h2
          id="edu-notice-title"
          className="font-display text-[17px] font-semibold text-[#1F1A1C]"
        >
          Educational Use &amp; Source / 교육용 고지 및 출처
        </h2>

        <div className="flex flex-col gap-2.5 text-[14px] leading-relaxed text-[#4A4044] bg-[#FAF8F6] p-3.5 rounded-xl border border-[#EFE7E4]">
          <p className="font-semibold text-[#1F1A1C]">
            Educational use only / 교육 목적 전용
          </p>
          <p>{MOVIE_CONFIG.noticeEn}</p>
          <p>{MOVIE_CONFIG.noticeKo}</p>
        </div>

        <dl className="flex flex-col gap-2 text-[14px]">
          {sourceRows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col sm:flex-row sm:justify-between sm:gap-4 py-1.5 border-b border-[#F2ECE9] last:border-b-0"
            >
              <dt className="text-[#5E5458] font-medium shrink-0">{row.label}</dt>
              <dd className="text-[#1F1A1C] sm:text-right break-words">
                {row.isLink ? (
                  <a
                    href={row.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#9D244B] underline underline-offset-2 hover:text-[#7D1A3A]"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
