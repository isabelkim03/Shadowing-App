export type ScreenName = 'start' | 'list' | 'practice' | 'edit' | 'finish';

export type PracticeStep = 1 | 2 | 3 | 4;

export type SelfCheckRating = 'good' | 'okay' | 'tricky' | null;

export type SentenceStatus = 'new' | 'practiced' | 'done';

export type PlaybackSpeed = 0.5 | 0.75 | 1.0;

export interface Sentence {
  id: number;
  speaker: string;
  text: string;
  korean: string;
  stress: string[];
  start: number;
  end: number;
}

export interface SentenceProgress {
  id: number;
  plays: number;
  recordings: number;
  selfCheck: [SelfCheckRating, SelfCheckRating, SelfCheckRating];
  status: SentenceStatus;
}

export interface AudioRecording {
  url: string;
  mimeType: string;
  recordedAt: number;
}

export interface WordCheckResult {
  transcript: string;
  matchedCount: number;
  totalCount: number;
  tokens: Array<{
    display: string;
    matched: boolean;
  }>;
}

export const MOVIE_CONFIG = {
  appName: 'Scene Shadow: Speak Wild!',
  appTagline: 'Listen. Copy. Speak at the same time.',
  movieTitleEn: 'Zootopia',
  movieTitleKo: '쥬토피아',
  releaseYear: '2016',
  director: 'Byron Howard, Rich Moore (co-director: Jared Bush)',
  screenplay: 'Jared Bush, Phil Johnston',
  production: 'Walt Disney Animation Studios',
  distribution: 'Walt Disney Studios Motion Pictures',
  sceneDescription:
    'Judy Hopps, a rabbit police officer, teams up with Nick Wilde, a fox',
  youtubeTitle: 'Zootopia Official US Trailer #2',
  youtubeChannel: 'Walt Disney Animation Studios',
  youtubeUrl: 'https://www.youtube.com/watch?v=jWM0ct-OLsM',
  videoId: 'jWM0ct-OLsM',
  // Display values from section 0-1 (0:46 - 2:05)
  displayStartSeconds: 46,
  displayEndSeconds: 125,
  // Player & editor bounds allow sentence 5 (125.0s - 129.2s) to play completely
  practiceStart: 46,
  practiceEnd: 132,
  madeBy: '김소연',
  noticeEn:
    'This app was made only for non-commercial English learning in the university course AI and English Language Education (ENG3088, Sungkyunkwan University). The film clip is used only to practice listening and speaking (shadowing). It is not sold, shared for profit, downloaded, or edited. All rights to the film belong to its copyright holders.',
  noticeKo:
    '이 앱은 성균관대학교 「인공지능과 영어교육」(ENG3088) 수업의 비영리 영어 학습 목적으로만 제작되었습니다. 영화 장면은 듣기·말하기(쉐도잉) 연습에만 사용하며, 판매·영리적 배포·다운로드·편집을 하지 않습니다. 영화의 모든 권리는 저작권자에게 있습니다.',
} as const;

export function formatSecondsToTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
