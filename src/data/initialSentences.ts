import { Sentence, SentenceProgress } from '../types';

const SENTENCES_STORAGE_KEY = 'scene_shadow_zootopia_sentences_v2';
const PROGRESS_STORAGE_KEY = 'scene_shadow_zootopia_progress_v1';

export const DEFAULT_SENTENCES: Sentence[] = [
  {
    id: 1,
    speaker: 'Judy',
    text: "I'm here to ask you some questions about a case.",
    korean: '사건에 대해 몇 가지 물어보려고 왔어요.',
    stress: ['questions', 'case'],
    start: 46.0,
    end: 49.0,
  },
  {
    id: 2,
    speaker: 'Judy',
    text: 'We are in a really big hurry.',
    korean: '저희 정말 급해요.',
    stress: ['really', 'hurry'],
    start: 71.0,
    end: 73.0,
  },
  {
    id: 3,
    speaker: 'Nick',
    text: "He's on it.",
    korean: '그가 바로 처리할 거예요.',
    stress: ['on'],
    start: 62.0,
    end: 63.2,
  },
  {
    id: 4,
    speaker: 'Judy',
    text: 'We all make mistakes',
    korean: '우리 모두 실수를 해요.',
    stress: ['all', 'mistakes'],
    start: 121.0,
    end: 122.2,
  },
  {
    id: 5,
    speaker: 'Judy',
    text: 'No matter what type of animal you are, change starts with you.',
    korean: '당신이 어떤 동물이든, 변화는 당신에게서 시작돼요.',
    stress: ['change', 'you'],
    start: 125.0,
    end: 129.2,
  },
];

// In-memory fallback when localStorage is blocked or unavailable
let memorySentences: Sentence[] | null = null;
let memoryProgress: Record<number, SentenceProgress> | null = null;

export function createEmptyProgress(id: number): SentenceProgress {
  return {
    id,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };
}

export function loadSentences(): Sentence[] {
  try {
    const raw = window.localStorage.getItem(SENTENCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({
          id: typeof item.id === 'number' ? item.id : idx + 1,
          speaker: String(item.speaker ?? ''),
          text: String(item.text ?? ''),
          korean: String(item.korean ?? ''),
          stress: Array.isArray(item.stress) ? item.stress.map(String) : [],
          start: Number(item.start ?? 46),
          end: Number(item.end ?? 48),
        }));
      }
    }
  } catch {
    if (memorySentences !== null) {
      return memorySentences;
    }
  }
  return DEFAULT_SENTENCES;
}

export function saveSentences(sentences: Sentence[]): void {
  memorySentences = sentences;
  try {
    window.localStorage.setItem(SENTENCES_STORAGE_KEY, JSON.stringify(sentences));
  } catch {
    // Fallback already stored in memorySentences
  }
}

export function loadProgress(): Record<number, SentenceProgress> {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<number, SentenceProgress>;
      }
    }
  } catch {
    if (memoryProgress !== null) {
      return memoryProgress;
    }
  }
  return {};
}

export function saveProgress(progress: Record<number, SentenceProgress>): void {
  memoryProgress = progress;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Fallback already stored in memoryProgress
  }
}
