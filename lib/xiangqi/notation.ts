import type { BoardState, Move, PieceType, Position, Side } from "./board";
import { getLegalMoves } from "./rules";
import {
  DIRECTION_WORDS,
  PIECE_NAMES,
  SHORTHAND_DIRECTION_MAP,
  SHORTHAND_PIECE_MAP,
  columnForSide,
  fileForColumn,
  pieceDisplayName,
  type MoveDirection,
} from "./notation-constants";

export type NotationString = string;

export interface NotationEntry {
  move: Move;
  notation: NotationString;
}

export interface HistoryEntry {
  move: Move;
  notation: NotationString;
}

interface MoveGeometry {
  direction: MoveDirection;
  number: number;
}

/**
 * Classifies a move into tiến/thoái/bình + its notation number purely from
 * move geometry, which uniformly covers every piece type:
 * - same rank, different file -> bình, number = destination column.
 * - same file, different rank -> tiến/thoái, number = squares moved.
 * - both rank and file change (Mã/Tượng/Sĩ) -> tiến/thoái, number =
 *   destination column (there is no single "distance" for a diagonal/L move).
 */
function describeMoveGeometry(move: Move, side: Side): MoveGeometry {
  const sameFile = move.to.file === move.from.file;
  const sameRank = move.to.rank === move.from.rank;
  if (sameRank && !sameFile) {
    return { direction: "binh", number: columnForSide(move.to.file, side) };
  }
  const advancing = side === "red" ? move.to.rank < move.from.rank : move.to.rank > move.from.rank;
  const direction: MoveDirection = advancing ? "tien" : "thoai";
  const number = sameFile ? Math.abs(move.to.rank - move.from.rank) : columnForSide(move.to.file, side);
  return { direction, number };
}

function samePieceRanksOnFile(state: BoardState, move: Move): number[] {
  const { from, piece } = move;
  const ranks: number[] = [];
  for (let rank = 0; rank <= 9; rank++) {
    const other = state.grid[rank][from.file];
    if (other && other.side === piece.side && other.type === piece.type) {
      ranks.push(rank);
    }
  }
  return ranks;
}

export const ORDINAL_LABELS = ["trước", "nhị", "tam", "tứ", "ngũ"];

/**
 * "trước"/"sau" (front/back) when exactly two same-type, same-side pieces
 * share the origin file; an ordinal ("trước"/"nhị"/"tam"/...) counted from
 * the side closest to the opponent when 3+ share the file (e.g. stacked
 * soldiers); null when no disambiguation is needed. Must be called with the
 * board state BEFORE this move is applied — it locates peers by scanning
 * `move.from.file` for other pieces of the same type/side, which requires
 * the mover to still be on its origin square.
 */
function disambiguationLabel(state: BoardState, move: Move): string | null {
  const ranks = samePieceRanksOnFile(state, move);
  if (ranks.length < 2) return null;
  const side = move.piece.side;
  // Order from closest-to-opponent (front) to closest-to-own-side (back).
  const ordered = side === "red" ? [...ranks].sort((a, b) => a - b) : [...ranks].sort((a, b) => b - a);
  const index = ordered.indexOf(move.from.rank);
  if (ranks.length === 2) return index === 0 ? "trước" : "sau";
  return ORDINAL_LABELS[index] ?? String(index + 1);
}

export function moveToNotation(state: BoardState, move: Move): string {
  const side = move.piece.side;
  const pieceName = pieceDisplayName(move.piece.type, side);
  const { direction, number } = describeMoveGeometry(move, side);
  const origin = disambiguationLabel(state, move) ?? String(columnForSide(move.from.file, side));
  return `${pieceName} ${origin} ${DIRECTION_WORDS[direction]} ${number}`;
}

export interface ShorthandIntent {
  pieceType: PieceType;
  fromColumn: number;
  direction: MoveDirection;
  target: number;
}

const SHORTHAND_PATTERN = /^\s*(TG|[PXMSTVBC])([1-9])(TH|B|T)([1-9])\s*$/i;

export function parseShorthand(input: string): ShorthandIntent | null {
  const match = SHORTHAND_PATTERN.exec(input.trim());
  if (!match) return null;
  const [, pieceCode, fromColumn, directionCode] = match;
  const target = match[4];
  const pieceType = SHORTHAND_PIECE_MAP[pieceCode.toUpperCase()];
  const direction = SHORTHAND_DIRECTION_MAP[directionCode.toUpperCase()];
  if (!pieceType || !direction) return null;
  return {
    pieceType,
    fromColumn: Number(fromColumn),
    direction,
    target: Number(target),
  };
}

function resolveAgainstCandidates(
  state: BoardState,
  candidates: Position[],
  side: Side,
  direction: MoveDirection,
  target: number,
): Move | { error: string } {
  if (candidates.length === 0) {
    return { error: "Nước đi không hợp lệ" };
  }

  const matches: Move[] = [];
  for (const from of candidates) {
    for (const move of getLegalMoves(state, from)) {
      const geometry = describeMoveGeometry(move, side);
      if (geometry.direction === direction && geometry.number === target) {
        matches.push(move);
      }
    }
  }

  if (matches.length === 0) return { error: "Nước đi không hợp lệ" };
  if (matches.length > 1) return { error: "Ký hiệu không rõ ràng" };
  return matches[0];
}

export function resolveShorthand(state: BoardState, intent: ShorthandIntent): Move | { error: string } {
  const side = state.sideToMove;
  const candidates = candidatesForColumn(state, intent.pieceType, side, intent.fromColumn);
  return resolveAgainstCandidates(state, candidates, side, intent.direction, intent.target);
}

function candidatesForColumn(state: BoardState, pieceType: PieceType, side: Side, column: number): Position[] {
  const file = fileForColumn(column, side);
  const candidates: Position[] = [];
  for (let rank = 0; rank <= 9; rank++) {
    const piece = state.grid[rank]?.[file];
    if (piece && piece.side === side && piece.type === pieceType) candidates.push({ rank, file });
  }
  return candidates;
}

const PIECE_NAME_TO_TYPE: Record<string, PieceType> = (() => {
  const map: Record<string, PieceType> = {};
  (Object.keys(PIECE_NAMES) as PieceType[]).forEach((type) => {
    const entry = PIECE_NAMES[type];
    if (typeof entry === "string") {
      map[entry] = type;
    } else {
      map[entry.red] = type;
      map[entry.black] = type;
    }
  });
  return map;
})();

const WORD_TO_DIRECTION: Record<string, MoveDirection> = {
  [DIRECTION_WORDS.tien]: "tien",
  [DIRECTION_WORDS.thoai]: "thoai",
  [DIRECTION_WORDS.binh]: "binh",
};

export type NotationOrigin = { kind: "column"; column: number } | { kind: "label"; label: string };

export interface FullNotationIntent {
  pieceType: PieceType;
  origin: NotationOrigin;
  direction: MoveDirection;
  target: number;
}

/**
 * Parses one line of full-form Vietnamese notation (as produced by
 * `moveToNotation` and written in a kỳ phổ), e.g. "Pháo 2 bình 5" or
 * "Xe trước tiến 1". Any leading move-number prefix must already be stripped
 * by the caller (see `kyphoso.ts`).
 */
export function parseFullNotation(line: string): FullNotationIntent | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length !== 4) return null;
  const [pieceWord, originWord, directionWord, targetWord] = tokens;

  const pieceType = PIECE_NAME_TO_TYPE[pieceWord];
  const direction = WORD_TO_DIRECTION[directionWord];
  const target = Number(targetWord);
  if (!pieceType || !direction || !/^[1-9]$/.test(targetWord) || Number.isNaN(target)) {
    return null;
  }

  if (/^[1-9]$/.test(originWord)) {
    return { pieceType, origin: { kind: "column", column: Number(originWord) }, direction, target };
  }
  if (originWord === "sau" || ORDINAL_LABELS.includes(originWord)) {
    return { pieceType, origin: { kind: "label", label: originWord }, direction, target };
  }
  return null;
}

function candidatesForLabel(state: BoardState, pieceType: PieceType, side: Side, label: string): Position[] {
  const candidates: Position[] = [];
  for (let file = 0; file <= 8; file++) {
    const ranksOnFile: number[] = [];
    for (let rank = 0; rank <= 9; rank++) {
      const piece = state.grid[rank][file];
      if (piece && piece.side === side && piece.type === pieceType) ranksOnFile.push(rank);
    }
    if (ranksOnFile.length < 2) continue;

    const ordered = side === "red" ? [...ranksOnFile].sort((a, b) => a - b) : [...ranksOnFile].sort((a, b) => b - a);
    let index: number;
    if (label === "trước") index = 0;
    else if (label === "sau") index = ranksOnFile.length === 2 ? 1 : -1;
    else index = ranksOnFile.length >= 3 ? ORDINAL_LABELS.indexOf(label) : -1;

    if (index >= 0 && index < ordered.length) {
      candidates.push({ rank: ordered[index], file });
    }
  }
  return candidates;
}

export function resolveFullNotation(state: BoardState, intent: FullNotationIntent): Move | { error: string } {
  const side = state.sideToMove;
  const candidates =
    intent.origin.kind === "column"
      ? candidatesForColumn(state, intent.pieceType, side, intent.origin.column)
      : candidatesForLabel(state, intent.pieceType, side, intent.origin.label);

  return resolveAgainstCandidates(state, candidates, side, intent.direction, intent.target);
}
