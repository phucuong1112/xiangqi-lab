import type { PieceType, Side } from "./board";

/** Traditional Hán character shown on each piece token, side-specific per idea.md. */
export const PIECE_GLYPHS: Record<PieceType, Record<Side, string>> = {
  general: { red: "帥", black: "將" },
  advisor: { red: "仕", black: "士" },
  elephant: { red: "相", black: "象" },
  horse: { red: "馬", black: "馬" },
  chariot: { red: "車", black: "車" },
  cannon: { red: "炮", black: "砲" },
  soldier: { red: "兵", black: "卒" },
};

export function pieceGlyph(type: PieceType, side: Side): string {
  return PIECE_GLYPHS[type][side];
}
