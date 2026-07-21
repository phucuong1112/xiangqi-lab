import type { PieceType, Side } from "./board";

export const PIECE_NAMES: Record<PieceType, string | { red: string; black: string }> = {
  general: "Tướng",
  advisor: "Sĩ",
  elephant: "Tượng",
  horse: "Mã",
  chariot: "Xe",
  cannon: "Pháo",
  soldier: { red: "Binh", black: "Tốt" },
};

export function pieceDisplayName(type: PieceType, side: Side): string {
  const entry = PIECE_NAMES[type];
  return typeof entry === "string" ? entry : entry[side];
}

export const DIRECTION_WORDS = {
  tien: "tiến",
  thoai: "thoái",
  binh: "bình",
} as const;

export type MoveDirection = keyof typeof DIRECTION_WORDS;

/**
 * Both sides count columns 1-9 right-to-left from their OWN perspective
 * (mirrored on-screen), per idea.md's worked examples. This is the single
 * source of truth for that mapping — never re-derive it elsewhere.
 * Board file 0 is the leftmost file in the top-down (Black-at-top) grid
 * orientation defined in board.ts.
 */
export function columnForSide(file: number, side: Side): number {
  return side === "red" ? 9 - file : file + 1;
}

export function fileForColumn(column: number, side: Side): number {
  return side === "red" ? 9 - column : column - 1;
}

export const SHORTHAND_PIECE_MAP: Record<string, PieceType> = {
  P: "cannon",
  X: "chariot",
  M: "horse",
  S: "advisor",
  T: "elephant",
  V: "general",
  TG: "general",
  B: "soldier",
  C: "soldier",
};

export const SHORTHAND_DIRECTION_MAP: Record<string, MoveDirection> = {
  B: "binh",
  T: "tien",
  TH: "thoai",
};
