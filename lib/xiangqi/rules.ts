import { applyMove } from "./board";
import type { BoardState, Move, Position, Side } from "./board";
import { allPseudoLegalMoves, opponent, pseudoLegalMoves } from "./moves";

function findGeneral(state: BoardState, side: Side): Position | null {
  for (let rank = 0; rank <= 9; rank++) {
    for (let file = 0; file <= 8; file++) {
      const piece = state.grid[rank][file];
      if (piece && piece.side === side && piece.type === "general") {
        return { rank, file };
      }
    }
  }
  return null;
}

/** True when both generals share a file with no pieces between them. */
function generalsFacing(state: BoardState): boolean {
  const red = findGeneral(state, "red");
  const black = findGeneral(state, "black");
  if (!red || !black || red.file !== black.file) return false;
  const [top, bottom] = red.rank < black.rank ? [red, black] : [black, red];
  for (let rank = top.rank + 1; rank < bottom.rank; rank++) {
    if (state.grid[rank][top.file]) return false;
  }
  return true;
}

export function isSquareAttacked(state: BoardState, target: Position, bySide: Side): boolean {
  return allPseudoLegalMoves(state, bySide).some(
    (move) => move.to.rank === target.rank && move.to.file === target.file,
  );
}

export function isInCheck(state: BoardState, side: Side): boolean {
  const generalPos = findGeneral(state, side);
  if (!generalPos) return false;
  if (isSquareAttacked(state, generalPos, opponent(side))) return true;
  return generalsFacing(state);
}

export function isLegalMove(state: BoardState, move: Move): boolean {
  const next = applyMove(state, move);
  return !isInCheck(next, move.piece.side);
}

export function getLegalMoves(state: BoardState, from: Position): Move[] {
  return pseudoLegalMoves(state, from).filter((move) => isLegalMove(state, move));
}

export function getAllLegalMoves(state: BoardState, side: Side): Move[] {
  const moves: Move[] = [];
  for (let rank = 0; rank <= 9; rank++) {
    for (let file = 0; file <= 8; file++) {
      const piece = state.grid[rank][file];
      if (piece && piece.side === side) {
        moves.push(...getLegalMoves(state, { rank, file }));
      }
    }
  }
  return moves;
}

export function isCheckmate(state: BoardState, side: Side): boolean {
  return isInCheck(state, side) && getAllLegalMoves(state, side).length === 0;
}

export function isStalemate(state: BoardState, side: Side): boolean {
  return !isInCheck(state, side) && getAllLegalMoves(state, side).length === 0;
}
