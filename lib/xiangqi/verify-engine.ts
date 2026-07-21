/**
 * Manual verification harness for the Xiangqi engine (Phase 2, step 8).
 * Run with: bun run lib/xiangqi/verify-engine.ts
 */
import {
  applyMove,
  boardToFen,
  createInitialBoardState,
  fenToBoard,
  type BoardState,
  type Move,
  type Position,
} from "./board";
import { getLegalMoves, isCheckmate } from "./rules";

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

function applyLegalMove(state: BoardState, from: Position, to: Position): BoardState {
  const legal = getLegalMoves(state, from);
  const found = legal.find((m) => m.to.rank === to.rank && m.to.file === to.file);
  if (!found) {
    throw new Error(`Move ${JSON.stringify(from)} -> ${JSON.stringify(to)} is not legal`);
  }
  return applyMove(state, found as Move);
}

// 1. Opening moves apply cleanly, and the corner chariot performs a
// multi-square slide across the two empty squares ahead of its own soldier.
{
  let state = createInitialBoardState();
  state = applyLegalMove(state, { rank: 6, file: 4 }, { rank: 5, file: 4 }); // Red center soldier advances.
  state = applyLegalMove(state, { rank: 3, file: 4 }, { rank: 4, file: 4 }); // Black center soldier advances.
  assert(state.sideToMove === "red", "Side to move alternates after each half-move");

  state = applyLegalMove(state, { rank: 9, file: 0 }, { rank: 7, file: 0 }); // Red left chariot slides 2 squares.
  assert(state.grid[7][0]?.type === "chariot", "Chariot performs a multi-square slide to its new square");
  assert(state.grid[9][0] === null, "Chariot's origin square is vacated after the slide");
}

// 2. Mã (horse) hobbled-leg block.
{
  const state = fenToBoard("9/9/9/9/9/9/1p7/1n7/9/4K4 w");
  const horseMoves = getLegalMoves(state, { rank: 7, file: 1 });
  const blocked = horseMoves.find((m) => m.to.rank === 5 && m.to.file === 2);
  assert(!blocked, "Horse move is blocked by a piece on its hobbling leg");
}

// 3. Pháo (cannon) capture requires exactly one screen piece.
{
  // Zero screens: adjacent enemy piece cannot be captured directly.
  const zeroScreen = fenToBoard("4k4/9/9/9/4R4/4c4/9/9/9/4K4 b");
  const zeroCapture = getLegalMoves(zeroScreen, { rank: 5, file: 4 }).find(
    (m) => m.to.rank === 4 && m.to.file === 4,
  );
  assert(!zeroCapture, "Cannon cannot capture an adjacent piece with zero screens between");

  // Exactly one screen: capture is legal.
  const oneScreen = fenToBoard("4k4/4R4/9/4p4/9/4c4/9/9/9/4K4 b");
  const oneCapture = getLegalMoves(oneScreen, { rank: 5, file: 4 }).find(
    (m) => m.to.rank === 1 && m.to.file === 4,
  );
  assert(!!oneCapture, "Cannon captures the enemy piece across exactly one screen");

  // Two screens: the far piece is unreachable — cannon can only meet the nearer one.
  const twoScreens = fenToBoard("4k4/4R4/4p4/4p4/9/4c4/9/9/9/4K4 b");
  const blockedCapture = getLegalMoves(twoScreens, { rank: 5, file: 4 }).find(
    (m) => m.to.rank === 1 && m.to.file === 4,
  );
  assert(!blockedCapture, "Cannon cannot reach past a second piece to capture the far target");
}

// 4. Flying-general: a move that opens a clear, unobstructed file between the
// two generals is illegal even though it is a normal one-step general move.
{
  const state = fenToBoard("3k5/9/9/9/9/9/9/9/9/4K4 w");
  const legal = getLegalMoves(state, { rank: 9, file: 4 });
  const facingMove = legal.find((m) => m.to.rank === 9 && m.to.file === 3);
  assert(!facingMove, "General cannot step onto a file that puts it in the open facing the opposing general");
}

// 5. Known checkmate sequence: an open-file back-rank chariot mates the
// opposing general when it has no escape or blocking piece available.
{
  const state = fenToBoard("3k5/9/9/9/9/9/9/9/9/3RK4 w");
  assert(isCheckmate(state, "black"), "Chariot delivers back-rank checkmate to the Black general");
}

// 6. FEN round trip.
{
  const state = createInitialBoardState();
  const fen = boardToFen(state);
  const restored = fenToBoard(fen);
  assert(boardToFen(restored) === fen, "FEN round-trip reproduces an identical board");
}

if (failures > 0) {
  console.error(`\n${failures} verification(s) failed.`);
  process.exit(1);
}
console.log("\nAll engine verifications passed.");
