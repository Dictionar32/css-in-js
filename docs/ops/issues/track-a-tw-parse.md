# Track A: Tailwind Class Parsing

**Status:** ✅ Production-ready  
**Track:** A (Prototipe → Buildable)  
**Labels:** `track/A`, `status/production`

## Scope

Native Rust class parser (`parse_classes`, `parse_classes_inner`) fully implemented.

## Gate Checklist

- [x] Build: `npm run build:rust` passes
- [x] Test: `cargo test` passes (parse, transform, RSC tests)
- [x] Lint: `cargo clippy` clean
- [x] Docs: `docs/api/scanner.md` updated to English
- [x] Integration: used by scanner, compiler, engine

## Implementation

- **Location:** `native/src/lib.rs` — `parse_classes_inner()`, `parse_classes()`
- **Optimizations:** `Vec::with_capacity`, regex lazy init (`once_cell::Lazy`)
- **Test coverage:** `native/src/lib.rs` `#[cfg(test)]` block
