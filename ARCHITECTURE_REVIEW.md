# Architecture Review Checklist

> Mandatory after every phase. Run this before moving to the next phase.

## Phase: ____________ (fill phase name)

### 1. Modularity
- [ ] Each module has a single responsibility
- [ ] Modules communicate through defined interfaces
- [ ] No circular dependencies
- [ ] Public API is clean and minimal

### 2. Extensibility
- [ ] New detectors can be added without modifying existing code
- [ ] LLM provider is abstracted (OpenAI/Anthropic via interface)
- [ ] Config is environment-driven, not hardcoded
- [ ] Plugin-style architecture where applicable

### 3. Testability
- [ ] Core logic is separated from I/O
- [ ] All detectors are pure functions or easily mockable
- [ ] Test coverage >= 80%
- [ ] Tests use fixtures, not real network calls

### 4. Error Handling
- [ ] Network failures are caught gracefully
- [ ] File system errors are handled
- [ ] Invalid input returns meaningful errors
- [ ] No unhandled promise rejections

### 5. Performance
- [ ] No unnecessary file reads
- [ ] Async operations use Promise.all where possible
- [ ] Large repos are handled without OOM
- [ ] Temp files are cleaned up

### 6. Security
- [ ] API keys come from env, not code
- [ ] Token/API key not logged in output
- [ ] Temp directories are isolated per run
- [ ] No command injection vulnerabilities

### 7. Code Quality
- [ ] TypeScript strict mode passes
- [ ] No `any` types
- [ ] Consistent naming conventions
- [ ] Functions are under 50 lines
- [ ] No dead code or commented code

### 8. Documentation
- [ ] Public API has JSDoc comments
- [ ] README reflects current state
- [ ] .env.example is up to date
- [ ] Architecture decisions are documented

---

## Review Result

**Reviewer:** _______________
**Date:** ___________________
**Status:** [ ] Passed | [ ] Changes Required | [ ] Blocked

**Notes:**
```
```
