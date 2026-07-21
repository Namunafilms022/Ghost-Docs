# 👻 Ghost Docs

**AI Technical Writer that understands your codebase.**

Ghost Docs analyzes any software project and produces structured documentation — no LLM hallucinations, no guesswork. Everything is extracted from your actual source code.

## Features

- **Knowledge Extraction** — Scans repos and builds a structured knowledge graph
- **Explain Repo** — Generates README-style reports with Mermaid architecture diagrams
- **Repository Reasoning** — Answers questions about any codebase with source-backed evidence
- **Documentation Sync** — Auto-updates docs when code changes, preserves manual content
- **Zero Hallucination** — Every answer includes confidence scores and source references
- **Marker Protection** — `<!-- GHOST-DOCS:START -->` / `<!-- GHOST-DOCS:END -->` sections never overwrite manual edits

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     CLI Layer                        │
│  explain | reason | pr                              │
├─────────────────────────────────────────────────────┤
│                  Engine Layer                        │
│  ┌────────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Knowledge   │  │ Reasoning│  │ Documentation  │   │
│  │ Extraction  │  │ Engine   │  │ Sync Engine    │   │
│  └────────────┘  └──────────┘  └────────────────┘   │
├─────────────────────────────────────────────────────┤
│                  Support Layer                       │
│  ┌────────┐  ┌──────┐  ┌──────┐  ┌──────────────┐   │
│  │ Config │  │ LLM  │  │ Docs │  │ GitHub       │   │
│  │        │  │       │  │      │  │ Adapter      │   │
│  └────────┘  └──────┘  └──────┘  └──────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Installation

```bash
# Clone the repository
git clone https://github.com/ghost-docs/ghost-docs.git
cd ghost-docs

# Install dependencies
pnpm install

# Build all packages
pnpm -r build
```

## CLI Usage

### Explain a repository

```bash
# Markdown report (default)
ghost-docs explain ./my-project

# Raw JSON knowledge graph
ghost-docs explain ./my-project --json
```

### Reason about a repository

```bash
ghost-docs reason ./my-project "How does authentication work?"
ghost-docs reason ./my-project "Where is the database layer?"
ghost-docs reason ./my-project "What testing framework is used?"
```

### Sync documentation

```bash
# Preview changes (dry run — default)
ghost-docs pr ./my-project

# Create a PR on GitHub
ghost-docs pr https://github.com/user/repo
```

## Project Structure

```
ghost-docs/
├── apps/
│   └── cli/              # CLI application (commander-based)
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── config/           # Environment configuration (Zod)
│   ├── intelligence-engine/  # Code scanning & manifest building
│   ├── reasoning-engine/     # Context-aware Q&A engine
│   ├── docs/             # Markdown/Mermaid generators
│   ├── sync-engine/      # Documentation sync & PR creation
│   ├── llm/              # LLM abstraction (OpenAI/Anthropic)
│   ├── parser/           # Code parser (placeholder)
│   ├── github/            # GitHub API adapter
│   └── shared/           # Shared utilities
└── tests/                # Test suites
    └── fixtures/         # Sample repos for testing
```

## Roadmap

- [x] **Phase 0** — Architecture & project setup
- [x] **Phase 1** — CLI foundation (commander)
- [x] **Phase 2** — Project Intelligence Engine (manifest builder)
- [x] **Phase 3** — Knowledge Extraction Engine (knowledge graph)
- [x] **Phase 4** — Explain Repo Engine (markdown + mermaid)
- [x] **Phase 5** — Repository Reasoning Engine (Q&A)
- [x] **Phase 5.5** — Repository Context Engine (session tracking)
- [x] **Phase 6** — Documentation Synchronization Engine (auto PR)
- [ ] **Phase 7+** — Dashboard, VS Code Extension, GitHub App

## Testing

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm vitest run tests/explain-repo.test.ts

# Type check
pnpm lint
```

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
