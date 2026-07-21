/**
 * Manual verification harness for the Vietnamese notation system (Phase 3, step 6).
 * Run with: bun run lib/xiangqi/verify-notation.ts
 */
import { createInitialBoardState, fenToBoard, type Move } from "./board";
import { getLegalMoves } from "./rules";
import { moveToNotation, parseShorthand, resolveShorthand } from "./notation";

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

// 1. Shorthand parsing for the three idea.md worked examples.
{
  const p2b5 = parseShorthand("p2b5");
  assert(
    p2b5?.pieceType === "cannon" && p2b5.fromColumn === 2 && p2b5.direction === "binh" && p2b5.target === 5,
    "parseShorthand('p2b5') -> cannon, column 2, bình, target 5",
  );

  const x9t1 = parseShorthand("X9T1");
  assert(
    x9t1?.pieceType === "chariot" && x9t1.fromColumn === 9 && x9t1.direction === "tien" && x9t1.target === 1,
    "parseShorthand('X9T1') -> chariot, column 9, tiến, target 1",
  );

  const m2th3 = parseShorthand("m2th3");
  assert(
    m2th3?.pieceType === "horse" && m2th3.fromColumn === 2 && m2th3.direction === "thoai" && m2th3.target === 3,
    "parseShorthand('m2th3') -> horse, column 2, thoái, target 3",
  );

  assert(parseShorthand("not-a-move") === null, "parseShorthand returns null for unrecognized input");
}

// 2. moveToNotation + resolveShorthand round trip on a real board, matching
// the p2t2 shape from idea.md's Pháo example (a red cannon advancing).
{
  const state = createInitialBoardState();
  const intent = parseShorthand("p2t2");
  if (!intent) throw new Error("Expected 'p2t2' to parse");
  const resolved = resolveShorthand(state, intent);
  assert(!("error" in resolved), "resolveShorthand finds a legal move for 'p2t2' on the opening board");
  if (!("error" in resolved)) {
    assert(
      moveToNotation(state, resolved as Move) === "Pháo 2 tiến 2",
      "moveToNotation renders the resolved cannon move as 'Pháo 2 tiến 2'",
    );
  }
}

// 3. Same-file disambiguation (trước/sau) for two identical pieces.
{
  const state = fenToBoard("k8/9/9/9/9/9/4R4/9/4R4/8K w");
  const frontMoves = getLegalMoves(state, { rank: 6, file: 4 });
  const backMoves = getLegalMoves(state, { rank: 8, file: 4 });
  const frontAdvance = frontMoves.find((m) => m.to.rank === 5 && m.to.file === 4) as Move;
  const backAdvance = backMoves.find((m) => m.to.rank === 7 && m.to.file === 4) as Move;

  assert(
    moveToNotation(state, frontAdvance) === "Xe trước tiến 1",
    "Front chariot of a same-file pair is labeled 'trước'",
  );
  assert(
    moveToNotation(state, backAdvance) === "Xe sau tiến 1",
    "Back chariot of a same-file pair is labeled 'sau'",
  );

  const ambiguous = resolveShorthand(state, {
    pieceType: "chariot",
    fromColumn: 5,
    direction: "tien",
    target: 1,
  });
  assert(
    "error" in ambiguous && ambiguous.error === "Ký hiệu không rõ ràng",
    "Shorthand for a move both same-file pieces can make resolves as ambiguous",
  );
}

// 4. Three same-file pieces (e.g. stacked soldiers) get distinct ordinal labels.
{
  const state = fenToBoard("k8/9/4P4/9/4P4/9/4P4/9/9/8K w");
  const front = getLegalMoves(state, { rank: 2, file: 4 }).find((m) => m.to.rank === 1) as Move;
  const middle = getLegalMoves(state, { rank: 4, file: 4 }).find((m) => m.to.rank === 3) as Move;
  const back = getLegalMoves(state, { rank: 6, file: 4 }).find((m) => m.to.rank === 5) as Move;

  assert(moveToNotation(state, front).startsWith("Binh trước "), "Front of 3 same-file soldiers is labeled 'trước'");
  assert(moveToNotation(state, middle).startsWith("Binh nhị "), "Middle of 3 same-file soldiers is labeled 'nhị'");
  assert(moveToNotation(state, back).startsWith("Binh tam "), "Back of 3 same-file soldiers is labeled 'tam'");
}

// 5. Invalid shorthand resolves to a clear error, not a crash.
{
  const state = createInitialBoardState();
  const noSuchMove = resolveShorthand(state, {
    pieceType: "chariot",
    fromColumn: 9,
    direction: "tien",
    target: 9,
  });
  assert(
    "error" in noSuchMove && noSuchMove.error === "Nước đi không hợp lệ",
    "Illegal shorthand target resolves to a Vietnamese error message",
  );
}

if (failures > 0) {
  console.error(`\n${failures} verification(s) failed.`);
  process.exit(1);
}
console.log("\nAll notation verifications passed.");
