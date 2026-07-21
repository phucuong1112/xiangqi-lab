"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGameStore } from "@/lib/xiangqi/game-store";
import { exportToText, importFromText } from "@/lib/xiangqi/kyphoso";

/** A plain-text kỳ phổ is at most a few hundred lines; this is a generous cap. */
const MAX_UPLOAD_BYTES = 300 * 1024;

export function KyPhoSoPanel() {
  const history = useGameStore((s) => s.history);
  const loadGame = useGameStore((s) => s.loadGame);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const text = exportToText(history);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kyphoso.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function applyImport(text: string) {
    const result = importFromText(text);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setError(null);
    loadGame(result);
  }

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Tệp kỳ phổ quá lớn (giới hạn vài trăm KB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => applyImport(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleExport} disabled={history.length === 0}>
          Tải Kỳ Phổ
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          Tải Lên Tệp .txt
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder={"Dán kỳ phổ vào đây, ví dụ:\n1. Pháo 2 bình 5\n2. Mã 8 tiến 7"}
          rows={6}
        />
        <Button onClick={() => applyImport(pasteText)} disabled={pasteText.trim().length === 0}>
          Nhập Kỳ Phổ
        </Button>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
