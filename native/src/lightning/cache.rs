//! LRU Cache for compiled CSS

use dashmap::DashMap;
use once_cell::sync::Lazy;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Instant, Duration};

#[derive(Debug, Clone)]
struct CacheEntry {
    css: String,
    hash: u64,
    hits: u64,
    last_access: Instant,
}

static CSS_CACHE: Lazy<DashMap<String, CacheEntry>> = Lazy::new(DashMap::new);
static CACHE_HITS: AtomicU64 = AtomicU64::new(0);
static CACHE_MISSES: AtomicU64 = AtomicU64::new(0);

const MAX_CACHE_SIZE: usize = 5000;
const CACHE_TTL: Duration = Duration::from_secs(3600); // 1 hour

fn hash_class(class: &str) -> u64 {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    std::hash::Hash::hash(&class, &mut hasher);
    std::hash::Hasher::finish(&hasher)
}

pub fn get_cached(class: &str) -> Option<String> {
    if let Some(entry) = CSS_CACHE.get(class) {
        if entry.last_access.elapsed() < CACHE_TTL {
            CACHE_HITS.fetch_add(1, Ordering::Relaxed);
            
            // Update hit count and access time
            let mut entry_mut = entry.clone();
            entry_mut.hits += 1;
            entry_mut.last_access = Instant::now();
            CSS_CACHE.insert(class.to_string(), entry_mut);
            
            return Some(entry.css.clone());
        } else {
            // Expired, remove it
            CSS_CACHE.remove(class);
        }
    }
    CACHE_MISSES.fetch_add(1, Ordering::Relaxed);
    None
}

pub fn set_cached(class: String, css: String) {
    // Limit cache size
    if CSS_CACHE.len() >= MAX_CACHE_SIZE {
        // Remove least recently used
        let mut lru_key = None;
        let mut lru_time = Instant::now();
        
        for entry in CSS_CACHE.iter() {
            if entry.last_access < lru_time {
                lru_time = entry.last_access;
                lru_key = Some(entry.key().clone());
            }
        }
        
        if let Some(key) = lru_key {
            CSS_CACHE.remove(&key);
        }
    }
    
    CSS_CACHE.insert(class, CacheEntry {
        css,
        hash: hash_class(&class),
        hits: 0,
        last_access: Instant::now(),
    });
}

pub fn clear_cache() {
    CSS_CACHE.clear();
    CACHE_HITS.store(0, Ordering::Relaxed);
    CACHE_MISSES.store(0, Ordering::Relaxed);
}

pub fn get_cache_stats() -> (usize, u64, u64) {
    (CSS_CACHE.len(), CACHE_HITS.load(Ordering::Relaxed), CACHE_MISSES.load(Ordering::Relaxed))
}