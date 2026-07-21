# 👻 Ghost Docs

[![npm version](https://img.shields.io/npm/v/ghost-docs?color=blue&logo=npm)](https://www.npmjs.com/package/ghost-docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-141%20passing-brightgreen)](https://github.com/Namunafilms022/Ghost-Docs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Namunafilms022/Ghost-Docs/pulls)

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

## Quick Start (No Install Required)

```bash
# Explain any repo (generates README + architecture diagram)
npx ghost-docs explain ./my-project

# Ask questions about any codebase
npx ghost-docs reason ./my-project "What does this do?"
npx ghost-docs reason ./my-project "How does authentication work?"

# Preview documentation changes
npx ghost-docs pr ./my-project
```

## Installation

```bash
# Global install
npm install -g ghost-docs

# Or use directly with npx (no install needed)
npx ghost-docs explain <repo-path>
```

## CLI Usage

### Explain a repository

```bash
# Markdown report (default)
ghost-docs explain ./my-project

# Raw JSON knowledge graph
ghost-docs explain ./my-project --json

# Remote repository
ghost-docs explain https://github.com/user/repo
```

### Reason about a repository

```bash
ghost-docs reason ./my-project "What does this do?"
ghost-docs reason ./my-project "Where is authentication?"
ghost-docs reason ./my-project "What testing framework?"
ghost-docs reason ./my-project "How to build?"
ghost-docs reason ./my-project "What database?"
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
