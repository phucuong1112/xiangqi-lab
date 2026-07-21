"use client";

import { cn } from "@/lib/utils";
import { useCurrentBoardState, useGameStatus, useGameStore } from "@/lib/xiangqi/game-store";
import { PieceToken } from "./piece-token";

const FILES = 9;
const RANKS = 10;
/** Fraction of the (0..8, 0..9) coordinate space reserved as margin on every edge. */
const MARGIN = 0.5;
const VIEW_WIDTH = FILES - 1 + MARGIN * 2;
const VIEW_HEIGHT = RANKS - 1 + MARGIN * 2;

function toPercent(index: number, span: number): number {
  return ((index + MARGIN) / span) * 100;
}

export function XiangqiBoard() {
  const boardState = useCurrentBoardState();
  const status = useGameStatus();
  const selectedSquare = useGameStore((s) => s.selectedSquare);
  const legalTargets = useGameStore((s) => s.legalTargets);
  const selectSquare = useGameStore((s) => s.selectSquare);
  const beginDrag = useGameStore((s) => s.beginDrag);
  const movePiece = useGameStore((s) => s.movePiece);
  const isPlaying = useGameStore((s) => s.isPlaying);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative mx-auto aspect-[9/10] w-full max-w-md select-none rounded-md bg-wood/20 p-3"
        onDragOver={(event) => event.preventDefault()}
      >
        {/* Grid lines and intersection buttons must share this exact box so their
            percentage-based coordinates line up; the outer div's p-3 padding is
            not part of it. */}
        <div className="absolute inset-3">
        <svg
          viewBox={`-${MARGIN} -${MARGIN} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
        >
          {Array.from({ length: RANKS }, (_, rank) => (
            <line
              key={`h-${rank}`}
              x1={0}
              y1={rank}
              x2={FILES - 1}
              y2={rank}
              stroke="var(--ink)"
              strokeWidth={0.03}
            />
          ))}
          {Array.from({ length: FILES }, (_, file) => {
            const isEdge = file === 0 || file === FILES - 1;
            return isEdge ? (
              <line
                key={`v-${file}`}
                x1={file}
                y1={0}
                x2={file}
                y2={RANKS - 1}
                stroke="var(--ink)"
                strokeWidth={0.03}
              />
            ) : (
              <g key={`v-${file}`}>
                <line x1={file} y1={0} x2={file} y2={4} stroke="var(--ink)" strokeWidth={0.03} />
                <line x1={file} y1={5} x2={file} y2={RANKS - 1} stroke="var(--ink)" strokeWidth={0.03} />
              </g>
            );
          })}
          <line x1={3} y1={0} x2={5} y2={2} stroke="var(--ink)" strokeWidth={0.03} />
          <line x1={5} y1={0} x2={3} y2={2} stroke="var(--ink)" strokeWidth={0.03} />
          <line x1={3} y1={7} x2={5} y2={9} stroke="var(--ink)" strokeWidth={0.03} />
          <line x1={5} y1={7} x2={3} y2={9} stroke="var(--ink)" strokeWidth={0.03} />
          <text x={2} y={4.65} textAnchor="middle" fontSize={0.55} fill="var(--ink)" className="font-piece">
            楚 河
          </text>
          <text x={6} y={4.65} textAnchor="middle" fontSize={0.55} fill="var(--ink)" className="font-piece">
            漢 界
          </text>
        </svg>

        {Array.from({ length: RANKS }, (_, rank) =>
          Array.from({ length: FILES }, (_, file) => {
            const piece = boardState.grid[rank][file];
            const isSelected = selectedSquare?.rank === rank && selectedSquare.file === file;
            const target = legalTargets.find((m) => m.to.rank === rank && m.to.file === file);

            return (
              <button
                key={`${rank}-${file}`}
                type="button"
                aria-label={`Ô hàng ${rank}, cột ${file}`}
                disabled={isPlaying}
                onClick={() => selectSquare({ rank, file })}
                onDrop={() => movePiece({ rank, file })}
                onDragOver={(event) => event.preventDefault()}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${toPercent(file, VIEW_WIDTH)}%`,
                  top: `${toPercent(rank, VIEW_HEIGHT)}%`,
                  width: `${100 / VIEW_WIDTH}%`,
                  height: `${100 / VIEW_HEIGHT}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {piece && (
                  <PieceToken
                    piece={piece}
                    selected={isSelected}
                    draggable={!isPlaying && piece.side === boardState.sideToMove}
                    onDragStart={() => beginDrag({ rank, file })}
                  />
                )}
                {target && (
                  <span
                    className={cn(
                      "absolute h-1/3 w-1/3 rounded-full bg-jade/60",
                      target.captured && "h-full w-full rounded-full border-4 border-jade/70 bg-transparent",
                    )}
                  />
                )}
              </button>
            );
          }),
        )}
        </div>
      </div>

      <p className="text-center text-sm text-ink/80">
        {status.isCheckmate
          ? `Chiếu bí! ${boardState.sideToMove === "red" ? "Đen" : "Đỏ"} thắng.`
          : status.isStalemate
            ? `${boardState.sideToMove === "red" ? "Đỏ" : "Đen"} hết nước đi — thua cuộc.`
            : status.inCheck
              ? `${boardState.sideToMove === "red" ? "Đỏ" : "Đen"} đang bị chiếu tướng.`
              : `Đến lượt: ${boardState.sideToMove === "red" ? "Đỏ" : "Đen"}`}
      </p>
    </div>
  );
}
