use wasm_bindgen::prelude::*;
use sha3::{Digest, Keccak256};

const MAX_HASHES: u8 = 72;
const HASH_PATTERN: &str = "420";
const SUPERHASH_PATTERN: &str = "42069";

/// Simulate the on-chain find_hashes function.
/// Returns [hashes_count, superhashes_count] as a JS array.
#[wasm_bindgen]
pub fn find_hashes(nonce: &[u8], slot: u64) -> Vec<u8> {
    let mut hashes: u8 = 0;
    let mut superhashes: u8 = 0;

    for i in 0..MAX_HASHES {
        let mut hasher = Keccak256::new();
        hasher.update(nonce);
        hasher.update(slot.to_le_bytes());
        hasher.update(i.to_le_bytes());
        let result = hasher.finalize();
        let hex_string = hex::encode(result);
        if hex_string.contains(SUPERHASH_PATTERN) {
            superhashes += 1;
        } else if hex_string.contains(HASH_PATTERN) {
            hashes += 1;
        }
    }

    vec![hashes, superhashes]
}

/// Scan a range of slots to find the best one to mine.
/// Given a nonce (4 bytes) and a range of slots, returns the slot
/// with the highest expected hash count as [best_slot_lo, best_slot_hi, hashes, superhashes].
/// best_slot is split into lo/hi u32s because wasm doesn't have u64 natively.
#[wasm_bindgen]
pub fn scan_slots(nonce: &[u8], slot_start: u32, slot_start_hi: u32, count: u32) -> Vec<u32> {
    let start: u64 = (slot_start as u64) | ((slot_start_hi as u64) << 32);
    let mut best_slot: u64 = start;
    let mut best_hashes: u8 = 0;
    let mut best_superhashes: u8 = 0;
    let mut best_score: u32 = 0;

    for offset in 0..count {
        let slot = start + offset as u64;
        let mut hashes: u8 = 0;
        let mut superhashes: u8 = 0;

        for i in 0..MAX_HASHES {
            let mut hasher = Keccak256::new();
            hasher.update(nonce);
            hasher.update(slot.to_le_bytes());
            hasher.update(i.to_le_bytes());
            let result = hasher.finalize();
            let hex_string = hex::encode(result);
            if hex_string.contains(SUPERHASH_PATTERN) {
                superhashes += 1;
            } else if hex_string.contains(HASH_PATTERN) {
                hashes += 1;
            }
        }

        let score = (hashes as u32) + (superhashes as u32) * 250;
        if score > best_score {
            best_score = score;
            best_slot = slot;
            best_hashes = hashes;
            best_superhashes = superhashes;
        }
    }

    vec![
        best_slot as u32,
        (best_slot >> 32) as u32,
        best_hashes as u32,
        best_superhashes as u32,
    ]
}

/// Batch simulate: check multiple nonce values (as if the nonce changed).
/// This simulates what would happen if we called mine_hashes and the nonce evolved.
/// Returns total [hashes, superhashes] across all iterations.
#[wasm_bindgen]
pub fn simulate_batch(nonce: &[u8], slot: u64, iterations: u32) -> Vec<u32> {
    let mut total_hashes: u32 = 0;
    let mut total_superhashes: u32 = 0;
    let mut current_nonce = nonce.to_vec();

    for _ in 0..iterations {
        let mut hashes: u8 = 0;
        let mut superhashes: u8 = 0;

        for i in 0..MAX_HASHES {
            let mut hasher = Keccak256::new();
            hasher.update(&current_nonce);
            hasher.update(slot.to_le_bytes());
            hasher.update(i.to_le_bytes());
            let result = hasher.finalize();
            let hex_string = hex::encode(result);
            if hex_string.contains(SUPERHASH_PATTERN) {
                superhashes += 1;
            } else if hex_string.contains(HASH_PATTERN) {
                hashes += 1;
            }
        }

        total_hashes += hashes as u32;
        total_superhashes += superhashes as u32;

        // Evolve nonce (simulate on-chain nonce update)
        let mut hasher = Keccak256::new();
        hasher.update(&current_nonce);
        hasher.update(hashes.to_le_bytes());
        hasher.update(superhashes.to_le_bytes());
        hasher.update(slot.to_le_bytes());
        let new_nonce = hasher.finalize();
        current_nonce = new_nonce[0..4].to_vec();
    }

    vec![total_hashes, total_superhashes]
}
