"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/lib/xiangqi/game-store";
import { downloadKyPhoText } from "@/lib/xiangqi/kyphoso";

export function MoveHistoryPanel() {
  const history = useGameStore((s) => s.history);
  const cursorIndex = useGameStore((s) => s.cursorIndex);
  const jumpTo = useGameStore((s) => s.jumpTo);
  const resetGame = useGameStore((s) => s.resetGame);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history.length]);

  function handleDownload() {
    downloadKyPhoText(history);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-piece text-lg font-semibold text-wood-dark">Kỳ Phổ</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={history.length === 0}>
            Tải Kỳ Phổ
          </Button>
          <Button variant="outline" size="sm" onClick={resetGame}>
            Ván Mới
          </Button>
        </div>
      </div>
      <ol className="flex-1 space-y-1 overflow-y-auto rounded-md border border-wood/30 bg-white/60 p-3 text-sm">
        {history.length === 0 && <li className="text-ink/50">Chưa có nước đi nào.</li>}
        {history.map((entry, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => jumpTo(index + 1)}
              className={cn(
                "flex w-full gap-2 rounded px-1 text-left hover:bg-jade/10",
                cursorIndex === index + 1 && "bg-jade/20 font-semibold",
              )}
            >
              <span className="w-6 shrink-0 text-right text-ink/50">{index + 1}.</span>
              <span>{entry.notation}</span>
            </button>
          </li>
        ))}
        <div ref={listEndRef} />
      </ol>
    </div>
  );
}
