"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/xiangqi/game-store";

/** Auto-play advance interval, per the plan's "~1 move/second" pace. */
const AUTO_PLAY_INTERVAL_MS = 1000;

export function ReplayControls() {
  const cursorIndex = useGameStore((s) => s.cursorIndex);
  const historyLength = useGameStore((s) => s.history.length);
  const isPlaying = useGameStore((s) => s.isPlaying);
  const goToStart = useGameStore((s) => s.goToStart);
  const stepBack = useGameStore((s) => s.stepBack);
  const stepForward = useGameStore((s) => s.stepForward);
  const goToLatest = useGameStore((s) => s.goToLatest);
  const togglePlay = useGameStore((s) => s.togglePlay);
  const stopPlaying = useGameStore((s) => s.stopPlaying);

  const atStart = cursorIndex === 0;
  const atLatest = cursorIndex === historyLength;

  useEffect(() => {
    if (!isPlaying) return;
    if (cursorIndex >= historyLength) {
      stopPlaying();
      return;
    }
    const timer = setInterval(() => {
      useGameStore.getState().stepForward();
    }, AUTO_PLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPlaying, cursorIndex, historyLength, stopPlaying]);

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Đầu trận"
        disabled={isPlaying || atStart}
        onClick={goToStart}
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Thoái nước"
        disabled={isPlaying || atStart}
        onClick={stepBack}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label={isPlaying ? "Dừng" : "Tự động phát"}
        disabled={!isPlaying && atLatest}
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Tiến nước"
        disabled={isPlaying || atLatest}
        onClick={stepForward}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Hiện tại"
        disabled={isPlaying || atLatest}
        onClick={goToLatest}
      >
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  );
}
