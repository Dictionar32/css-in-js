//! export-schemas — Generate JSON Schema dari semua public Rust structs.
//! 
//! Output: native/json-schemas/*.json
//! Dijalankan oleh: npm run generate:schemas
//! 
//! Usage: cargo run --bin export-schemas

use schemars::schema_for;
use serde_json;
use std::fs;
use std::path::Path;

// Import semua structs dari lib yang punya JsonSchema derive
// Note: harus pakai path relatif karena ini adalah separate binary
// Untuk sementara, kita generate schema dari structs yang sudah diketahui

fn main() {
    let out_dir = Path::new("native/json-schemas");
    fs::create_dir_all(out_dir).expect("Failed to create json-schemas dir");

    // List semua schema yang harus di-export
    // Ini akan di-expand seiring development
    let schemas: Vec<(&str, serde_json::Value)> = vec![
        // Contoh — akan diisi setelah structs di-refactor ke lib
    ];

    let mut exported = 0;
    for (name, schema) in &schemas {
        let filename = format!("{}.json", name);
        let path = out_dir.join(&filename);
        let json = serde_json::to_string_pretty(schema)
            .unwrap_or_else(|e| panic!("Failed to serialize {} schema: {}", name, e));
        fs::write(&path, json)
            .unwrap_or_else(|e| panic!("Failed to write {}: {}", path.display(), e));
        println!("[export-schemas] Generated: {}", path.display());
        exported += 1;
    }

    println!("[export-schemas] Done. {} schemas exported to {}/", exported, out_dir.display());
    println!("[export-schemas] Run: npx tsx scripts/generate-json-schemas.ts to create Zod schemas");
}
