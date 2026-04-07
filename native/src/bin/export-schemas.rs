use schemars::{schema_for, JsonSchema};
use serde::{Deserialize, Serialize};
use serde_json::{to_string_pretty, Value};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

#[derive(Serialize, Deserialize, JsonSchema)]
#[schemars(deny_unknown_fields)]
struct ParsedClassSchema {
    class_name: String,
    variants: Vec<String>,
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[schemars(deny_unknown_fields)]
struct TransformResultSchema {
    css: String,
    classes: Vec<String>,
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[schemars(deny_unknown_fields)]
struct ScanResultSchema {
    unique_classes: Vec<String>,
    files_scanned: usize,
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[schemars(deny_unknown_fields)]
struct AnalyzerReportSchema {
    total_classes: usize,
    duplicates: usize,
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[schemars(deny_unknown_fields)]
struct RouteClassMapSchema {
    route: String,
    classes: Vec<String>,
}

fn write_schema<T: schemars::JsonSchema>(out_dir: &Path, name: &str) -> io::Result<()> {
    let filename = format!("{name}.json");
    let path = out_dir.join(&filename);
    let schema = schema_for!(T);
    let mut value: Value = serde_json::to_value(&schema)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, format!("schema->value: {e}")))?;
    if let Some(map) = value.as_object_mut() {
        map.insert("$id".to_string(), Value::String(filename));
    }
    let json = to_string_pretty(&value)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, format!("serialize schema json: {e}")))?;
    fs::write(path, json)?;
    Ok(())
}

fn main() -> io::Result<()> {
    let out_dir = PathBuf::from("native/json-schemas");
    fs::create_dir_all(&out_dir)?;

    write_schema::<ParsedClassSchema>(&out_dir, "ParsedClass")?;
    write_schema::<TransformResultSchema>(&out_dir, "TransformResult")?;
    write_schema::<ScanResultSchema>(&out_dir, "ScanResult")?;
    write_schema::<AnalyzerReportSchema>(&out_dir, "AnalyzerReport")?;
    write_schema::<RouteClassMapSchema>(&out_dir, "RouteClassMap")?;

    println!("Exported schemas to {}", out_dir.display());
    Ok(())
}
