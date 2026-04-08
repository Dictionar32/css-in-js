//! CSS Minifier using Lightning CSS

use lightningcss::{
    stylesheet::{ParserOptions, PrinterOptions, StyleSheet},
    targets::{Browsers, Targets},
    traits::ToCss,
};

pub fn minify_css(css: &str) -> String {
    let targets = Targets {
        browsers: Browsers::default(),
        ..Default::default()
    };
    
    let mut stylesheet = match StyleSheet::parse(css, ParserOptions::default()) {
        Ok(ss) => ss,
        Err(_) => return css.to_string(),
    };
    
    let _ = stylesheet.minify();
    
    match stylesheet.to_css(PrinterOptions {
        minify: true,
        targets: Some(targets),
        ..Default::default()
    }) {
        Ok(result) => result.code,
        Err(_) => css.to_string(),
    }
}

pub fn minify_css_with_options(css: &str, minify: bool, source_map: bool) -> String {
    if !minify {
        return css.to_string();
    }
    
    let targets = Targets {
        browsers: Browsers::default(),
        ..Default::default()
    };
    
    let mut stylesheet = match StyleSheet::parse(css, ParserOptions::default()) {
        Ok(ss) => ss,
        Err(_) => return css.to_string(),
    };
    
    let _ = stylesheet.minify();
    
    match stylesheet.to_css(PrinterOptions {
        minify: true,
        targets: Some(targets),
        source_map,
        ..Default::default()
    }) {
        Ok(result) => result.code,
        Err(_) => css.to_string(),
    }
}