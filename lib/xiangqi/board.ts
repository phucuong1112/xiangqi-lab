export type Side = "red" | "black";

export type PieceType =
  | "general"
  | "advisor"
  | "elephant"
  | "horse"
  | "chariot"
  | "cannon"
  | "soldier";

export interface Piece {
  type: PieceType;
  side: Side;
}

export type Square = Piece | null;

/**
 * 10 ranks x 9 files. rank 0 is Black's back rank (top), rank 9 is Red's
 * back rank (bottom); file 0 is the leftmost file in that same top-down
 * orientation. The river lies between rank 4 (Black side) and rank 5 (Red
 * side). This orientation is fixed here and must not be redefined downstream.
 */
export type Grid = Square[][];

export interface Position {
  rank: number;
  file: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured: Square;
}

export interface BoardState {
  grid: Grid;
  sideToMove: Side;
  history: Move[];
}

const BACK_RANK: PieceType[] = [
  "chariot",
  "horse",
  "elephant",
  "advisor",
  "general",
  "advisor",
  "elephant",
  "horse",
  "chariot",
];

export function createInitialBoardState(): BoardState {
  const grid: Grid = Array.from({ length: 10 }, () => Array<Square>(9).fill(null));

  BACK_RANK.forEach((type, file) => {
    grid[0][file] = { type, side: "black" };
    grid[9][file] = { type, side: "red" };
  });
  grid[2][1] = { type: "cannon", side: "black" };
  grid[2][7] = { type: "cannon", side: "black" };
  grid[7][1] = { type: "cannon", side: "red" };
  grid[7][7] = { type: "cannon", side: "red" };
  for (const file of [0, 2, 4, 6, 8]) {
    grid[3][file] = { type: "soldier", side: "black" };
    grid[6][file] = { type: "soldier", side: "red" };
  }

  return { grid, sideToMove: "red", history: [] };
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

export function pieceAt(state: BoardState, pos: Position): Square {
  return state.grid[pos.rank]?.[pos.file] ?? null;
}

export function isOnBoard(pos: Position): boolean {
  return pos.rank >= 0 && pos.rank <= 9 && pos.file >= 0 && pos.file <= 8;
}

export function applyMove(state: BoardState, move: Move): BoardState {
  const grid = cloneGrid(state.grid);
  grid[move.from.rank][move.from.file] = null;
  grid[move.to.rank][move.to.file] = move.piece;
  return {
    grid,
    sideToMove: move.piece.side === "red" ? "black" : "red",
    history: [...state.history, move],
  };
}

const FEN_LETTERS: Record<PieceType, string> = {
  general: "k",
  advisor: "a",
  elephant: "b",
  horse: "n",
  chariot: "r",
  cannon: "c",
  soldier: "p",
};

const FEN_LETTER_TO_TYPE: Record<string, PieceType> = Object.fromEntries(
  Object.entries(FEN_LETTERS).map(([type, letter]) => [letter, type as PieceType]),
);

export function boardToFen(state: BoardState): string {
  const rows = state.grid.map((row) => {
    let out = "";
    let emptyRun = 0;
    for (const square of row) {
      if (!square) {
        emptyRun += 1;
        continue;
      }
      if (emptyRun > 0) {
        out += String(emptyRun);
        emptyRun = 0;
      }
      const letter = FEN_LETTERS[square.type];
      out += square.side === "red" ? letter.toUpperCase() : letter;
    }
    if (emptyRun > 0) out += String(emptyRun);
    return out;
  });
  return `${rows.join("/")} ${state.sideToMove === "red" ? "w" : "b"}`;
}

export function fenToBoard(fen: string): BoardState {
  const [boardPart, sidePart] = fen.trim().split(/\s+/);
  const rows = boardPart.split("/");
  if (rows.length !== 10) {
    throw new Error(`Invalid Xiangqi FEN: expected 10 ranks, got ${rows.length}`);
  }
  const grid: Grid = rows.map((row) => {
    const squares: Square[] = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        squares.push(...Array<Square>(Number(char)).fill(null));
        continue;
      }
      const type = FEN_LETTER_TO_TYPE[char.toLowerCase()];
      if (!type) throw new Error(`Invalid Xiangqi FEN piece letter: ${char}`);
      squares.push({ type, side: char === char.toUpperCase() ? "red" : "black" });
    }
    if (squares.length !== 9) {
      throw new Error(`Invalid Xiangqi FEN rank width: ${row}`);
    }
    return squares;
  });
  return {
    grid,
    sideToMove: sidePart === "b" ? "black" : "red",
    history: [],
  };
}
