/**
 * Manual verification harness for replay cursor + branch-on-move semantics
 * (Phase 6, step 7). Run with: bun run lib/xiangqi/verify-replay-branch.ts
 */
import { boardToFen, createInitialBoardState, type BoardState } from "./board";
import { getLegalMoves } from "./rules";
import { moveToNotation, type HistoryEntry } from "./notation";
import { computeBoardStateAt } from "./game-store";
import { applyMove } from "./board";

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

function recordMove(
  state: BoardState,
  history: HistoryEntry[],
  from: [number, number],
  to: [number, number],
): BoardState {
  const legal = getLegalMoves(state, { rank: from[0], file: from[1] });
  const move = legal.find((m) => m.to.rank === to[0] && m.to.file === to[1]);
  if (!move) throw new Error(`Move ${JSON.stringify(from)} -> ${JSON.stringify(to)} is not legal`);
  const notation = moveToNotation(state, move);
  const next = applyMove(state, move);
  history.push({ move, notation });
  return next;
}

const initial = createInitialBoardState();
const history: HistoryEntry[] = [];
let state = initial;
state = recordMove(state, history, [6, 4], [5, 4]); // 1. Red center soldier advances.
state = recordMove(state, history, [3, 4], [4, 4]); // 2. Black center soldier advances.
state = recordMove(state, history, [7, 1], [7, 4]); // 3. Red cannon slides to center file.
const stateAfter3 = state;

// 1. Board at cursor N exactly matches replaying moves 0..N from scratch.
{
  const at0 = computeBoardStateAt(initial, history, 0);
  const at2 = computeBoardStateAt(initial, history, 2);
  const at3 = computeBoardStateAt(initial, history, 3);
  assert(boardToFen(at0) === boardToFen(initial), "Cursor 0 reproduces the initial position");
  assert(boardToFen(at3) === boardToFen(stateAfter3), "Cursor at latest reproduces the played end position");
  assert(at2.sideToMove === "red", "Cursor 2 correctly has Red to move (after 2 half-moves)");
}

// 2. Branch-on-move: moving a piece with the cursor behind latest truncates
// the tail and starts a clean new branch, leaving earlier moves intact.
{
  const cursorIndex = 2; // paused right after move 2 (Black's soldier push).
  const boardAtCursor = computeBoardStateAt(initial, history, cursorIndex);
  const legal = getLegalMoves(boardAtCursor, { rank: 7, file: 7 });
  const branchMove = legal.find((m) => m.to.rank === 7 && m.to.file === 4);
  if (!branchMove) throw new Error("Expected the right cannon to have a legal bình move to file 4");
  const branchNotation = moveToNotation(boardAtCursor, branchMove);

  // Emulates game-store.movePiece's branch truncation.
  const branchedHistory = history.slice(0, cursorIndex);
  branchedHistory.push({ move: branchMove, notation: branchNotation });

  assert(branchedHistory.length === 3, "Branch replaces the truncated tail with exactly one new move");
  assert(
    branchedHistory[0].notation === history[0].notation && branchedHistory[1].notation === history[1].notation,
    "Moves before the cursor are untouched by the branch",
  );
  assert(
    branchedHistory[2].notation !== history[2].notation,
    "The branched move differs from the original (now-discarded) move 3",
  );

  const branchedEnd = computeBoardStateAt(initial, branchedHistory, branchedHistory.length);
  assert(
    boardToFen(branchedEnd) !== boardToFen(stateAfter3),
    "Branched end position differs from the original (discarded) line's end position",
  );
}

if (failures > 0) {
  console.error(`\n${failures} verification(s) failed.`);
  process.exit(1);
}
console.log("\nAll replay/branch verifications passed.");
