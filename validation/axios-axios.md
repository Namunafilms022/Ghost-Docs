# Validation: axios

**Repo:** `axios/axios`
**Date:** 2026-07-21

## Results

| Command | Status | Notes |
|---|---|---|
| `explain` | ✅ | JavaScript, Markdown, TypeScript, YAML, HTML, CSS, 43 deps |
| `reason "What does this do?"` | ✅ | 95% — Topic: Project Purpose | Confidence: 95% Documentation project. built with JavaS |
| `reason "What test framework?"` | ✅ | 90% — Topic: Testing | Confidence: 90% Test command: `npm run test:vitest` Test direct |
| `reason "Where is entry point?"` | ✅ | 94% — Topic: Entry Points | Confidence: 94% Entry points (highest confidence first): - |
| `pr --dry-run` | ⚠️ | No impacts (fresh clone) |

## Details

- **Languages:** JavaScript, Markdown, TypeScript, YAML, HTML, CSS
- **Modules:** .devcontainer, .github, .husky, docs, examples
- **Entry Points:** docs/.vitepress/theme/index.ts, lib/platform/node/index.js, tests/setup/server.js
- **Auth:** Not detected
- **Database:** Not detected
- **Dependencies:** 43
