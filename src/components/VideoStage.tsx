import { ExternalLink } from 'lucide-react';
import { MOVIE_CONFIG } from '../types';

interface VideoStageProps {
  containerId: string;
  embedError: boolean;
  isLoopWaiting: boolean;
}

function isKnown(val: string): boolean {
  return val.trim().length > 0 && val.trim().toLowerCase() !== 'unknown';
}

export function OneLineCredit() {
  const companies = [MOVIE_CONFIG.distribution, MOVIE_CONFIG.production]
    .filter(isKnown)
    .join(' / ');

  return (
    <p className="text-[13px] leading-snug text-[#5E5458]">
      Clip: <em className="italic font-medium">{MOVIE_CONFIG.movieTitleEn}</em>
      {isKnown(MOVIE_CONFIG.releaseYear) ? ` (${MOVIE_CONFIG.releaseYear})` : ''}
      {companies ? `, ${companies}` : ''} · via YouTube · For educational use only
    </p>
  );
}

export function VideoStage({ containerId, embedError, isLoopWaiting }: VideoStageProps) {
  const fallbackUrl = `https://www.youtube.com/watch?v=${MOVIE_CONFIG.videoId}&t=${MOVIE_CONFIG.practiceStart}s`;

  return (
    <div className="bg-white border-b border-[#EAE1DE]">
      <div className="relative w-full aspect-video bg-[#1E191B] overflow-hidden">
        {!embedError ? (
          <div id={containerId} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-[#2A2226] text-white gap-3">
            <p className="text-[16px] font-medium leading-snug max-w-xs">
              This video can&apos;t play inside the app. Tap to open it on YouTube.
            </p>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl bg-[#C93B68] hover:bg-[#B12F58] text-white text-[15px] font-semibold transition-colors"
            >
              <span>Open on YouTube / 유튜브에서 열기</span>
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
            </a>
          </div>
        )}

        {isLoopWaiting && !embedError && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center px-3">
            <div className="bg-[#FFF8DB]/95 border border-[#F3D36B] text-[#5C3D00] px-3.5 py-1.5 rounded-lg text-[14px] font-semibold shadow-sm">
              Your turn! Speak now · 지금 따라 말해보세요
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 bg-[#FAF8F6]">
        <OneLineCredit />
      </div>
    </div>
  );
}
