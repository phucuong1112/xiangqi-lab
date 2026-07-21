"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XiangqiBoard } from "@/components/board/xiangqi-board";
import { MoveHistoryPanel } from "@/components/board/move-history-panel";
import { KyPhoSoPanel } from "@/components/board/kyphoso-panel";
import { ReplayControls } from "@/components/board/replay-controls";
import { FastInput } from "@/components/board/fast-input";
import { GuideContent } from "@/components/docs/guide-content";

export default function Home() {
  const [activeTab, setActiveTab] = useState("board");

  return (
    <div className="flex flex-1 flex-col items-center bg-xuan-paper px-4 py-8 text-ink">
      <div className="w-full max-w-4xl">
        <h1 className="mb-6 text-center font-piece text-3xl font-bold text-wood-dark">
          Học Viện Kỳ Nghệ
        </h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="board">Bàn Cờ</TabsTrigger>
            <TabsTrigger value="record">Kỳ Phổ</TabsTrigger>
            <TabsTrigger value="guide">Hướng Dẫn</TabsTrigger>
          </TabsList>
          <TabsContent value="board" className="rounded-lg border border-wood/30 bg-white/60 p-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="flex flex-col gap-4">
                <XiangqiBoard />
                <ReplayControls />
                <FastInput />
              </div>
              <MoveHistoryPanel />
            </div>
          </TabsContent>
          <TabsContent value="record" className="rounded-lg border border-wood/30 bg-white/60 p-6">
            <KyPhoSoPanel onImportSuccess={() => setActiveTab("board")} />
          </TabsContent>
          <TabsContent value="guide" className="rounded-lg border border-wood/30 bg-white/60 p-6">
            <GuideContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
