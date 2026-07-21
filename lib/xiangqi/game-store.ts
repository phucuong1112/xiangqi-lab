import { useMemo } from "react";
import { create } from "zustand";
import { applyMove, createInitialBoardState, type BoardState, type Move, type Position } from "./board";
import { getLegalMoves, isCheckmate, isInCheck, isStalemate } from "./rules";
import { moveToNotation, type HistoryEntry } from "./notation";

export type { HistoryEntry };

export interface GameStatus {
  inCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
}

function computeStatus(state: BoardState): GameStatus {
  const side = state.sideToMove;
  return {
    inCheck: isInCheck(state, side),
    isCheckmate: isCheckmate(state, side),
    isStalemate: isStalemate(state, side),
  };
}

function samePosition(a: Position, b: Position): boolean {
  return a.rank === b.rank && a.file === b.file;
}

/** Board at `cursorIndex` moves into `history`, replayed fresh from `initial` each time (KISS — game lengths are small; no memoization needed). */
export function computeBoardStateAt(initial: BoardState, history: HistoryEntry[], cursorIndex: number): BoardState {
  let state = initial;
  for (let i = 0; i < cursorIndex; i++) {
    state = applyMove(state, history[i].move);
  }
  return state;
}

interface GameStoreState {
  initialBoardState: BoardState;
  history: HistoryEntry[];
  /** Number of moves from `history` applied to reach the currently-viewed position (0 = start, history.length = latest). */
  cursorIndex: number;
  isPlaying: boolean;
  selectedSquare: Position | null;
  legalTargets: Move[];

  selectSquare: (pos: Position) => void;
  beginDrag: (pos: Position) => void;
  movePiece: (to: Position) => void;
  resetGame: () => void;
  loadGame: (game: { boardState: BoardState; history: HistoryEntry[] }) => void;

  goToStart: () => void;
  stepBack: () => void;
  stepForward: () => void;
  goToLatest: () => void;
  /** Jumps directly to the position right after `index` moves (clamped to a valid range). Used by history-panel line clicks. */
  jumpTo: (index: number) => void;
  togglePlay: () => void;
  stopPlaying: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  initialBoardState: createInitialBoardState(),
  history: [],
  cursorIndex: 0,
  isPlaying: false,
  selectedSquare: null,
  legalTargets: [],

  selectSquare: (pos) => {
    const { selectedSquare, legalTargets } = get();
    if (selectedSquare && legalTargets.some((m) => samePosition(m.to, pos))) {
      get().movePiece(pos);
      return;
    }
    get().beginDrag(pos);
  },

  /** Selects the piece at `pos` for the mover's own side at the current cursor
   * position, or clears selection. Used both by click-to-select and as the
   * drag-start handler. */
  beginDrag: (pos) => {
    const { initialBoardState, history, cursorIndex, isPlaying } = get();
    if (isPlaying) return;
    const boardState = computeBoardStateAt(initialBoardState, history, cursorIndex);
    const status = computeStatus(boardState);
    if (status.isCheckmate || status.isStalemate) return;

    const piece = boardState.grid[pos.rank]?.[pos.file];
    if (!piece || piece.side !== boardState.sideToMove) {
      set({ selectedSquare: null, legalTargets: [] });
      return;
    }
    set({ selectedSquare: pos, legalTargets: getLegalMoves(boardState, pos) });
  },

  /** Applying a move while the cursor sits behind the latest move truncates
   * the future tail and starts a new branch from the cursor (silent discard,
   * no confirmation — confirmed v1 behavior). */
  movePiece: (to) => {
    const { initialBoardState, history, cursorIndex, selectedSquare, legalTargets, isPlaying } = get();
    if (isPlaying || !selectedSquare) return;
    const move = legalTargets.find((m) => samePosition(m.to, to));
    if (!move) return;

    const boardState = computeBoardStateAt(initialBoardState, history, cursorIndex);
    const notation = moveToNotation(boardState, move);
    const branchedHistory = cursorIndex < history.length ? history.slice(0, cursorIndex) : history;
    const nextHistory = [...branchedHistory, { move, notation }];

    set({
      history: nextHistory,
      cursorIndex: nextHistory.length,
      selectedSquare: null,
      legalTargets: [],
    });
  },

  resetGame: () => {
    set({
      initialBoardState: createInitialBoardState(),
      history: [],
      cursorIndex: 0,
      isPlaying: false,
      selectedSquare: null,
      legalTargets: [],
    });
  },

  loadGame: ({ history }) => {
    set({
      initialBoardState: createInitialBoardState(),
      history,
      cursorIndex: history.length,
      isPlaying: false,
      selectedSquare: null,
      legalTargets: [],
    });
  },

  goToStart: () => set({ cursorIndex: 0, selectedSquare: null, legalTargets: [] }),

  stepBack: () =>
    set((s) => ({ cursorIndex: Math.max(0, s.cursorIndex - 1), selectedSquare: null, legalTargets: [] })),

  stepForward: () =>
    set((s) => ({
      cursorIndex: Math.min(s.history.length, s.cursorIndex + 1),
      selectedSquare: null,
      legalTargets: [],
    })),

  goToLatest: () => set((s) => ({ cursorIndex: s.history.length, selectedSquare: null, legalTargets: [] })),

  jumpTo: (index) =>
    set((s) => ({
      cursorIndex: Math.max(0, Math.min(s.history.length, index)),
      selectedSquare: null,
      legalTargets: [],
      isPlaying: false,
    })),

  togglePlay: () =>
    set((s) => (s.isPlaying ? { isPlaying: false } : { isPlaying: true, selectedSquare: null, legalTargets: [] })),

  stopPlaying: () => set({ isPlaying: false }),
}));

/**
 * Subscribes to the raw, referentially-stable store fields (each only
 * changes reference on an actual mutation) and derives the board in a
 * `useMemo`, rather than computing it inside the Zustand selector itself.
 * A selector that allocates a new object every call breaks
 * `useSyncExternalStore`'s snapshot-stability requirement and causes
 * "The result of getSnapshot should be cached" / an infinite render loop.
 */
export function useCurrentBoardState(): BoardState {
  const initialBoardState = useGameStore((s) => s.initialBoardState);
  const history = useGameStore((s) => s.history);
  const cursorIndex = useGameStore((s) => s.cursorIndex);
  return useMemo(
    () => computeBoardStateAt(initialBoardState, history, cursorIndex),
    [initialBoardState, history, cursorIndex],
  );
}

export function useGameStatus(): GameStatus {
  const boardState = useCurrentBoardState();
  return useMemo(() => computeStatus(boardState), [boardState]);
}
