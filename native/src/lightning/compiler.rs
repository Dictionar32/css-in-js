//! Lightning CSS Compiler Core

use super::cache::{get_cached, set_cached, get_cache_stats};
use super::minifier::minify_css;
use once_cell::sync::Lazy;
use regex::Regex;
use rayon::prelude::*;
use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct CompiledCssResult {
    pub css: String,
    pub resolved_classes: Vec<String>,
    pub unknown_classes: Vec<String>,
    pub size_bytes: usize,
    pub compile_time_ms: f64,
}

/// Mapping dari Tailwind class ke CSS declaration
fn class_to_css_declaration(class: &str) -> Option<String> {
    // Display utilities
    match class {
        "block" => return Some("display: block".to_string()),
        "inline-block" => return Some("display: inline-block".to_string()),
        "inline" => return Some("display: inline".to_string()),
        "flex" => return Some("display: flex".to_string()),
        "inline-flex" => return Some("display: inline-flex".to_string()),
        "grid" => return Some("display: grid".to_string()),
        "hidden" => return Some("display: none".to_string()),
        "contents" => return Some("display: contents".to_string()),
        
        // Position
        "static" => return Some("position: static".to_string()),
        "fixed" => return Some("position: fixed".to_string()),
        "absolute" => return Some("position: absolute".to_string()),
        "relative" => return Some("position: relative".to_string()),
        "sticky" => return Some("position: sticky".to_string()),
        
        _ => {}
    }
    
    // Colors
    if class.starts_with("bg-") {
        return Some(format!("background-color: {}", resolve_color(&class[3..])));
    }
    if class.starts_with("text-") {
        return Some(format!("color: {}", resolve_color(&class[5..])));
    }
    if class.starts_with("border-") {
        return Some(format!("border-color: {}", resolve_color(&class[7..])));
    }
    
    // Spacing
    if let Some(spacing) = resolve_spacing(class) {
        return Some(spacing);
    }
    
    // Typography
    if class.starts_with("text-") && !class.starts_with("text-[") {
        if let Some(size) = resolve_font_size(&class[5..]) {
            return Some(size);
        }
    }
    
    if class.starts_with("font-") {
        let weight = match &class[5..] {
            "thin" => "100", "extralight" => "200", "light" => "300",
            "normal" => "400", "medium" => "500", "semibold" => "600",
            "bold" => "700", "extrabold" => "800", "black" => "900",
            _ => return None,
        };
        return Some(format!("font-weight: {}", weight));
    }
    
    // Border radius
    if class.starts_with("rounded") {
        let radius = match class {
            "rounded-none" => "0",
            "rounded-sm" => "0.125rem",
            "rounded" => "0.25rem",
            "rounded-md" => "0.375rem",
            "rounded-lg" => "0.5rem",
            "rounded-xl" => "0.75rem",
            "rounded-2xl" => "1rem",
            "rounded-full" => "9999px",
            _ => return None,
        };
        return Some(format!("border-radius: {}", radius));
    }
    
    // Shadow
    if class == "shadow" {
        return Some("box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)".to_string());
    }
    if class == "shadow-md" {
        return Some("box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)".to_string());
    }
    if class == "shadow-lg" {
        return Some("box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)".to_string());
    }
    
    // Opacity
    if class.starts_with("opacity-") {
        let val = &class[8..];
        let opacity = match val {
            "0" => "0", "5" => "0.05", "10" => "0.1", "20" => "0.2",
            "25" => "0.25", "30" => "0.3", "40" => "0.4", "50" => "0.5",
            "60" => "0.6", "70" => "0.7", "75" => "0.75", "80" => "0.8",
            "90" => "0.9", "95" => "0.95", "100" => "1",
            _ => return None,
        };
        return Some(format!("opacity: {}", opacity));
    }
    
    // Arbitrary values
    if class.contains('[') && class.contains(']') {
        return arbitrary_to_css(class);
    }
    
    None
}

fn resolve_color(color: &str) -> String {
    match color {
        "white" => "rgb(255 255 255)".to_string(),
        "black" => "rgb(0 0 0)".to_string(),
        "transparent" => "transparent".to_string(),
        "current" => "currentColor".to_string(),
        "blue-500" => "rgb(59 130 246)".to_string(),
        "blue-600" => "rgb(37 99 235)".to_string(),
        "red-500" => "rgb(239 68 68)".to_string(),
        "green-500" => "rgb(34 197 94)".to_string(),
        "yellow-500" => "rgb(234 179 8)".to_string(),
        "gray-500" => "rgb(107 114 128)".to_string(),
        "gray-900" => "rgb(17 24 39)".to_string(),
        _ => color.to_string(),
    }
}

fn resolve_spacing(class: &str) -> Option<String> {
    let (property, value) = if class.starts_with("p-") {
        ("padding", &class[2..])
    } else if class.starts_with("m-") {
        ("margin", &class[2..])
    } else if class.starts_with("w-") {
        ("width", &class[2..])
    } else if class.starts_with("h-") {
        ("height", &class[2..])
    } else if class.starts_with("gap-") {
        ("gap", &class[4..])
    } else {
        return None;
    };
    
    let rem = match value {
        "0" => "0", "px" => "1px", "0.5" => "0.125rem", "1" => "0.25rem",
        "1.5" => "0.375rem", "2" => "0.5rem", "2.5" => "0.625rem", "3" => "0.75rem",
        "3.5" => "0.875rem", "4" => "1rem", "5" => "1.25rem", "6" => "1.5rem",
        "7" => "1.75rem", "8" => "2rem", "9" => "2.25rem", "10" => "2.5rem",
        "11" => "2.75rem", "12" => "3rem", "14" => "3.5rem", "16" => "4rem",
        "20" => "5rem", "24" => "6rem", "28" => "7rem", "32" => "8rem",
        "36" => "9rem", "40" => "10rem", "44" => "11rem", "48" => "12rem",
        "52" => "13rem", "56" => "14rem", "60" => "15rem", "64" => "16rem",
        "72" => "18rem", "80" => "20rem", "96" => "24rem", "auto" => "auto",
        "full" => "100%", "screen" => "100vw",
        _ => return None,
    };
    
    Some(format!("{}: {}", property, rem))
}

fn resolve_font_size(size: &str) -> Option<String> {
    let rem = match size {
        "xs" => "0.75rem", "sm" => "0.875rem", "base" => "1rem",
        "lg" => "1.125rem", "xl" => "1.25rem", "2xl" => "1.5rem",
        "3xl" => "1.875rem", "4xl" => "2.25rem", "5xl" => "3rem",
        "6xl" => "3.75rem", "7xl" => "4.5rem", "8xl" => "6rem",
        "9xl" => "8rem",
        _ => return None,
    };
    Some(format!("font-size: {}", rem))
}

fn arbitrary_to_css(class: &str) -> Option<String> {
    let bracket_start = class.find('[')?;
    let bracket_end = class.rfind(']')?;
    let prefix = &class[..bracket_start];
    let value = &class[bracket_start + 1..bracket_end];
    
    let (property, formatted) = match prefix {
        "bg" => ("background-color", value.to_string()),
        "text" => ("color", value.to_string()),
        "border" => ("border-color", value.to_string()),
        "p" => ("padding", value.to_string()),
        "px" => ("padding-left", format!("{}; padding-right: {}", value, value)),
        "py" => ("padding-top", format!("{}; padding-bottom: {}", value, value)),
        "m" => ("margin", value.to_string()),
        "mx" => ("margin-left", format!("{}; margin-right: {}", value, value)),
        "my" => ("margin-top", format!("{}; margin-bottom: {}", value, value)),
        "w" => ("width", value.to_string()),
        "h" => ("height", value.to_string()),
        "gap" => ("gap", value.to_string()),
        "rounded" => ("border-radius", value.to_string()),
        _ => return None,
    };
    
    if formatted.contains(';') {
        Some(format!("{} {{ {} }}", escape_class_name(class), formatted))
    } else {
        Some(format!("{} {{ {}: {}; }}", escape_class_name(class), property, formatted))
    }
}

fn escape_class_name(class: &str) -> String {
    class
        .replace(':', "\\:")
        .replace('[', "\\[")
        .replace(']', "\\]")
        .replace('/', "\\/")
        .replace('.', "\\.")
}

fn build_selector(class: &str) -> String {
    let parts: Vec<&str> = class.split(':').collect();
    let (variants, base) = if parts.len() > 1 {
        (parts[..parts.len()-1].to_vec(), parts.last().unwrap())
    } else {
        (vec![], parts[0])
    };
    
    let mut selector = format!(".{}", escape_class_name(base));
    
    for variant in variants.iter().rev() {
        selector = match *variant {
            "hover" => format!("{}:hover", selector),
            "focus" => format!("{}:focus", selector),
            "active" => format!("{}:active", selector),
            "disabled" => format!("{}:disabled", selector),
            "checked" => format!("{}:checked", selector),
            "first" => format!("{}:first-child", selector),
            "last" => format!("{}:last-child", selector),
            "odd" => format!("{}:nth-child(odd)", selector),
            "even" => format!("{}:nth-child(even)", selector),
            "before" => format!("{}::before", selector),
            "after" => format!("{}::after", selector),
            "placeholder" => format!("{}::placeholder", selector),
            "sm" => format!("@media (min-width: 640px) {{ {} }}", selector),
            "md" => format!("@media (min-width: 768px) {{ {} }}", selector),
            "lg" => format!("@media (min-width: 1024px) {{ {} }}", selector),
            "xl" => format!("@media (min-width: 1280px) {{ {} }}", selector),
            "2xl" => format!("@media (min-width: 1536px) {{ {} }}", selector),
            "dark" => format!("@media (prefers-color-scheme: dark) {{ {} }}", selector),
            _ => selector,
        };
    }
    
    selector
}

/// Compile single class to CSS
pub fn compile_single_class(class: &str, minify: bool) -> Option<String> {
    // Check cache
    if let Some(cached) = get_cached(class) {
        return Some(cached);
    }
    
    // Generate CSS
    let declaration = class_to_css_declaration(class)?;
    let selector = build_selector(class);
    let raw_css = format!("{} {{ {}; }}", selector, declaration);
    
    let final_css = if minify {
        minify_css(&raw_css)
    } else {
        raw_css
    };
    
    set_cached(class.to_string(), final_css.clone());
    Some(final_css)
}

/// Compile multiple classes to CSS
pub fn compile_classes_with_lightning(classes: &[String], minify: bool) -> CompiledCssResult {
    let start = std::time::Instant::now();
    
    let mut resolved = Vec::new();
    let mut unknown = Vec::new();
    let mut css_parts = Vec::new();
    
    for class in classes {
        if let Some(css) = compile_single_class(class, minify) {
            css_parts.push(css);
            resolved.push(class.clone());
        } else {
            unknown.push(class.clone());
            // Fallback: @apply rule
            let fallback = format!(".{} {{ @apply {}; }}", escape_class_name(class), class);
            css_parts.push(fallback);
        }
    }
    
    let css = css_parts.join("\n");
    let size_bytes = css.len();
    let compile_time_ms = start.elapsed().as_secs_f64() * 1000.0;
    
    CompiledCssResult {
        css,
        resolved_classes: resolved,
        unknown_classes: unknown,
        size_bytes,
        compile_time_ms,
    }
}

/// Batch compile multiple class groups in parallel
pub fn batch_compile_lightning(class_groups: Vec<Vec<String>>, minify: bool) -> Vec<CompiledCssResult> {
    class_groups
        .par_iter()
        .map(|group| compile_classes_with_lightning(group, minify))
        .collect()
}