"use client";

import { cn } from "@/lib/utils";
import type { Piece } from "@/lib/xiangqi/board";
import { pieceGlyph } from "@/lib/xiangqi/piece-glyphs";

interface PieceTokenProps {
  piece: Piece;
  selected?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
}

export function PieceToken({ piece, selected, draggable, onDragStart }: PieceTokenProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={(event) => {
        if (!draggable) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      className={cn(
        "flex h-[85%] w-[85%] select-none items-center justify-center rounded-full border-2 font-piece text-[3.2vw] font-bold shadow-md sm:text-lg",
        "bg-xuan-paper",
        piece.side === "red" ? "border-red-700 text-red-700" : "border-ink text-ink",
        selected && "ring-4 ring-gold",
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
    >
      {pieceGlyph(piece.type, piece.side)}
    </div>
  );
}
