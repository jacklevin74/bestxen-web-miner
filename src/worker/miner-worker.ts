/**
 * bestXEN Web Mining Worker
 * 
 * Runs keccak256 hashing in a Web Worker to avoid blocking the UI.
 * Uses js-sha3 for keccak256 (pure JS, works in all browsers).
 * 
 * The on-chain algorithm (from bestxen-miner/src/lib.rs):
 *   for i in 0..72:
 *     hash = keccak256(nonce[4] + slot.to_le_bytes()[8] + i.to_le_bytes()[1])
 *     if hex(hash).contains("42069") → superhash
 *     elif hex(hash).contains("420") → hash
 * 
 * The browser pre-computes this to predict if a mine_hashes tx will yield hashes.
 */

import { keccak256 } from 'js-sha3'

const MAX_HASHES = 72
const HASH_PATTERN = '420'
const SUPERHASH_PATTERN = '42069'

// State
let running = false
let currentNonce: number[] = [0, 0, 0, 0]
let currentSlot = 0
let slotsScanned = 0
let totalHashesFound = 0
let totalSuperhashesFound = 0
let startTime = 0

/**
 * Replicates the on-chain find_hashes exactly:
 *   keccak256(nonce[4] + slot.to_le_bytes()[8] + i.to_le_bytes()[1])
 * Checks hex output for "420" (hash) and "42069" (superhash) substrings.
 */
function findHashes(nonce: Uint8Array, slot: number): [number, number] {
  let hashes = 0
  let superhashes = 0

  // Build slot bytes (u64 LE)
  const slotBytes = new Uint8Array(8)
  const dv = new DataView(slotBytes.buffer)
  dv.setUint32(0, slot >>> 0, true) // low 32 bits
  dv.setUint32(4, Math.floor(slot / 0x100000000) >>> 0, true) // high 32 bits

  // Pre-allocate: nonce(4) + slot(8) + i(1) = 13 bytes
  const input = new Uint8Array(13)
  input.set(nonce, 0)
  input.set(slotBytes, 4)

  for (let i = 0; i < MAX_HASHES; i++) {
    input[12] = i
    const hash = keccak256(input) // hex string
    
    if (hash.includes(SUPERHASH_PATTERN)) {
      superhashes++
    } else if (hash.includes(HASH_PATTERN)) {
      hashes++
    }
  }

  return [hashes, superhashes]
}

/**
 * Main mining loop.
 * Continuously checks the current slot/nonce and reports hash results.
 */
async function mineLoop() {
  while (running) {
    const nonce = new Uint8Array(currentNonce)
    const slot = currentSlot

    if (slot === 0) {
      await sleep(100)
      continue
    }

    const [hashes, superhashes] = findHashes(nonce, slot)
    slotsScanned++

    if (hashes > 0 || superhashes > 0) {
      totalHashesFound += hashes
      totalSuperhashesFound += superhashes

      self.postMessage({
        type: 'RESULT',
        hashes,
        superhashes,
        slot,
        nonce: Array.from(nonce),
        minerKind: 0,
        worthSubmitting: true,
      })
    }

    // Report stats every 5 scans
    if (slotsScanned % 5 === 0) {
      const elapsed = (Date.now() - startTime) / 1000
      self.postMessage({
        type: 'STATS',
        slotsScanned,
        totalHashes: totalHashesFound,
        totalSuperhashes: totalSuperhashesFound,
        hashRate: elapsed > 0 ? Math.round((slotsScanned * MAX_HASHES) / elapsed) : 0,
        running,
      })
    }

    // Yield to process incoming messages
    await sleep(0)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Handle messages from main thread
self.onmessage = (e: MessageEvent) => {
  const msg = e.data

  switch (msg.type) {
    case 'START':
      if (running) return
      running = true
      currentNonce = msg.nonce
      currentSlot = msg.slot
      slotsScanned = 0
      totalHashesFound = 0
      totalSuperhashesFound = 0
      startTime = Date.now()
      mineLoop()
      break

    case 'STOP':
      running = false
      self.postMessage({
        type: 'STATS',
        slotsScanned,
        totalHashes: totalHashesFound,
        totalSuperhashes: totalSuperhashesFound,
        hashRate: 0,
        running: false,
      })
      break

    case 'UPDATE':
      currentNonce = msg.nonce
      currentSlot = msg.slot
      break
  }
}

// Signal ready immediately
self.postMessage({ type: 'READY', wasmLoaded: false })
