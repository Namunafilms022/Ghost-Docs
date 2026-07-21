# Contributing

## Development Setup

```bash
pnpm install
pnpm -r build
```

## Running Tests

```bash
pnpm test          # all tests
pnpm vitest run tests/reasoning-engine.test.ts  # single file
pnpm lint          # type checking
```

## Project Structure

- `packages/*` — modular packages (types, config, llm, intelligence-engine, etc.)
- `apps/cli` — CLI entry point
- `tests/` — test suites with fixtures

## Guidelines

1. **No hallucination** — every answer must have source references
2. **No LLM lock-in** — engine must work with any provider
3. **Marker safety** — always use `<!-- GHOST-DOCS:START -->` markers for generated content
4. **Test coverage** — every new module needs unit tests
5. **TypeScript strict** — `pnpm lint` must pass
6. **Phase discipline** — each phase is self-contained and tagged (`ghost-docs-v0.1-phaseN`)

## Adding a New Renderer

1. Create `packages/docs/src/renderers/<name>.ts`
2. Implement the `Renderer` interface (`render()` + `mimeType`)
3. Export from `packages/docs/src/renderers/index.ts`
4. Add CLI flag in `apps/cli/src/commands/explain.ts`
