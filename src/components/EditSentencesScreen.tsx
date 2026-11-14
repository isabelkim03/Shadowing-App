import { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Download,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { MOVIE_CONFIG, Sentence } from '../types';

interface EditSentencesScreenProps {
  sentences: Sentence[];
  currentTime: number;
  getAccurateCurrentTime: () => number;
  onTestSegment: (start: number, end: number) => void;
  onSaveSentences: (next: Sentence[]) => void;
  onResetDefaults: () => void;
  onBack: () => void;
}

interface FormState {
  editingId: number | null;
  speaker: string;
  text: string;
  korean: string;
  stressInput: string;
  startInput: string;
  endInput: string;
}

function emptyForm(): FormState {
  return {
    editingId: null,
    speaker: '',
    text: '',
    korean: '',
    stressInput: '',
    startInput: String(MOVIE_CONFIG.practiceStart),
    endInput: String(MOVIE_CONFIG.practiceStart + 2),
  };
}

export function EditSentencesScreen({
  sentences,
  currentTime,
  getAccurateCurrentTime,
  onTestSegment,
  onSaveSentences,
  onResetDefaults,
  onBack,
}: EditSentencesScreenProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const parsedStart = Number.parseFloat(form.startInput);
  const parsedEnd = Number.parseFloat(form.endInput);
  const wordCount = form.text.trim().split(/\s+/).filter(Boolean).length;
  const duration =
    !Number.isNaN(parsedStart) && !Number.isNaN(parsedEnd)
      ? parsedEnd - parsedStart
      : 0;

  // Gentle warnings (non-blocking)
  const gentleWarnings: string[] = [];
  if (duration > 4.0) {
    gentleWarnings.push(
      `This clip is ${duration.toFixed(1)}s long (over 4s may be tiring to shadow).`
    );
  }
  if (wordCount > 12) {
    gentleWarnings.push(
      `This sentence has ${wordCount} words (3–12 words works best for shadowing).`
    );
  }

  const handleSetStartNow = () => {
    const now = getAccurateCurrentTime();
    setForm((prev) => ({ ...prev, startInput: now.toFixed(1) }));
    setFormError(null);
  };

  const handleSetEndNow = () => {
    const now = getAccurateCurrentTime();
    setForm((prev) => ({ ...prev, endInput: now.toFixed(1) }));
    setFormError(null);
  };

  const handleTest = () => {
    if (Number.isNaN(parsedStart) || Number.isNaN(parsedEnd)) {
      setFormError('Please enter valid start and end times first.');
      return;
    }
    if (parsedEnd <= parsedStart) {
      setFormError('End time must be greater than start time.');
      return;
    }
    setFormError(null);
    onTestSegment(parsedStart, parsedEnd);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = form.text.trim();
    if (!trimmedText) {
      setFormError('Please enter the English sentence.');
      return;
    }
    if (Number.isNaN(parsedStart) || Number.isNaN(parsedEnd)) {
      setFormError('Start and end times must be numbers.');
      return;
    }
    if (
      parsedStart < MOVIE_CONFIG.practiceStart ||
      parsedEnd > MOVIE_CONFIG.practiceEnd
    ) {
      setFormError(
        `Start and end must be between ${MOVIE_CONFIG.practiceStart}s and ${MOVIE_CONFIG.practiceEnd}s.`
      );
      return;
    }
    if (parsedEnd <= parsedStart) {
      setFormError('End time must be greater than start time.');
      return;
    }

    const stress = form.stressInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const roundedStart = Math.round(parsedStart * 10) / 10;
    const roundedEnd = Math.round(parsedEnd * 10) / 10;

    if (form.editingId !== null) {
      const next = sentences.map((item) =>
        item.id === form.editingId
          ? {
              ...item,
              speaker: form.speaker.trim() || 'Speaker',
              text: trimmedText,
              korean: form.korean.trim(),
              stress,
              start: roundedStart,
              end: roundedEnd,
            }
          : item
      );
      onSaveSentences(next);
    } else {
      const nextId =
        sentences.reduce((max, s) => (s.id > max ? s.id : max), 0) + 1;
      const newItem: Sentence = {
        id: nextId,
        speaker: form.speaker.trim() || 'Speaker',
        text: trimmedText,
        korean: form.korean.trim(),
        stress,
        start: roundedStart,
        end: roundedEnd,
      };
      onSaveSentences([...sentences, newItem]);
    }

    setForm(emptyForm());
    setFormError(null);
  };

  const handleStartEdit = (s: Sentence) => {
    setForm({
      editingId: s.id,
      speaker: s.speaker,
      text: s.text,
      korean: s.korean,
      stressInput: s.stress.join(', '),
      startInput: s.start.toFixed(1),
      endInput: s.end.toFixed(1),
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    onSaveSentences(sentences.filter((s) => s.id !== id));
    if (form.editingId === id) {
      setForm(emptyForm());
    }
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sentences.length) return;
    const copy = [...sentences];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    onSaveSentences(copy);
  };

  const handleExport = async () => {
    const json = JSON.stringify(sentences, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopiedJson(true);
      window.setTimeout(() => setCopiedJson(false), 2500);
    } catch {
      setImportText(json);
      setShowImport(true);
    }
  };

  const handleImportSubmit = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        setImportError('JSON must be an array of sentences.');
        return;
      }
      const cleaned: Sentence[] = parsed.map((item, idx) => {
        const start = Number(item.start);
        const end = Number(item.end);
        if (
          !item.text ||
          Number.isNaN(start) ||
          Number.isNaN(end) ||
          end <= start
        ) {
          throw new Error(`Invalid item at index ${idx}`);
        }
        return {
          id: typeof item.id === 'number' ? item.id : idx + 1,
          speaker: String(item.speaker ?? 'Speaker'),
          text: String(item.text),
          korean: String(item.korean ?? ''),
          stress: Array.isArray(item.stress) ? item.stress.map(String) : [],
          start: Math.round(start * 10) / 10,
          end: Math.round(end * 10) / 10,
        };
      });
      onSaveSentences(cleaned);
      setImportError(null);
      setImportText('');
      setShowImport(false);
    } catch {
      setImportError(
        'Could not import JSON. Make sure each sentence has text, start, and end > start.'
      );
    }
  };

  return (
    <div className="px-4 py-5 flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
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

        <div className="text-right">
          <h2 className="font-display text-[19px] font-bold text-[#1F1A1C]">
            Edit Sentences
          </h2>
          <p className="text-[12px] text-[#5E5458] font-mono-nums">
            Now: {currentTime.toFixed(1)}s · Range {MOVIE_CONFIG.practiceStart}–
            {MOVIE_CONFIG.practiceEnd}s
          </p>
        </div>
      </div>

      {/* Add / Edit Sentence Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white border border-[#EAE1DE] p-4 flex flex-col gap-3.5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[18px] font-semibold text-[#1F1A1C]">
            {form.editingId !== null
              ? 'Edit Sentence / 문장 수정'
              : 'Add Sentence / 새 문장 추가'}
          </h3>
          {form.editingId !== null && (
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm());
                setFormError(null);
              }}
              className="text-[13px] font-medium text-[#9D244B] underline cursor-pointer"
            >
              Cancel edit
            </button>
          )}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[14px] font-medium text-[#4A4044]">
            Speaker / 화자
          </span>
          <input
            type="text"
            value={form.speaker}
            onChange={(e) => setForm((p) => ({ ...p, speaker: e.target.value }))}
            placeholder="e.g. Judy, Nick"
            className="min-h-[48px] px-3.5 py-2 rounded-xl border border-[#DDD2CE] bg-[#FAF8F6] text-[16px] text-[#1F1A1C] focus:outline-none focus:border-[#C93B68]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[14px] font-medium text-[#4A4044]">
            English sentence / 영어 문장
          </span>
          <textarea
            rows={2}
            value={form.text}
            onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
            placeholder="Write the exact sentence heard in the clip"
            className="px-3.5 py-2.5 rounded-xl border border-[#DDD2CE] bg-[#FAF8F6] text-[16px] text-[#1F1A1C] focus:outline-none focus:border-[#C93B68]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[14px] font-medium text-[#4A4044]">
            Korean meaning / 한국어 뜻
          </span>
          <input
            type="text"
            value={form.korean}
            onChange={(e) => setForm((p) => ({ ...p, korean: e.target.value }))}
            placeholder="고1 학생이 이해하기 쉬운 뜻"
            className="min-h-[48px] px-3.5 py-2 rounded-xl border border-[#DDD2CE] bg-[#FAF8F6] text-[16px] text-[#1F1A1C] focus:outline-none focus:border-[#C93B68]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[14px] font-medium text-[#4A4044]">
            Stress words (comma-separated) / 강세 단어
          </span>
          <input
            type="text"
            value={form.stressInput}
            onChange={(e) =>
              setForm((p) => ({ ...p, stressInput: e.target.value }))
            }
            placeholder="e.g. really, hurry"
            className="min-h-[48px] px-3.5 py-2 rounded-xl border border-[#DDD2CE] bg-[#FAF8F6] text-[16px] text-[#1F1A1C] focus:outline-none focus:border-[#C93B68]"
          />
        </label>

        {/* Start & End Time Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="flex flex-col gap-1">
              <span className="text-[14px] font-medium text-[#4A4044]">
                Start (s) / 시작
              </span>
              <input
                type="number"
                step="0.1"
                value={form.startInput}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startInput: e.target.value }))
                }
                className="min-h-[48px] px-3 py-2 rounded-xl border border-[#DDD2CE] bg-[#FAF8F6] font-mono-nums text-[16px] text-[#1F1A1C] focus:outline-none focus:border-[#C93B68]"
              />
            </label>
            <button
              type="button"
              onClick={handleSetStartNow}
              className="min-h-[48px] px-2.5 py-1.5 rounded-xl bg-[#FFF8DB] hover:bg-[#FCEFB8] border border-[#F3D36B] text-[#5C3D00] text-[13px] font-semibold leading-tight cursor-pointer"
            >
              Set Start = now
              <span className="block text-[11px] font-normal">현재를 시작으로</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex flex-col gap-1">
              <span className="text-[14px] font-medium text-[#4A4044]">
                End (s) / 끝
              </span>
              <input
                type="number"
                step="0.1"
                value={form.endInput}
                onChange={(e) =>
                  setForm((p) => ({ ...p, endInput: e.target.value }))
                }
                className="min-h-[48px] px-3 py-2 rounded-xl border border-[#DDD2CE] bg-[#FAF8F6] font-mono-nums text-[16px] text-[#1F1A1C] focus:outline-none focus:border-[#C93B68]"
              />
            </label>
            <button
              type="button"
              onClick={handleSetEndNow}
              className="min-h-[48px] px-2.5 py-1.5 rounded-xl bg-[#FFF8DB] hover:bg-[#FCEFB8] border border-[#F3D36B] text-[#5C3D00] text-[13px] font-semibold leading-tight cursor-pointer"
            >
              Set End = now
              <span className="block text-[11px] font-normal">현재를 끝으로</span>
            </button>
          </div>
        </div>

        {/* Gentle Warnings */}
        {gentleWarnings.length > 0 && (
          <div className="rounded-xl bg-[#FFF8DB] border border-[#F3D36B] px-3.5 py-2.5 text-[14px] text-[#5C3D00] flex flex-col gap-1">
            {gentleWarnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        )}

        {/* Hard Validation Error */}
        {formError && (
          <div className="rounded-xl bg-[#FDF1F5] border border-[#F2B8CB] px-3.5 py-2.5 text-[14px] font-medium text-[#9D244B]">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleTest}
            className="min-h-[48px] px-4 py-2 rounded-xl bg-[#FAF8F6] hover:bg-white border border-[#EAE1DE] text-[#1F1A1C] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 text-[#9D244B] shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[14px] font-semibold">Test</span>
              <span className="text-[11px] text-[#5E5458]">미리듣기</span>
            </span>
          </button>

          <button
            type="submit"
            className="min-h-[48px] px-4 py-2 rounded-xl bg-[#C93B68] hover:bg-[#B12F58] text-white inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {form.editingId !== null ? (
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[14px] font-semibold">
                {form.editingId !== null ? 'Save Edit' : 'Add Sentence'}
              </span>
              <span className="text-[11px] text-white/90">
                {form.editingId !== null ? '수정 저장' : '문장 추가'}
              </span>
            </span>
          </button>
        </div>
      </form>

      {/* Current List */}
      <section className="flex flex-col gap-2.5">
        <h3 className="font-display text-[18px] font-semibold text-[#1F1A1C]">
          Current Sentences ({sentences.length})
        </h3>

        {sentences.length === 0 ? (
          <p className="rounded-2xl bg-white border border-[#EAE1DE] p-4 text-[16px] text-[#5E5458]">
            No sentences yet. Add one above or import JSON below.
          </p>
        ) : (
          sentences.map((s, idx) => (
            <div
              key={s.id}
              className="rounded-2xl bg-white border border-[#EAE1DE] p-3.5 flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] text-[#5E5458]">
                    <span className="font-mono-nums font-semibold text-[#9D244B]">
                      {idx + 1}.
                    </span>{' '}
                    {s.speaker} ·{' '}
                    <span className="font-mono-nums">
                      {s.start.toFixed(1)}s–{s.end.toFixed(1)}s
                    </span>
                  </p>
                  <p className="text-[17px] font-medium text-[#1F1A1C] mt-0.5 leading-snug">
                    {s.text}
                  </p>
                  {s.korean && (
                    <p className="text-[13px] text-[#5E5458] mt-0.5">{s.korean}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#F2ECE9]">
                <button
                  type="button"
                  onClick={() => onTestSegment(s.start, s.end)}
                  aria-label={`Test sentence ${idx + 1}`}
                  className="min-w-[48px] min-h-[48px] px-2.5 rounded-xl bg-[#FAF8F6] hover:bg-white border border-[#EAE1DE] text-[#1F1A1C] inline-flex items-center justify-center cursor-pointer"
                >
                  <Play className="w-4 h-4 text-[#9D244B]" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0}
                  aria-label={`Move sentence ${idx + 1} up`}
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-[#FAF8F6] hover:bg-white border border-[#EAE1DE] text-[#1F1A1C] disabled:opacity-35 inline-flex items-center justify-center cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === sentences.length - 1}
                  aria-label={`Move sentence ${idx + 1} down`}
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-[#FAF8F6] hover:bg-white border border-[#EAE1DE] text-[#1F1A1C] disabled:opacity-35 inline-flex items-center justify-center cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => handleStartEdit(s)}
                  aria-label={`Edit sentence ${idx + 1}`}
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-[#FAF8F6] hover:bg-[#FFF8DB] border border-[#EAE1DE] text-[#1F1A1C] inline-flex items-center justify-center cursor-pointer"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  aria-label={`Delete sentence ${idx + 1}`}
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-[#FAF8F6] hover:bg-[#FDF1F5] border border-[#EAE1DE] text-[#9D244B] inline-flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Export / Import JSON & Reset */}
      <section className="rounded-2xl bg-white border border-[#EAE1DE] p-4 flex flex-col gap-3">
        <h3 className="font-display text-[17px] font-semibold text-[#1F1A1C]">
          Export &amp; Import / 내보내기 · 가져오기
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="min-h-[48px] px-3 py-2 rounded-xl bg-[#FAF8F6] hover:bg-white border border-[#EAE1DE] text-[#1F1A1C] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedJson ? (
              <Copy className="w-4 h-4 text-[#15803D] shrink-0" aria-hidden="true" />
            ) : (
              <Download className="w-4 h-4 text-[#9D244B] shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[14px] font-semibold">
                {copiedJson ? 'Copied JSON!' : 'Export'}
              </span>
              <span className="text-[11px] text-[#5E5458]">JSON 복사</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            className="min-h-[48px] px-3 py-2 rounded-xl bg-[#FAF8F6] hover:bg-white border border-[#EAE1DE] text-[#1F1A1C] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#9D244B] shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight text-left">
              <span className="text-[14px] font-semibold">Import</span>
              <span className="text-[11px] text-[#5E5458]">JSON 붙여넣기</span>
            </span>
          </button>
        </div>

        {showImport && (
          <div className="flex flex-col gap-2.5 pt-1">
            <textarea
              rows={5}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='Paste JSON array here, e.g. [{"id":1,"speaker":"Judy","text":"...","korean":"...","stress":[],"start":46.0,"end":48.0}]'
              className="p-3 rounded-xl border border-[#DDD2CE] bg-[#FAF8F6] font-mono text-[13px] text-[#1F1A1C] focus:outline-none focus:border-[#C93B68]"
            />
            {importError && (
              <p className="text-[13px] font-medium text-[#9D244B]">{importError}</p>
            )}
            <button
              type="button"
              onClick={handleImportSubmit}
              className="min-h-[48px] px-4 py-2 rounded-xl bg-[#C93B68] hover:bg-[#B12F58] text-white text-[14px] font-semibold cursor-pointer"
            >
              Load JSON / 불러오기
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onResetDefaults}
          className="min-h-[48px] px-3 py-2 rounded-xl bg-white hover:bg-[#FFF8DB] border border-[#EAE1DE] text-[#5E5458] hover:text-[#5C3D00] text-[14px] font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Reset to Zootopia Starter List / 기본 문장으로 초기화</span>
        </button>
      </section>
    </div>
  );
}
