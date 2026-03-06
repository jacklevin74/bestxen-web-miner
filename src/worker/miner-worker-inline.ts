// Inline worker code as a string - avoids bundling issues
export const MINER_WORKER_CODE = `
importScripts('https://cdn.jsdelivr.net/npm/js-sha3@0.8.0/src/sha3.min.js');

const MAX_HASHES = 72;
const HASH_PATTERN = '420';
const SUPERHASH_PATTERN = '42069';

let running = false;
let currentNonce = [0, 0, 0, 0];
let currentSlot = 0;
let slotsScanned = 0;
let totalHashesFound = 0;
let totalSuperhashesFound = 0;
let startTime = 0;

function findHashes(nonce, slot) {
  let hashes = 0;
  let superhashes = 0;
  
  const slotBytes = new Uint8Array(8);
  const dv = new DataView(slotBytes.buffer);
  dv.setUint32(0, slot >>> 0, true);
  dv.setUint32(4, Math.floor(slot / 0x100000000) >>> 0, true);
  
  const input = new Uint8Array(13);
  input.set(nonce, 0);
  input.set(slotBytes, 4);
  
  for (let i = 0; i < MAX_HASHES; i++) {
    input[12] = i;
    const hash = sha3.keccak256(input);
    
    if (hash.includes(SUPERHASH_PATTERN)) {
      superhashes++;
    } else if (hash.includes(HASH_PATTERN)) {
      hashes++;
    }
  }
  
  return [hashes, superhashes];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function mineLoop() {
  while (running) {
    const nonce = new Uint8Array(currentNonce);
    const slot = currentSlot;
    
    if (slot === 0) {
      await sleep(100);
      continue;
    }
    
    const [hashes, superhashes] = findHashes(nonce, slot);
    slotsScanned++;
    
    if (hashes > 0 || superhashes > 0) {
      totalHashesFound += hashes;
      totalSuperhashesFound += superhashes;
      
      self.postMessage({
        type: 'RESULT',
        hashes,
        superhashes,
        slot,
        nonce: Array.from(nonce),
        minerKind: 0,
        worthSubmitting: true,
      });
    }
    
    if (slotsScanned % 5 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      self.postMessage({
        type: 'STATS',
        slotsScanned,
        totalHashes: totalHashesFound,
        totalSuperhashes: totalSuperhashesFound,
        hashRate: elapsed > 0 ? Math.round((slotsScanned * MAX_HASHES) / elapsed) : 0,
        running,
      });
    }
    
    await sleep(0);
  }
}

self.onmessage = (e) => {
  const msg = e.data;
  
  switch (msg.type) {
    case 'START':
      if (running) return;
      running = true;
      currentNonce = msg.nonce;
      currentSlot = msg.slot;
      slotsScanned = 0;
      totalHashesFound = 0;
      totalSuperhashesFound = 0;
      startTime = Date.now();
      mineLoop();
      break;
      
    case 'STOP':
      running = false;
      self.postMessage({
        type: 'STATS',
        slotsScanned,
        totalHashes: totalHashesFound,
        totalSuperhashes: totalSuperhashesFound,
        hashRate: 0,
        running: false,
      });
      break;
      
    case 'UPDATE':
      currentNonce = msg.nonce;
      currentSlot = msg.slot;
      break;
  }
};

self.postMessage({ type: 'READY', wasmLoaded: false });
`;

// Create a worker from the inline code
export function createInlineMinerWorker(): Worker | null {
  try {
    const blob = new Blob([MINER_WORKER_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url, { type: 'classic' });
    
    // Clean up the blob URL after worker is created
    // URL.revokeObjectURL(url); // Keep for worker lifetime
    
    return worker;
  } catch (e) {
    console.error('[createInlineMinerWorker] Failed:', e);
    return null;
  }
}
