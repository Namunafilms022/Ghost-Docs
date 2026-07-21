# Changelog

## v0.1.0-dev

### Phase 6 — Documentation Synchronization Engine
- Auto-detect affected documentation from git changes
- Ghost Docs markers (`<!-- GHOST-DOCS:START -->` / `<!-- GHOST-DOCS:END -->`)
- Patch generation with diff preview
- GitHub PR creation via Octokit
- CLI: `ghost-docs pr <repo>`

### Phase 5.5 — Repository Context Engine
- Session-based context tracking
- Pronoun resolution ("it", "this", "that", "then")
- Topic inheritance for follow-up questions
- Confidence history and reasoning path tracking

### Phase 5 — Repository Reasoning Engine
- Question classification into 11 categories
- Source-backed answers with confidence scores
- Transparency section: "Why I answered this"
- CLI: `ghost-docs reason <repo> <question>`

### Phase 4 — Explain Repo Engine
- KnowledgeGraph → Markdown report generation
- Mermaid architecture diagrams
- Tech stack, folder responsibilities, entry points, execution flow
- CLI: `ghost-docs explain <repo>` with `--json` and `--markdown` flags

### Phase 3 — Knowledge Extraction Engine
- Renamed from Project Intelligence Engine
- KnowledgeGraph builder (structured JSON)
- Project summary, modules, auth, database, API detection

### Phase 2 — Project Intelligence Engine
- Repository scanning (file scanner, language detector, framework detector)
- Manifest builder (entry points, dependency graph, folder tree)
- Package manager and monorepo detection

### Phase 1 — CLI Foundation
- Commander-based CLI with explain, ask, pr commands
- OpenAI and Anthropic LLM abstraction

### Phase 0 — Architecture
- Monorepo setup with pnpm workspaces
- TypeScript configuration
- Vitest test framework
