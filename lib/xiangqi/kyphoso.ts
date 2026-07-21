import { applyMove, createInitialBoardState, type BoardState } from "./board";
import { moveToNotation, parseFullNotation, resolveFullNotation, type HistoryEntry } from "./notation";

export function exportToText(history: HistoryEntry[]): string {
  return history.map((entry, index) => `${index + 1}. ${entry.notation}`).join("\n");
}

/** Triggers a browser download of the kỳ phổ as a UTF-8 .txt file. Client-only (uses Blob/URL/DOM APIs). */
export function downloadKyPhoText(history: HistoryEntry[], filename = "kyphoso.txt"): void {
  const text = exportToText(history);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  boardState: BoardState;
  history: HistoryEntry[];
}

export interface ImportError {
  error: string;
  lineNumber: number;
}

/** Strips a leading move-number prefix such as "1." or "12)". */
const LINE_NUMBER_PREFIX = /^\s*\d+[.)]\s*/;

/**
 * Replays a kỳ phổ (one full-notation move per line, e.g. "1. Pháo 2 bình 5")
 * from a fresh board. Stops at the first unreadable or illegal line and
 * reports it by 1-based line number without returning a partially-applied
 * board — callers only ever see either a complete replay or an error.
 */
export function importFromText(text: string): ImportResult | ImportError {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let state = createInitialBoardState();
  const history: HistoryEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const content = lines[i].replace(LINE_NUMBER_PREFIX, "");

    const intent = parseFullNotation(content);
    if (!intent) {
      return { error: `Dòng ${lineNumber}: không đọc được ký hiệu "${lines[i]}"`, lineNumber };
    }

    const resolved = resolveFullNotation(state, intent);
    if ("error" in resolved) {
      return { error: `Dòng ${lineNumber}: ${resolved.error} ("${lines[i]}")`, lineNumber };
    }

    const notation = moveToNotation(state, resolved);
    state = applyMove(state, resolved);
    history.push({ move: resolved, notation });
  }

  return { boardState: state, history };
}
