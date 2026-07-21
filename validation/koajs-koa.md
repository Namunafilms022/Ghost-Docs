# Validation: Koa.js

**Repo:** `koajs/koa`
**Date:** 2026-07-21

## Results

| Command | Status | Notes |
|---|---|---|
| `explain` | ✅ | JavaScript, lib/application.js entry, docs/ detected, node --test |
| `reason "What does this do?"` | ⚠️ | 10% — Could not classify (minor keyword gap) |
| `pr --dry-run` | — | Not tested |

## Known Issues

- "What does this do?" not matching `project-purpose` classifier. Fix: add "what does this do" to keywords in addition to "what does it do".
