"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentBoardState, useGameStore } from "@/lib/xiangqi/game-store";
import { parseShorthand, resolveShorthand } from "@/lib/xiangqi/notation";

export function FastInput() {
  const boardState = useCurrentBoardState();
  const isPlaying = useGameStore((s) => s.isPlaying);
  const beginDrag = useGameStore((s) => s.beginDrag);
  const movePiece = useGameStore((s) => s.movePiece);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isPlaying) {
      setError("Đang tự động phát — dừng lại trước khi nhập nước đi.");
      return;
    }

    const intent = parseShorthand(value);
    if (!intent) {
      setError("Ký hiệu không hợp lệ");
      return;
    }

    const resolved = resolveShorthand(boardState, intent);
    if ("error" in resolved) {
      setError(resolved.error);
      return;
    }

    // movePiece looks up the move from the store's own legalTargets (set by
    // beginDrag), which keeps this input funneling through the exact same
    // branch/history/notation path as a board click or drag.
    beginDrag(resolved.from);
    movePiece(resolved.to);
    setError(null);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          disabled={isPlaying}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          placeholder="Nhập nhanh, vd: p2b5"
          className="flex-1 rounded-md border border-wood/40 bg-white/80 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-jade disabled:opacity-50"
        />
        <Button type="submit" size="sm" disabled={isPlaying}>
          Đi
        </Button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
