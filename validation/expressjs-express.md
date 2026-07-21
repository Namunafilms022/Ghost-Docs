# Validation: Express.js

**Repo:** `expressjs/express`
**Date:** 2026-07-21

## Results

| Command | Status | Notes |
|---|---|---|
| `explain` | ✅ | JavaScript, lib/ with application.js/express.js, mocha tests, 44 deps |
| `reason "Where is entry point?"` | ✅ | 94% — index.js |
| `reason "What test framework?"` | ✅ | 90% — mocha with test/ directory |
| `pr --dry-run` | ✅ | CHANGELOG impact detected |
