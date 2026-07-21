# Validation: jest

**Repo:** `facebook/jest`
**Date:** 2026-07-21

## Results

| Command | Status | Notes |
|---|---|---|
| `explain` | ✅ | JavaScript, TypeScript, Markdown, YAML, CSS, Shell, TOML, 79 deps |
| `reason "What does this do?"` | ⚠️ | Timed out |
| `reason "What test framework?"` | ⚠️ | Timed out |
| `reason "Where is entry point?"` | ⚠️ | Timed out |
| `pr --dry-run` | ⚠️ | No impacts (fresh clone) |

## Details

- **Languages:** JavaScript, TypeScript, Markdown, YAML, CSS, Shell, TOML
- **Modules:** .claude, .eslintplugin, .github, .vscode, .yarn
- **Entry Points:** packages/test-utils/src/index.ts, website/src/pages/index.js, e2e/transform/ecmascript-modules-support/src/index.mjs
- **Auth:** Not detected
- **Database:** Not detected
- **Dependencies:** 79
