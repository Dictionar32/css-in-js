//! Tailwind CSS Compiler with Lightning CSS

use crate::lightning::{compile_classes_with_lightning, CompiledCssResult, minify_css};
use super::config::TailwindConfig;

#[derive(Debug, Clone)]
pub struct TailwindCompileOptions {
    pub minify: bool,
    pub prefix: Option<String>,
    pub important: bool,
}

impl Default for TailwindCompileOptions {
    fn default() -> Self {
        Self {
            minify: true,
            prefix: None,
            important: false,
        }
    }
}

/// Compile Tailwind classes with full Tailwind config support
pub fn compile_tailwind_css(
    classes: &[String],
    options: TailwindCompileOptions,
    config: Option<&TailwindConfig>,
) -> CompiledCssResult {
    // Apply prefix if configured
    let prefixed_classes: Vec<String> = if let Some(prefix) = &options.prefix {
        classes.iter().map(|c| format!("{}{}", prefix, c)).collect()
    } else {
        classes.to_vec()
    };
    
    // Filter by safelist/blocklist if config provided
    let filtered_classes: Vec<String> = if let Some(cfg) = config {
        prefixed_classes
            .into_iter()
            .filter(|c| {
                // Check blocklist
                if cfg.blocklist.iter().any(|b| c.contains(b)) {
                    return false;
                }
                // Check safelist (if safelist exists, only include safelisted classes)
                if !cfg.safelist.is_empty() {
                    return cfg.safelist.iter().any(|s| c.starts_with(s));
                }
                true
            })
            .collect()
    } else {
        prefixed_classes
    };
    
    // Compile with Lightning CSS
    let mut result = compile_classes_with_lightning(&filtered_classes, options.minify);
    
    // Add important flag if needed
    if options.important && !result.css.is_empty() {
        // Add !important to all declarations
        let important_css = result.css
            .lines()
            .map(|line| {
                if line.contains('{') || line.contains('}') || line.starts_with('@') {
                    line.to_string()
                } else if line.contains(':') && !line.contains("!important") {
                    line.replace(';', " !important;")
                } else {
                    line.to_string()
                }
            })
            .collect::<Vec<_>>()
            .join("\n");
        result.css = important_css;
    }
    
    result
}

/// Batch compile multiple class groups with Tailwind config
pub fn batch_compile_tailwind(
    class_groups: Vec<Vec<String>>,
    options: TailwindCompileOptions,
    config: Option<&TailwindConfig>,
) -> Vec<CompiledCssResult> {
    use rayon::prelude::*;
    
    class_groups
        .par_iter()
        .map(|group| compile_tailwind_css(group, options.clone(), config))
        .collect()
}

/// Minify existing CSS with Lightning CSS
pub fn minify_tailwind_css(css: &str) -> String {
    minify_css(css)
}