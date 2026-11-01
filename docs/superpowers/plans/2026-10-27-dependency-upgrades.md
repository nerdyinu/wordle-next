# Dependency Upgrade (Next.js 16 / React 19 stable) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move wordle-next from Next 15.0.1 + a React 19 release candidate to Next 16.4.3 + React 19.3.1 stable, refresh every other dependency inside its semver range, and optionally move Prisma 5 → 6, without changing what the app does.

**Architecture:** Four independent commits on one branch, each gated by the same verification gate. Task 1 is a lint-driven code cleanup that is valid on the current stack and lands first. Task 2 is the framework jump (Next, React, ESLint flat config) and must be one commit because `next lint` disappears in Next 16. Task 3 refreshes in-range versions. Task 4 (optional) is the Prisma major.

**Tech Stack:** Next.js App Router, React 19, TanStack Query v5, Prisma (PostgreSQL), Tailwind CSS 3, ESLint, TypeScript, pnpm 9.11.0.

## Global Constraints

- Node.js `>=20.9.0` (Next 16.4.3 `engines.node`). Trial runs used Node v26.7.0.
- pnpm stays at `pnpm@9.11.0` (the `packageManager` field). Do not upgrade pnpm in this plan.
- TypeScript stays on 5.x (`^5.9.3` after Task 3). Next 16 needs TypeScript ≥ 5.1.
- `next` and `react`/`react-dom` stay **exact-pinned**, as the repo already does for `next`.
- ESLint stays on major 9. See "Deferred" for why not 10.
- There is no unit-test suite. The verification gate below is the test for every task.
- **Proposal first, code only with approval** (owner's review rule 4, `~/.claude/CLAUDE.md`): each task's diff lives in this plan and in the patch file next to it. Applying it to the repo is a separate step that needs the owner's explicit go-ahead.
- Patch files (one per task, generated from a clean dry run of this exact plan): `docs/superpowers/plans/2026-10-27-dependency-upgrades/`.

## Behaviour changes (read first)

| # | Task | Old meaning | New meaning | Why it is needed |
|---|------|-------------|-------------|------------------|
| B1 | 2 | `pnpm lint` = `next lint`, which lints Next's default dirs; only `app/` exists here | `pnpm lint` = `eslint .`, which also lints the 4 root config files (`eslint.config.mjs`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`). All of them pass. | `next lint` is removed in Next 16. Running `next lint` on 16.4.3 prints `Invalid project directory provided, no such directory: …/lint`. |
| B2 | 2 | Lint rules from eslint-config-next 15 | eslint-config-next 16 adds the React Compiler rules (for example `react-hooks/preserve-manual-memoization`), so code that used to pass can now fail | They come with eslint-config-next 16. Today they flag exactly one spot, which Task 1 fixes. |
| B3 | 2 | `next build` bundles with webpack | `next build` bundles with **Turbopack** (Next 16 default) | It's the Next 16 default. There's no custom webpack config. The trial build shows the same 8 routes with the same static/dynamic split, and the smoke tests pass. Escape hatch: `next build --webpack`. |
| B4 | 2 | React `19.0.0-rc-69d4b800-20241021` | React `19.3.1` stable | Next 16.4.3's peer range is `^18.2.0 \|\| 19.0.0-rc-de68d2f4-20241204 \|\| ^19.0.0`, and the current RC isn't in it. No app-visible difference showed up in the smoke tests. The full playthrough (gate step G7) is required. |
| B5 | 4 | Prisma client/engine 5.x | Prisma 6.19.3 | Optional. No schema or query-API change for this app. Only a playthrough against a real DB proves the DB round trip. |

**Kept the same on purpose:** `pnpm build` still **fails on lint errors**. Next 16's `next build` no longer lints, so the build script becomes `eslint . && next build` to keep that behaviour. If you'd rather follow Next 16's default and lint only in CI, change it back to `next build`; that would be a behaviour change.

**No behaviour change:** Task 1 (the same value is computed on every render) and the `tsconfig.json` `jsx` change (`noEmit`: Next compiles JSX itself). **No intended behaviour change:** Task 3 (in-range minor and patch releases only; react-query moves 46 minor versions, so G7 is what confirms it).

## Verification gate (run after every task)

Use your normal `.env`. Steps G1–G6 need no reachable database. Until Task 2 removes the `pnpm` block from `package.json`, a newer global pnpm prints `[WARN] The "pnpm" field in package.json is no longer read…` before each command. That warning is expected.

```bash
pnpm install --frozen-lockfile        # G1  expect: "Done"
pnpm prisma generate                  # G2  expect: "✔ Generated Prisma Client"
pnpm exec tsc --noEmit                # G3  expect: no diagnostics, exit 0
pnpm lint                             # G4  expect: exit 0, no lint messages (on Next 15: "✔ No ESLint warnings or errors")
pnpm build                            # G5  expect: "✓ Compiled successfully" and this route table:
#   ○ /   ○ /_not-found   ƒ /api/game/[hash]/guess   ƒ /api/game/create
#   ƒ /api/game/play/[hash]   ƒ /api/game/start   ƒ /api/statistics   ƒ /game/[hash]
```

G6, production smoke test (run it in its own terminal; `timeout` stops the server by itself):

```bash
timeout 60 pnpm start -p 3917
# second terminal:
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3917/                      # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3917/game/not-a-real-hash   # 404
curl -s http://localhost:3917/api/game/play/not-a-real-hash                          # {"error":"Game not found"}
```

G7, manual playthrough against a **dev** database. It writes `Game` and `GameStatistics` rows and needs internet access for `api.dictionaryapi.dev`. Do it in **one** server session: `app/lib/wordEncryption.ts:5-6` generates a new key on every process start, so restarting the server (or an HMR reload of that module) makes existing game links fail. That is current behaviour, not an upgrade regression.

1. `pnpm dev`, open http://localhost:3000. Expect "Wordle Game" with the 시작하기 and 워들 생성하기 buttons.
2. Click 시작하기. Expect `/game/<hash>`, an empty 6×5 board and the on-screen keyboard. (The answer is always `WORLD`; see `app/api/game/start/route.ts:6`.)
3. Type `HELLO` and press ENTER. Expect tiles absent, absent, absent, correct, present. This exercises the duplicate-L logic in `app/lib/gameLogic.ts`.
4. Type `ABCDE` and press ENTER. Expect "Error submitting guess. Please try again."
5. Reload the page. Expect the `HELLO` row to appear immediately with no loader (SSR prefetch and hydration).
6. Type `WORLD` and press ENTER. Expect all tiles correct and the result modal "축하합니다!" with play time and statistics.
7. Go home, click 워들 생성하기, enter `APPLE` and click 생성. Expect navigation to a new `/game/<hash>`.

---

### Task 0: Branch and baseline

**Files:** none changed.

- [ ] **Step 1: Create the branch from an up-to-date main**

```bash
git switch main && git pull --ff-only && git switch -c chore/upgrade-next-16
```

- [ ] **Step 2: Check the workspace**

`node --version` must be ≥ 20.9.0. This plan's folder (`docs/superpowers/plans/`) is untracked and `.env` is gitignored, so both exist only in the main checkout. Work in that checkout, or copy `docs/superpowers/plans/` and `.env` into the worktree or clone first. Without them, `git apply --check docs/…` fails and G7 has no `DATABASE_URL`.

- [ ] **Step 3: Run gate G1–G5 on the untouched code**

Expected: everything passes. On 2026-10-27 the baseline gave tsc exit 0, `✔ No ESLint warnings or errors`, and the 8-route table above. If the baseline already fails, stop and fix that first; it isn't part of this plan.

---

### Task 1: Remove the manual `useMemo` around `playTime` (lint prerequisite)

**Files:**
- Modify: `app/components/Game.tsx:4`, `app/components/Game.tsx:56-59`
- Patch: `docs/superpowers/plans/2026-10-27-dependency-upgrades/task1-game-playtime.patch`

**Interfaces:**
- Consumes: nothing.
- Produces: `playTime: number` inside `Game`, with the same name, type and value as before. `ResultModal` still receives it through `playTime={playTime}` (unchanged; `app/components/Game.tsx:80` today, `:79` after this task).

**Root code:** `app/components/Game.tsx:56-59`

```tsx
  const playTime = useMemo(() => {
    if (!gameState?.completedAt) return 0
    return Math.round((Date.parse(gameState.completedAt) - Date.parse(gameState.createdAt)) / 1000)
  }, [gameState?.createdAt, gameState?.completedAt]);
```

On the Task 2 stack, `pnpm lint` reports (the trial output, reported twice for the same spot):

```
app/components/Game.tsx:56:28 react-hooks/preserve-manual-memoization | Compilation Skipped: Existing memoization could not be preserved
… The inferred dependency was `gameState.createdAt`, but the source dependencies were [gameState?.createdAt, gameState?.completedAt].
```

This is the only lint error the upgrade introduces in the whole repo.

**Before:** `app/components/Game.tsx:4`
```tsx
import { useMemo, useState } from 'react';
```
**After:** `app/components/Game.tsx:4`
```tsx
import { useState } from 'react';
```

**Before:** `app/components/Game.tsx:55-61`
```tsx

  const playTime = useMemo(() => {
    if (!gameState?.completedAt) return 0
    return Math.round((Date.parse(gameState.completedAt) - Date.parse(gameState.createdAt)) / 1000)
  }, [gameState?.createdAt, gameState?.completedAt]);

  if (isPending) return <Loader />;
```
**After:** `app/components/Game.tsx:55-60`
```tsx

  const playTime = gameState?.completedAt
    ? Math.round((Date.parse(gameState.completedAt) - Date.parse(gameState.createdAt)) / 1000)
    : 0

  if (isPending) return <Loader />;
```

What changed:
- `useMemo` is removed from the `react` import.
- `playTime` is a plain conditional expression computed on every render. It has the same branches: `0` when `completedAt` is falsy, otherwise the rounded seconds between the two ISO timestamps.

**Justification:** `playTime` is a pure function of two strings and costs two `Date.parse` calls, so memoising it saved nothing. The memo also had dependencies the React Compiler lint can't match, which is the root cause of the error. With no memo there is nothing to mismatch. **No behaviour change.** Compared against:
- (b) Keep `useMemo` with deps `[gameState]`. It also passes lint in the trial, but it keeps a useless memo with coarser deps.
- (c) Add `eslint-disable` for the rule. That hides a compiler-bailout signal in the one component a reviewer reads first.

(a) is the smallest diff that removes the cause. Evidence: with (a), ESLint exits 0 on Next 16, and also on the current Next 15 stack (tsc exit 0, `✔ No ESLint warnings or errors`), so this task can land first.

- [ ] **Step 1: Confirm the patch applies:** `git apply --check docs/superpowers/plans/2026-10-27-dependency-upgrades/task1-game-playtime.patch` (expect no output)
- [ ] **Step 2: Apply the change shown in Before/After** (with the owner's approval)
- [ ] **Step 3: Run gate G3–G5.** Expect all to pass on Next 15.
- [ ] **Step 4: Run G7 steps 1, 2, 3 and 6.** Expect the result modal to show a non-zero play time.
- [ ] **Step 5: Commit**

```bash
git add app/components/Game.tsx
git commit -m "refactor: compute playTime without useMemo in Game"
```

---

### Task 2: Next 16.4.3, React 19.3.1 stable, ESLint 9 flat config

**Files:**
- Modify: `package.json:5-40`, `tsconfig.json:17`, `tsconfig.json:35`, `pnpm-lock.yaml` (regenerated by pnpm)
- Delete: `.eslintrc.json`
- Create: `eslint.config.mjs`
- Patch: `docs/superpowers/plans/2026-10-27-dependency-upgrades/task2-next16-react19-eslint9.patch` (excludes the lockfile)

**Interfaces:**
- Consumes: Task 1 (otherwise G4 fails with the error quoted in Task 1).
- Produces: scripts `lint` = `eslint .` and `build` = `eslint . && next build`. Tasks 3 and 4 rely on these names.

**Root code:**
- `package.json:14-16` pins `next` `15.0.1` and React `19.0.0-rc-69d4b800-20241021`. Next 16.4.3 doesn't accept that RC (peer range in B4).
- `package.json:9` is `"lint": "next lint"`. The command is removed in 16.
- `package.json:22-23` and `package.json:34-39` alias `@types/react` and `@types/react-dom` to the RC packages `types-react@19.0.0-rc.1`, and force that through `pnpm.overrides`. With stable React these aliases are wrong and must go. (A newer global pnpm already warns that this field is ignored.)
- `.eslintrc.json:1-3` is a legacy config. eslint-config-next 16.4.3 ships flat configs (`eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`) and has the peer `eslint >=9.0.0`.
- `tsconfig.json:17` and `tsconfig.json:35`: on its first run, `next build` 16 rewrites these. The build prints "The following mandatory changes were made to your tsconfig.json: jsx was set to react-jsx". Committing them keeps the tree clean after each build.

**Before:** `package.json:5-40`
```json
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@prisma/client": "^5.20.0",
    "@tanstack/react-query": "^5.59.0",
    "next": "15.0.1",
    "react": "19.0.0-rc-69d4b800-20241021",
    "react-dom": "19.0.0-rc-69d4b800-20241021",
    "react-error-boundary": "^4.1.2",
    "server-only": "^0.0.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "npm:types-react@19.0.0-rc.1",
    "@types/react-dom": "npm:types-react-dom@19.0.0-rc.1",
    "clsx": "^2.1.1",
    "eslint": "^8",
    "eslint-config-next": "15.0.1",
    "postcss": "^8",
    "prisma": "^5.20.0",
    "tailwind-merge": "^2.5.3",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  },
  "packageManager": "pnpm@9.11.0+sha512.0a20…f19b",
  "pnpm": {
    "overrides": {
      "@types/react": "npm:types-react@19.0.0-rc.1",
      "@types/react-dom": "npm:types-react-dom@19.0.0-rc.1"
    }
  }
}
```
**After:** `package.json:5-34`
```json
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "eslint . && next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "@prisma/client": "^5.20.0",
    "@tanstack/react-query": "^5.59.0",
    "next": "16.4.3",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "react-error-boundary": "^4.1.2",
    "server-only": "^0.0.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "clsx": "^2.1.1",
    "eslint": "^9",
    "eslint-config-next": "16.4.3",
    "postcss": "^8",
    "prisma": "^5.20.0",
    "tailwind-merge": "^2.5.3",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  },
  "packageManager": "pnpm@9.11.0+sha512.0a20…f19b"
}
```
(The `packageManager` hash is unchanged; it's shortened here only for display.)

What changed:
- `build` now chains `eslint .` first, so it still fails on lint errors. **Behaviour kept the same**, see the note under the behaviour-change table.
- `lint` is now `eslint .` (**B1**).
- `next` is `16.4.3` and `react`/`react-dom` are `19.3.1`, both exact-pinned (**B3**, **B4**).
- `@types/react` and `@types/react-dom` are now the real `^19` packages, no longer the RC aliases.
- `eslint` is `^9` (resolves to 9.39.5) and `eslint-config-next` is `16.4.3` (**B2**).
- The `pnpm.overrides` block is removed.
- `dev` is left as is: `--turbopack` is still accepted in 16.4.3 (`next dev --help` lists it) and is now the default anyway.

Behaviour changes in this task (also in the top table):
- **B1, lint scope.** Old: `next lint` lints `app/`. New: `eslint .` also lints the 4 root config files, which pass. Why: `next lint` is removed in 16.
- **B2, stricter rules.** Old: eslint-config-next 15 rules. New: React Compiler rules are added. Why: they ship with eslint-config-next 16. Today they flag only `Game.tsx:56`, which Task 1 fixes.
- **B3, bundler.** Old: `next build` uses webpack. New: it uses Turbopack. Why: the Next 16 default. The route table is identical and the smoke tests pass. Use `next build --webpack` to keep webpack.
- **B4, React runtime.** Old: `19.0.0-rc-69d4b800-20241021`. New: `19.3.1`. Why: the RC is outside Next 16's peer range. G7 confirms the app behaves the same.
- **Kept the same:** `pnpm build` still fails on lint errors, because the script chains `eslint .` first.

**Before:** `.eslintrc.json:1-3`
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```
**After:** file deleted, replaced by **new** `eslint.config.mjs:1-9`
```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```
What changed: the same two presets (`core-web-vitals`, `typescript`) in flat-config form, plus explicit ignores for build output. `next lint` used to apply those ignores implicitly.

**Before:** `tsconfig.json:17` and `tsconfig.json:31-36`
```json
    "jsx": "preserve",
…
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
```
**After:** `tsconfig.json:17` and `tsconfig.json:31-37`
```json
    "jsx": "react-jsx",
…
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
```
What changed: `jsx` is now `react-jsx`, and the new `.next/dev/types` include is added. These are exactly the edits Next 16 makes by itself on the first build.

**Justification:** Each change is forced by Next 16. The React RC falls outside the peer range, `next lint` no longer exists, and eslint-config-next 16 requires flat config and ESLint ≥ 9. The changes can't be split, because the version bump without the lint-script change breaks `pnpm lint`. The comparisons below cover the choices that weren't forced:
- `eslint .` vs `eslint app`: `eslint app` matches the old scope exactly, but it silently skips any new top-level source folder and differs from what Next's `next-lint-to-eslint-cli` codemod produces. `eslint .` costs four extra files that already pass.
- `eslint . && next build` vs plain `next build`: the plain version would quietly stop failing builds on lint errors, a behaviour change nobody asked for.
- ESLint `^9` vs `^10`: see "Deferred".

Evidence from the clean dry run on 2026-10-27, Task 1 + Task 2 on a fresh copy of `main`: `pnpm install` gave `Done`, tsc exit 0, lint exit 0, build `▲ Next.js 16.4.3 (Turbopack) ✓ Compiled successfully` with the 8 routes. G6 gave `/` 200, `/game/not-a-real-hash` 404 and `/api/game/play/not-a-real-hash` returning `{"error":"Game not found"}`.

- [ ] **Step 1: Confirm the patch applies:** `git apply --check docs/superpowers/plans/2026-10-27-dependency-upgrades/task2-next16-react19-eslint9.patch`
- [ ] **Step 2: Apply the changes shown in Before/After** (with the owner's approval)
- [ ] **Step 3: Regenerate the lockfile:** `pnpm install`. Expect `Done` and no `unmet peer` warnings. The ` WARN  deprecated eslint@9.39.5` line is expected (see "Deferred").
- [ ] **Step 4: Run the full gate G1–G7.** On first build, check that `git status --short` lists only the files of this task: no further `tsconfig.json` rewrite.
- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml eslint.config.mjs tsconfig.json .eslintrc.json
git commit -m "chore: upgrade to Next 16.4.3 and React 19.3.1, move ESLint to flat config"
```

---

### Task 3: Refresh everything inside its existing range

**Files:**
- Modify: `package.json:12-31`, `pnpm-lock.yaml`
- Patch: `docs/superpowers/plans/2026-10-27-dependency-upgrades/task3-in-range-refresh.patch`

**Interfaces:**
- Consumes: Task 2's scripts.
- Produces: the version floors Task 4 edits (`@prisma/client` / `prisma` `^5.22.0`).

**Root code:** `pnpm-lock.yaml:11-16` (state after Task 2) still holds the October 2024 resolutions:

```yaml
      '@prisma/client':
        specifier: ^5.20.0
        version: 5.20.0(prisma@5.20.0)
      '@tanstack/react-query':
        specifier: ^5.59.0
        version: 5.59.0(react@19.3.1)
```

`@tanstack/react-query` 5.59.0 is 46 minor releases behind 5.105.0, and `typescript` is at 5.6.2 against 5.9.3. All of these sit within ranges `package.json` already allows.

**Before:** `package.json:12-13`
```json
    "@prisma/client": "^5.20.0",
    "@tanstack/react-query": "^5.59.0",
```
**After:** `package.json:12-13`
```json
    "@prisma/client": "^5.22.0",
    "@tanstack/react-query": "^5.105.0",
```

**Before:** `package.json:21-31`
```json
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "clsx": "^2.1.1",
    "eslint": "^9",
    "eslint-config-next": "16.4.3",
    "postcss": "^8",
    "prisma": "^5.20.0",
    "tailwind-merge": "^2.5.3",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
```
**After:** `package.json:21-31`
```json
    "@types/node": "^20.19.43",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "clsx": "^2.1.1",
    "eslint": "^9.39.5",
    "eslint-config-next": "16.4.3",
    "postcss": "^8.5.32",
    "prisma": "^5.22.0",
    "tailwind-merge": "^2.6.1",
    "tailwindcss": "^3.4.19",
    "typescript": "^5.9.3"
```

The same changes as a table, with the installed versions:

| Line | Package | Before | After | Installed change |
|------|---------|--------|-------|------------------|
| 12 | `@prisma/client` | `^5.20.0` | `^5.22.0` | 5.20.0 → 5.22.0 |
| 13 | `@tanstack/react-query` | `^5.59.0` | `^5.105.0` | 5.59.0 → 5.105.0 |
| 21 | `@types/node` | `^20` | `^20.19.43` | 20.16.10 → 20.19.43 |
| 22 | `@types/react` | `^19` | `^19.3.0` | (no change) |
| 23 | `@types/react-dom` | `^19` | `^19.3.0` | (no change) |
| 25 | `eslint` | `^9` | `^9.39.5` | (no change) |
| 27 | `postcss` | `^8` | `^8.5.32` | 8.4.47 → 8.5.32 |
| 28 | `prisma` | `^5.20.0` | `^5.22.0` | 5.20.0 → 5.22.0 |
| 29 | `tailwind-merge` | `^2.5.3` | `^2.6.1` | 2.5.3 → 2.6.1 |
| 30 | `tailwindcss` | `^3.4.1` | `^3.4.19` | 3.4.13 → 3.4.19 |
| 31 | `typescript` | `^5` | `^5.9.3` | 5.6.2 → 5.9.3 |

What changed: only range floors and lockfile resolutions. No major version moves.

**Justification:** These are minor and patch releases inside the ranges you already declared, so **no intended behaviour change**. They bring about two years of upstream bug fixes. Raising the floors records what was actually tested. The alternative is leaving them as is: the ranges then claim support for versions nobody tested against Next 16. Evidence from the dry run: after `pnpm update`, tsc exit 0, lint exit 0 and build `✓ Compiled successfully`.

- [ ] **Step 1: Run `pnpm update`.** Expect the version moves in the table above.
- [ ] **Step 2: Compare `git diff package.json` with the table.** Expect only those 11 lines to change. Cross-check against `task3-in-range-refresh.patch`.
- [ ] **Step 3: Run the full gate G1–G7.**
- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: refresh dependencies within their semver ranges"
```

---

### Task 4 (optional): Prisma 5 → 6.19.3

**Files:**
- Modify: `package.json:12`, `package.json:28`, `pnpm-lock.yaml`
- Patch: `docs/superpowers/plans/2026-10-27-dependency-upgrades/task4-prisma6.patch`

**Interfaces:**
- Consumes: Task 3's floors.
- Produces: nothing other tasks depend on.

**Root code:** `package.json:12` `"@prisma/client": "^5.22.0"` and `package.json:28` `"prisma": "^5.22.0"`. Code this task affects:
- `app/api/game/[hash]/guess/route.ts:6-7` imports Prisma's internal paths `@prisma/client/extension` and `@prisma/client/runtime/library`. Both still resolve under 6.19.3 (tsc exit 0).
- `app/lib/game.service.ts:4,16-21` uses `Prisma.GameSelect` / `Prisma.GameGetPayload`. These still typecheck.
- `prisma/schema.prisma` has no `Bytes` fields, no implicit many-to-many relations and no full-text search, which are the Prisma 6 breaking-change areas. `prisma validate` reports the schema as valid.

**Before:** `package.json:12` and `package.json:28`
```json
    "@prisma/client": "^5.22.0",
…
    "prisma": "^5.22.0",
```
**After:** `package.json:12` and `package.json:28`
```json
    "@prisma/client": "^6.19.3",
…
    "prisma": "^6.19.3",
```
What changed: the Prisma client and CLI go up one major.

Behaviour change in this task (also in the top table):
- **B5, Prisma engine.** Old: Prisma client and engine 5.22. New: 6.19.3. Why: 5.x gets no more releases. This app uses no schema features or query APIs that changed in 6; only G7 against a real DB confirms the round trip.

**Justification:** Prisma 5's last release was 5.22.0 (2024-11-05), and 6 is the newest major this code supports without rework (7 needs a driver adapter and a new generator; see "Deferred"). Evidence from the dry run: `✔ Generated Prisma Client (v6.19.3)`, `The schema at prisma/schema.prisma is valid`, tsc exit 0, lint exit 0 and a successful build. In G6, the Prisma client is loaded and runs from the Turbopack bundle: with an unreachable DB, `POST /api/game/start` fails with `PrismaClientInitializationError … Can't reach database server`, which is the expected error. **A real DB round trip was not verified**, which is why step 3 is required. The alternative is staying on 5.22: zero risk, but an unmaintained major in a portfolio repo.

- [ ] **Step 1: Apply the change shown in Before/After** (with the owner's approval), then `pnpm install`
- [ ] **Step 2: Run gate G1–G6**, then `pnpm prisma validate`. Expect `is valid`.
- [ ] **Step 3: Against the dev DB only, run two read-only checks** (don't use `migrate dev`: with `--create-only` it always writes a migration folder, empty if nothing changed, and it can offer to reset the database if it finds drift):

```bash
pnpm prisma migrate status
# expect: "Database schema is up to date!"
pnpm prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
# expect: "No difference detected.", exit 0
```

If either one reports a difference, stop and report its output. Don't run any migrate command that writes.
- [ ] **Step 4: Run G7 in full.**
- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: upgrade Prisma to 6.19.3"
```

---

## Deferred (evaluated on 2026-10-27, not in this plan)

| Upgrade | Why not now | Evidence |
|---------|-------------|----------|
| ESLint 10 | The plugins bundled in eslint-config-next 16.4.3 don't declare support for it yet | Peer warnings from `eslint-plugin-import` 2.32.0, `eslint-plugin-jsx-a11y` 6.10.2 and `eslint-plugin-react` 7.37.5 (the versions resolved after Task 3), whose peer ranges stop at `^9` / `^9.7`. Lint itself ran clean on 10.13.0. Note: npm marks 9.39.5 as deprecated, so revisit when eslint-config-next widens those peers. |
| react-error-boundary 6 | No gain for this app, and it needs a code change | `FallbackProps.error` becomes `unknown`: `app/components/ErrorFallback.tsx(14,11): error TS18046: 'error' is of type 'unknown'`. 4.1.2 (peer `react >=16.13.1`) works with React 19.3.1. |
| Prisma 7 / 8 | A refactor, not a bump: driver adapter (`@prisma/adapter-pg`), the new `prisma-client` generator, and `prisma.config.ts` | The `latest` tag currently points at `8.0.0-rc.27`; 7.10.1 is the last stable. |
| Tailwind 4 (+ tailwind-merge 3, which supports only v4) | CSS-first config migration and a **visible layout change** | `bg-opacity-50` (`app/components/modal/CreateGameModal.tsx:35`, `ResultModal.tsx:22`) is removed in v4. `w-50 h-50` (`app/components/GameBoard.tsx:38`) generates **no CSS** in v3 today but would make 12.5rem (200px) tiles in v4. |
| TypeScript 7 (native compiler) | Next's TypeScript plugin and build checker haven't been tested with it here | 5.9.3 passes every gate. |
| pnpm 10+ | pnpm 10 blocks dependency install scripts by default, so `prisma` / `@prisma/client` would need an `onlyBuiltDependencies` allowlist. | Your global pnpm already prints `The "pnpm" field in package.json is no longer read by pnpm`, so newer releases expect settings in `pnpm-workspace.yaml`. A separate change with its own risk. |
| `@types/node` above 20 | Should match the Node major you deploy on. Node 20 reached end of life on 2026-04-30. | When you pick 22 or 24 LTS for deployment, bump `@types/node` to that major and add `"engines": { "node": ">=22" }` (or 24). |
