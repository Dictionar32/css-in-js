//! Tailwind CSS Utility Database - Known classes and variants

use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct TailwindDatabase {
    utilities: HashSet<String>,
    variants: HashSet<String>,
    colors: HashSet<String>,
}

impl TailwindDatabase {
    pub fn new() -> Self {
        let mut utilities = HashSet::new();
        let mut variants = HashSet::new();
        let mut colors = HashSet::new();
        
        // Variants
        for v in &["hover", "focus", "active", "disabled", "checked", "first", "last", "odd", "even", "before", "after", "placeholder"] {
            variants.insert(v.to_string());
        }
        
        // Colors
        for color in &["slate", "gray", "zinc", "red", "blue", "green", "yellow", "purple", "pink", "orange"] {
            colors.insert(color.to_string());
            for shade in &[50, 100, 200, 300, 400, 500, 600, 700, 800, 900] {
                utilities.insert(format!("bg-{}-{}", color, shade));
                utilities.insert(format!("text-{}-{}", color, shade));
            }
        }
        
        // Layout utilities
        for util in &["flex", "grid", "block", "inline", "hidden", "relative", "absolute", "sticky", "fixed"] {
            utilities.insert(util.to_string());
        }
        
        Self { utilities, variants, colors }
    }
    
    pub fn is_known_utility(&self, class: &str) -> bool {
        if self.utilities.contains(class) {
            return true;
        }
        
        // Check prefixes
        let prefixes = &["p-", "m-", "w-", "h-", "gap-", "text-", "font-", "rounded-", "shadow-", "opacity-"];
        prefixes.iter().any(|p| class.starts_with(p)) ||
        class.contains('[') && class.contains(']')
    }
    
    pub fn get_variants(&self) -> &HashSet<String> {
        &self.variants
    }
    
    pub fn get_colors(&self) -> &HashSet<String> {
        &self.colors
    }
}

impl Default for TailwindDatabase {
    fn default() -> Self {
        Self::new()
    }
}