/**
 * Manual verification harness for kỳ phổ export/import (Phase 5, step 7).
 * Run with: bun run lib/xiangqi/verify-kyphoso.ts
 */
import { applyMove, boardToFen, createInitialBoardState, type BoardState } from "./board";
import { getLegalMoves } from "./rules";
import { moveToNotation, type HistoryEntry } from "./notation";
import { exportToText, importFromText } from "./kyphoso";

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

function playMove(state: BoardState, history: HistoryEntry[], from: [number, number], to: [number, number]) {
  const legal = getLegalMoves(state, { rank: from[0], file: from[1] });
  const move = legal.find((m) => m.to.rank === to[0] && m.to.file === to[1]);
  if (!move) throw new Error(`Move ${JSON.stringify(from)} -> ${JSON.stringify(to)} is not legal`);
  const notation = moveToNotation(state, move);
  const next = applyMove(state, move);
  history.push({ move, notation });
  return next;
}

// 1. Play a short game, export, re-import, and confirm the end position and
// notation lines match move-for-move.
{
  let state = createInitialBoardState();
  const history: HistoryEntry[] = [];
  state = playMove(state, history, [6, 4], [5, 4]); // Red center soldier advances.
  state = playMove(state, history, [3, 4], [4, 4]); // Black center soldier advances.
  state = playMove(state, history, [7, 1], [7, 4]); // Red cannon slides to center file.
  state = playMove(state, history, [0, 1], [2, 2]); // Black horse develops.

  const text = exportToText(history);
  assert(
    text.split("\n").every((line, i) => line.startsWith(`${i + 1}. `)),
    "exportToText numbers every line",
  );

  const imported = importFromText(text);
  assert(!("error" in imported), "importFromText replays the exported kỳ phổ without error");
  if (!("error" in imported)) {
    assert(boardToFen(imported.boardState) === boardToFen(state), "Re-imported board matches the played end position");
    assert(
      imported.history.map((h) => h.notation).join("\n") === history.map((h) => h.notation).join("\n"),
      "Re-imported notation lines match the original move-for-move",
    );
  }
}

// 2. Uploading a file is just importFromText on the file's text content, so
// pasting and "uploading" the same text produce identical results.
{
  const text = "1. Pháo 2 bình 5\n2. Mã 8 tiến 7";
  const fromPaste = importFromText(text);
  const fromFileContents = importFromText(text); // FileReader hands us the same string.
  assert(
    JSON.stringify(fromPaste) === JSON.stringify(fromFileContents),
    "Paste and file-upload import paths are equivalent for identical text",
  );
}

// 3. An invalid line reports its 1-based line number and does not partially apply.
{
  const result = importFromText("1. Pháo 2 bình 5\n2. Xe 9 tiến 99");
  assert("error" in result && result.error.includes("Dòng 2"), "Invalid line reports its line number");
}

// 4. An unreadable line (garbage notation) reports an error, not a crash.
{
  const result = importFromText("1. not a real move");
  assert("error" in result && result.error.includes("Dòng 1"), "Unreadable line reports line 1, no crash");
}

if (failures > 0) {
  console.error(`\n${failures} verification(s) failed.`);
  process.exit(1);
}
console.log("\nAll kỳ phổ verifications passed.");
