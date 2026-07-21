# Validation: nest

**Repo:** `nestjs/nest`
**Date:** 2026-07-21

## Results

| Command | Status | Notes |
|---|---|---|
| `explain` | ✅ | TypeScript, JavaScript, Markdown, YAML, HTML, Shell, 109 deps |
| `reason "What does this do?"` | ✅ | 95% — Topic: Project Purpose | Confidence: 95% Monorepo project. built with TypeScript |
| `reason "What test framework?"` | ✅ | 90% — Topic: Testing | Confidence: 90% Test command: `node --loader ts-node/esm ./node |
| `reason "Where is entry point?"` | ✅ | 94% — Topic: Entry Points | Confidence: 94% Entry points (highest confidence first): - |
| `pr --dry-run` | ⚠️ | No impacts (fresh clone) |

## Details

- **Languages:** TypeScript, JavaScript, Markdown, YAML, HTML, Shell
- **Modules:** .circleci, .github, .husky, hooks, integration
- **Entry Points:** sample/25-dynamic-modules/src/config/interfaces/index.ts, sample/09-babel-example/index.js, tools/benchmarks/src/main.ts
- **Auth:** Not detected
- **Database:** @nestjs/mongoose, @nestjs/typeorm, ioredis, mongoose, mysql2, redis, typeorm
- **Dependencies:** 109
