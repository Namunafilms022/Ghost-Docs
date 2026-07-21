# Validation: date-fns

**Repo:** `date-fns/date-fns`
**Date:** 2026-07-21

## Results

| Command | Status | Notes |
|---|---|---|
| `explain` | ✅ | TypeScript, Markdown, JavaScript, TOML, YAML, Shell, CSS, Dockerfile, HTML, 5 deps |
| `reason "What does this do?"` | ✅ | 95% — Topic: Project Purpose | Confidence: 95% Monorepo project. built with TypeScript |
| `reason "What test framework?"` | ✅ | 90% — Topic: Testing | Confidence: 90% Test command: `yarn test` |
| `reason "Where is entry point?"` | ✅ | 94% — Topic: Entry Points | Confidence: 94% Entry points (highest confidence first): - |
| `pr --dry-run` | ⚠️ | No impacts (fresh clone) |

## Details

- **Languages:** TypeScript, Markdown, JavaScript, TOML, YAML, Shell, CSS, Dockerfile, HTML
- **Modules:** .devcontainer, .github, .opencode, .vscode, codemods
- **Entry Points:** pkgs/utc/src/utc/index.ts, pkgs/utc/src/date/index.js, pkgs/tz/playground/src/server.ts
- **Auth:** Not detected
- **Database:** Not detected
- **Dependencies:** 5
