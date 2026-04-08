//! Tailwind CSS Configuration Parser

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TailwindConfig {
    pub theme: ThemeConfig,
    pub variants: VariantsConfig,
    pub content: Vec<String>,
    pub safelist: Vec<String>,
    pub blocklist: Vec<String>,
    pub prefix: Option<String>,
    pub important: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ThemeConfig {
    pub extend: ThemeExtension,
    pub screens: HashMap<String, String>,
    pub colors: HashMap<String, String>,
    pub spacing: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ThemeExtension {
    pub screens: HashMap<String, String>,
    pub colors: HashMap<String, String>,
    pub spacing: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VariantsConfig {
    pub extend: HashMap<String, Vec<String>>,
}

pub fn parse_tailwind_config(config_json: &str) -> Result<TailwindConfig, String> {
    serde_json::from_str(config_json)
        .map_err(|e| format!("Failed to parse Tailwind config: {}", e))
}

pub fn generate_css_variables(config: &TailwindConfig) -> String {
    let mut vars = Vec::new();
    
    for (name, color) in &config.theme.colors {
        vars.push(format!("  --color-{}: {};", name.replace('.', "-"), color));
    }
    
    for (name, spacing) in &config.theme.spacing {
        vars.push(format!("  --spacing-{}: {};", name, spacing));
    }
    
    if vars.is_empty() {
        return String::new();
    }
    
    format!(":root {{\n{}\n}}\n", vars.join("\n"))
}