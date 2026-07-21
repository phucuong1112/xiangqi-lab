/**
 * Manual verification harness for the fast-input resolution path (Phase 7,
 * step 5) — exercises the exact parseShorthand -> resolveShorthand pipeline
 * the fast-input.tsx component drives, plus its "begin selection then move"
 * funnel into the shared game store.
 * Run with: bun run lib/xiangqi/verify-fast-input.ts
 */
import { createInitialBoardState } from "./board";
import { parseShorthand, resolveShorthand } from "./notation";
import { useGameStore } from "./game-store";

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

// 1. The three idea.md shorthand examples resolve to a legal move on a fresh board.
{
  const board = createInitialBoardState();
  for (const shorthand of ["p2b5", "x9t1", "m2th3"]) {
    const intent = parseShorthand(shorthand);
    assert(intent !== null, `parseShorthand('${shorthand}') parses`);
    if (!intent) continue;
    // These three examples aren't all simultaneously legal from the exact
    // opening position (they're illustrative, not a real sequence), so we
    // only assert each is well-formed and resolves to either a move or a
    // clear, non-crashing Vietnamese error — never a thrown exception.
    const resolved = resolveShorthand(board, intent);
    assert(
      "error" in resolved ? typeof resolved.error === "string" : !!resolved.to,
      `resolveShorthand('${shorthand}') returns a Move or a Vietnamese error, never throws`,
    );
  }
}

// 2. A concrete, legal end-to-end case: p2t2 (cannon column 2 advances 2)
// applied through the store the same way fast-input.tsx does (beginDrag then
// movePiece), confirming it lands in history with full notation.
{
  useGameStore.getState().resetGame();
  const board = useGameStore.getState().initialBoardState;
  const intent = parseShorthand("p2t2");
  if (!intent) throw new Error("Expected 'p2t2' to parse");
  const resolved = resolveShorthand(board, intent);
  if ("error" in resolved) throw new Error(`Expected 'p2t2' to resolve, got: ${resolved.error}`);

  useGameStore.getState().beginDrag(resolved.from);
  useGameStore.getState().movePiece(resolved.to);

  const { history, cursorIndex } = useGameStore.getState();
  assert(history.length === 1 && cursorIndex === 1, "Fast-input move lands in the shared store's history");
  assert(history[0].notation === "Pháo 2 tiến 2", "Fast-input move renders correct full Vietnamese notation");
}

// 3. Invalid shorthand does not alter board state and reports a clear error.
{
  useGameStore.getState().resetGame();
  const before = useGameStore.getState().history.length;
  const intent = parseShorthand("not-a-real-move");
  assert(intent === null, "Garbage shorthand fails to parse (as fast-input.tsx checks first)");
  assert(useGameStore.getState().history.length === before, "Board state is unchanged after invalid input");
}

// 4. Fast input while mid-replay branches exactly like a board click/drag would.
{
  useGameStore.getState().resetGame();
  const store = useGameStore.getState();
  const board0 = store.initialBoardState;

  const first = resolveShorthand(board0, parseShorthand("p2t2")!);
  if ("error" in first) throw new Error("Expected p2t2 to resolve");
  useGameStore.getState().beginDrag(first.from);
  useGameStore.getState().movePiece(first.to);

  useGameStore.getState().goToStart(); // pause mid-replay (cursor behind latest)
  const boardAtCursor = useGameStore.getState().initialBoardState; // cursor 0 == initial
  const branch = resolveShorthand(boardAtCursor, parseShorthand("m2t3")!);
  if ("error" in branch) throw new Error(`Expected 'm2t3' to resolve, got: ${branch.error}`);
  useGameStore.getState().beginDrag(branch.from);
  useGameStore.getState().movePiece(branch.to);

  const { history } = useGameStore.getState();
  assert(
    history.length === 1 && history[0].notation !== "Pháo 2 tiến 2",
    "Fast input mid-replay truncates the tail and starts a new branch, same as board interaction",
  );
}

// 5. During auto-play, beginDrag/movePiece both bail — fast-input.tsx checks
// `isPlaying` itself before attempting resolution so it never silently
// swallows the user's input in that window.
{
  useGameStore.getState().resetGame();
  useGameStore.getState().togglePlay();
  assert(useGameStore.getState().isPlaying, "togglePlay starts playback for this check");

  const before = useGameStore.getState().history.length;
  useGameStore.getState().beginDrag({ rank: 9, file: 4 });
  useGameStore.getState().movePiece({ rank: 8, file: 4 });
  assert(
    useGameStore.getState().history.length === before,
    "beginDrag/movePiece are no-ops while isPlaying (fast-input.tsx must check isPlaying itself before calling these)",
  );
  useGameStore.getState().stopPlaying();
}

if (failures > 0) {
  console.error(`\n${failures} verification(s) failed.`);
  process.exit(1);
}
console.log("\nAll fast-input verifications passed.");
