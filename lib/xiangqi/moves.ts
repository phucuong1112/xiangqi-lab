import { isOnBoard, pieceAt } from "./board";
import type { BoardState, Move, Position, Side } from "./board";

function opponent(side: Side): Side {
  return side === "red" ? "black" : "red";
}

function toMove(state: BoardState, from: Position, to: Position): Move {
  const piece = pieceAt(state, from);
  if (!piece) throw new Error(`No piece at rank ${from.rank}, file ${from.file}`);
  return { from, to, piece, captured: pieceAt(state, to) };
}

function isPalace(pos: Position, side: Side): boolean {
  if (pos.file < 3 || pos.file > 5) return false;
  return side === "black" ? pos.rank <= 2 : pos.rank >= 7;
}

function hasCrossedRiver(pos: Position, side: Side): boolean {
  return side === "black" ? pos.rank > 4 : pos.rank < 5;
}

function stepMoves(
  state: BoardState,
  from: Position,
  side: Side,
  deltas: [number, number][],
  withinPalace: boolean,
): Move[] {
  const moves: Move[] = [];
  for (const [dr, df] of deltas) {
    const to: Position = { rank: from.rank + dr, file: from.file + df };
    if (!isOnBoard(to)) continue;
    if (withinPalace && !isPalace(to, side)) continue;
    const target = pieceAt(state, to);
    if (target && target.side === side) continue;
    moves.push(toMove(state, from, to));
  }
  return moves;
}

export function generalMoves(state: BoardState, from: Position, side: Side): Move[] {
  return stepMoves(
    state,
    from,
    side,
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ],
    true,
  );
}

export function advisorMoves(state: BoardState, from: Position, side: Side): Move[] {
  return stepMoves(
    state,
    from,
    side,
    [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ],
    true,
  );
}

export function elephantMoves(state: BoardState, from: Position, side: Side): Move[] {
  const moves: Move[] = [];
  const deltas: [number, number][] = [
    [2, 2],
    [2, -2],
    [-2, 2],
    [-2, -2],
  ];
  for (const [dr, df] of deltas) {
    const to: Position = { rank: from.rank + dr, file: from.file + df };
    if (!isOnBoard(to)) continue;
    if (hasCrossedRiver(to, side)) continue;
    const eye: Position = { rank: from.rank + dr / 2, file: from.file + df / 2 };
    if (pieceAt(state, eye)) continue;
    const target = pieceAt(state, to);
    if (target && target.side === side) continue;
    moves.push(toMove(state, from, to));
  }
  return moves;
}

export function horseMoves(state: BoardState, from: Position, side: Side): Move[] {
  const moves: Move[] = [];
  const deltas: [number, number, number, number][] = [
    [2, 1, 1, 0],
    [2, -1, 1, 0],
    [-2, 1, -1, 0],
    [-2, -1, -1, 0],
    [1, 2, 0, 1],
    [-1, 2, 0, 1],
    [1, -2, 0, -1],
    [-1, -2, 0, -1],
  ];
  for (const [dr, df, legRank, legFile] of deltas) {
    const to: Position = { rank: from.rank + dr, file: from.file + df };
    if (!isOnBoard(to)) continue;
    const leg: Position = { rank: from.rank + legRank, file: from.file + legFile };
    if (pieceAt(state, leg)) continue;
    const target = pieceAt(state, to);
    if (target && target.side === side) continue;
    moves.push(toMove(state, from, to));
  }
  return moves;
}

const ORTHOGONAL: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function chariotMoves(state: BoardState, from: Position, side: Side): Move[] {
  const moves: Move[] = [];
  for (const [dr, df] of ORTHOGONAL) {
    let to: Position = { rank: from.rank + dr, file: from.file + df };
    while (isOnBoard(to)) {
      const target = pieceAt(state, to);
      if (!target) {
        moves.push(toMove(state, from, to));
      } else {
        if (target.side !== side) moves.push(toMove(state, from, to));
        break;
      }
      to = { rank: to.rank + dr, file: to.file + df };
    }
  }
  return moves;
}

export function cannonMoves(state: BoardState, from: Position, side: Side): Move[] {
  const moves: Move[] = [];
  for (const [dr, df] of ORTHOGONAL) {
    let to: Position = { rank: from.rank + dr, file: from.file + df };
    let screenFound = false;
    while (isOnBoard(to)) {
      const target = pieceAt(state, to);
      if (!screenFound) {
        if (!target) {
          moves.push(toMove(state, from, to));
        } else {
          screenFound = true;
        }
      } else if (target) {
        if (target.side !== side) moves.push(toMove(state, from, to));
        break;
      }
      to = { rank: to.rank + dr, file: to.file + df };
    }
  }
  return moves;
}

export function soldierMoves(state: BoardState, from: Position, side: Side): Move[] {
  const forward = side === "black" ? 1 : -1;
  const deltas: [number, number][] = [[forward, 0]];
  if (hasCrossedRiver(from, side)) {
    deltas.push([0, 1], [0, -1]);
  }
  return stepMoves(state, from, side, deltas, false);
}

export function pseudoLegalMoves(state: BoardState, from: Position): Move[] {
  const piece = pieceAt(state, from);
  if (!piece) return [];
  switch (piece.type) {
    case "general":
      return generalMoves(state, from, piece.side);
    case "advisor":
      return advisorMoves(state, from, piece.side);
    case "elephant":
      return elephantMoves(state, from, piece.side);
    case "horse":
      return horseMoves(state, from, piece.side);
    case "chariot":
      return chariotMoves(state, from, piece.side);
    case "cannon":
      return cannonMoves(state, from, piece.side);
    case "soldier":
      return soldierMoves(state, from, piece.side);
  }
}

export function allPseudoLegalMoves(state: BoardState, side: Side): Move[] {
  const moves: Move[] = [];
  for (let rank = 0; rank <= 9; rank++) {
    for (let file = 0; file <= 8; file++) {
      const piece = state.grid[rank][file];
      if (piece && piece.side === side) {
        moves.push(...pseudoLegalMoves(state, { rank, file }));
      }
    }
  }
  return moves;
}

export { opponent };
