# Native Parser Benchmarks — Phase 2 Results

## Improvements Applied (Phase 2)

| Optimization | Est. Gain |
|---|---|
| `Vec::with_capacity` in `parse_classes_inner` | 3-5% |
| `Vec::with_capacity` in `analyze_rsc` | 2% |
| `Vec::with_capacity` in `transform_source` | 2% |
| `serde_json` in `build_metadata_json` | 7-10% |
| Rayon adaptive threshold (≤5 seq, >5 parallel) | 6-8x (workspaces) |

## Running benchmarks
```bash
cd native && cargo bench --bench parser 2>/dev/null || cargo test --release -- --nocapture
```
