# Học Viện Kỳ Nghệ — Xiangqi Learning App

A 100%-Vietnamese, client-side Xiangqi (Cờ Tướng) learning and analysis app. Built with Next.js (App Router, static export), Tailwind CSS, and Shadcn UI — no backend, deployable free to GitHub Pages.

## Features

- Free-play board (click or drag-and-drop) with full Xiangqi rule enforcement (river crossing, palace bounds, flying-general check).
- Live move history in standard Vietnamese notation.
- Kỳ phổ (game record) export/import as `.txt`.
- Interactive replay (Đầu trận / Thoái nước / Tự động phát-Dừng / Tiến nước / Hiện tại) with mid-game branch takeover.
- Fast shorthand move entry (e.g. `p2b5` → `Pháo 2 bình 5`).
- In-app Vietnamese guide covering controls, notation rules, and the shorthand table.

## Getting Started

This project uses [bun](https://bun.sh) as its package manager — do not use npm/yarn/pnpm (no lockfile for those is committed).

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Building for static export

```bash
bun run build
```

Produces a static `out/` directory (`output: 'export'` in `next.config.ts`) with no server runtime required. A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and publishes `out/` to GitHub Pages on push to `main`.

If deploying to a GitHub Pages *project* page (`username.github.io/repo-name`), set the `NEXT_BASE_PATH` environment variable to `/repo-name` at build time so static assets resolve correctly; leave it unset for a user/org page or a custom domain.

## Project structure

- `lib/xiangqi/` — pure game logic: board/move engine (`board.ts`, `moves.ts`, `rules.ts`), Vietnamese notation (`notation.ts`, `notation-constants.ts`), kỳ phổ export/import (`kyphoso.ts`), and the shared Zustand game store (`game-store.ts`). Each has a `verify-*.ts` manual assertion script runnable via `bun run lib/xiangqi/verify-*.ts` (no test framework is configured yet).
- `components/board/` — the interactive board, move history, replay controls, kỳ phổ panel, and fast-input UI.
- `components/docs/` — the in-app Vietnamese guide content.
- `app/` — the single-page app shell (`page.tsx`) and root layout/theme setup.
