# Validation: core

**Repo:** `vuejs/core`
**Date:** 2026-07-21

## Results

| Command | Status | Notes |
|---|---|---|
| `explain` | ✅ | TypeScript, JavaScript, Markdown, HTML, YAML, CSS, TOML, 52 deps |
| `reason "What does this do?"` | ✅ | 95% — Topic: Project Purpose | Confidence: 95% Monorepo project. built with TypeScript |
| `reason "What test framework?"` | ✅ | 90% — Topic: Testing | Confidence: 90% Test command: `vitest` |
| `reason "Where is entry point?"` | ✅ | 94% — Topic: Entry Points | Confidence: 94% Entry points (highest confidence first): - |
| `pr --dry-run` | ⚠️ | No impacts (fresh clone) |

## Details

- **Languages:** TypeScript, JavaScript, Markdown, HTML, YAML, CSS, TOML
- **Modules:** .github, .vite-hooks, .vscode, .well-known, changelogs
- **Entry Points:** packages-private/template-explorer/src/index.ts, packages/vue-compat/index.js, packages/vue/server-renderer/index.mjs
- **Auth:** Not detected
- **Database:** Not detected
- **Dependencies:** 52
