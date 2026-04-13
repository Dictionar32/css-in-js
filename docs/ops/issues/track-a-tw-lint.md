# Track A: Lint / Type Check

**Status:** ✅ Production-ready  
**Track:** A  
**Labels:** `track/A`, `status/production`

## Scope

TypeScript strictness, zero `any` types, no empty catch blocks.

## Gate Checklist

- [x] `any` types: 0 remaining (was 145+)
- [x] Empty catch blocks: annotated with intentional comments
- [x] `let` declarations: eliminated in hot paths (zero-let plan)
- [x] Biome lint: configured in `biome.json`
- [x] tsconfig.build.json: without path aliases (QA #24)

## Fixed Files

- `packages/core/src/types.ts` — CvFn, TwComponentFactory proper generics
- `packages/next/src/withTailwindStyled.ts` — NextWebpackOptions typed
- `packages/devtools/src/index.tsx` — breakpoint type annotated
- `packages/compiler/src/astParser.ts` — `let parseSync` → factory function
