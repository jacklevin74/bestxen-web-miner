import { useState, useEffect, useRef, useCallback } from 'react'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { X1_RPC, MINER_IDS } from '../constants'
import { createInlineMinerWorker } from '../worker/miner-worker-inline'

// Dummy ETH address (all zeros with valid checksum format)
const DUMMY_ETH_ADDR = '0x0000000000000000000000000000000000000000'
const DUMMY_ETH_BYTES = new Uint8Array(20)

export type MinerStatus = 'idle' | 'loading' | 'ready' | 'mining' | 'submitting' | 'paused' | 'error'

export interface MinerStats {
  status:           MinerStatus
  slotsScanned:     number
  hashRate:         number      // keccak256 ops per second
  hashesFound:      number
  superhashesFound: number
  txSubmitted:      number
  txConfirmed:      number
  txFailed:         number
  currentSlot:      number
  currentNonce:     number[]
  amp:              number
  error:            string | null
  lastTxSig:        string | null
  minerKind:        number
}

const INITIAL_STATS: MinerStats = {
  status: 'idle',
  slotsScanned: 0,
  hashRate: 0,
  hashesFound: 0,
  superhashesFound: 0,
  txSubmitted: 0,
  txConfirmed: 0,
  txFailed: 0,
  currentSlot: 0,
  currentNonce: [0, 0, 0, 0],
  amp: 0,
  error: null,
  lastTxSig: null,
  minerKind: 0,
}

// Parse the global XN record from miner account data
// Anchor layout: [8]disc [2]amp [8]last_amp_slot [4]nonce [1]kind [8]hashes [4]superhashes [16]points
function parseGlobalXnRecord(data: Buffer): { amp: number; nonce: number[]; slot: number } {
  if (data.length < 23) return { amp: 0, nonce: [0, 0, 0, 0], slot: 0 }
  const amp = data.readUInt16LE(8)
  const lastAmpSlot = Number(data.readBigUInt64LE(10))
  const nonce = [data[18], data[19], data[20], data[21]]
  return { amp, nonce, slot: lastAmpSlot }
}

export function useMiner(
  publicKey: PublicKey | null,
  signTransaction: ((tx: Transaction) => Promise<Transaction>) | undefined,
  ethAddress?: string,
) {
  const [stats, setStats] = useState<MinerStats>(INITIAL_STATS)
  const workerRef = useRef<Worker | null>(null)
  const connectionRef = useRef<Connection>(new Connection(X1_RPC, 'confirmed'))
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const minerKindRef = useRef(0)
  const autoSubmitRef = useRef(false)
  const submittingRef = useRef(false)
  
  // Use refs for values needed in callbacks to avoid stale closures
  const publicKeyRef = useRef(publicKey)
  const signTransactionRef = useRef(signTransaction)
  const ethAddressRef = useRef(ethAddress)
  
  useEffect(() => { publicKeyRef.current = publicKey }, [publicKey])
  useEffect(() => { signTransactionRef.current = signTransaction }, [signTransaction])
  useEffect(() => { ethAddressRef.current = ethAddress }, [ethAddress])

  // Submit mine_hashes transaction
  const submitMineHashesTx = useCallback(async () => {
    const pk = publicKeyRef.current
    const signTx = signTransactionRef.current
    if (!pk || !signTx || submittingRef.current) return

    submittingRef.current = true
    setStats(s => ({ ...s, status: 'submitting' }))

    try {
      const conn = connectionRef.current
      const kind = minerKindRef.current
      const minerPK = new PublicKey(MINER_IDS[kind])

      // Anchor discriminator: sha256("global:mine_hashes")[0..8]
      const disc = await computeDiscriminator('mine_hashes')

      // Serialize EthAccount { address: [u8; 20], address_str: String }
      const ethAddr = ethAddressRef.current || DUMMY_ETH_ADDR
      const ethBytes = ethAddressRef.current
        ? hexToBytes(ethAddressRef.current.replace('0x', ''))
        : DUMMY_ETH_BYTES

      const addrStr = ethAddr.startsWith('0x') ? ethAddr : '0x' + ethAddr
      const strBytes = new TextEncoder().encode(addrStr)
      const ethAccountData = new Uint8Array(20 + 4 + strBytes.length)
      ethAccountData.set(ethBytes, 0)
      new DataView(ethAccountData.buffer).setUint32(20, strBytes.length, true)
      ethAccountData.set(strBytes, 24)

      const kindByte = new Uint8Array([kind])

      // instruction data: disc(8) + eth_account(borsh) + kind(1)
      const data = Buffer.concat([
        Buffer.from(disc),
        Buffer.from(ethAccountData),
        Buffer.from(kindByte),
      ])

      // Derive PDAs
      const [globalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('xn-miner-global'), Buffer.from([kind])],
        minerPK
      )
      const [xnByEthPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('xn-by-eth'), Buffer.from(ethBytes), Buffer.from([kind]), minerPK.toBuffer()],
        minerPK
      )
      const [xnBySolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('xn-by-sol'), pk.toBuffer(), Buffer.from([kind]), minerPK.toBuffer()],
        minerPK
      )

      const keys = [
        { pubkey: globalPDA,                  isSigner: false, isWritable: true  },
        { pubkey: xnByEthPDA,                isSigner: false, isWritable: true  },
        { pubkey: xnBySolPDA,                isSigner: false, isWritable: true  },
        { pubkey: pk,                         isSigner: true,  isWritable: true  },
        { pubkey: SystemProgram.programId,    isSigner: false, isWritable: false },
      ]

      const { blockhash } = await conn.getLatestBlockhash()
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: pk })
      tx.add({ programId: minerPK, keys, data })

      setStats(s => ({ ...s, txSubmitted: s.txSubmitted + 1 }))

      const signed = await signTx(tx)
      const sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: false })
      await conn.confirmTransaction(sig, 'confirmed')

      setStats(s => ({
        ...s,
        txConfirmed: s.txConfirmed + 1,
        lastTxSig: sig,
        status: 'mining',
      }))

      // Rotate to next miner
      minerKindRef.current = (minerKindRef.current + 1) % 4
      setStats(s => ({ ...s, minerKind: minerKindRef.current }))

    } catch (e: any) {
      console.error('[useMiner] Tx failed:', e)
      setStats(s => ({
        ...s,
        txFailed: s.txFailed + 1,
        status: 'mining',
        error: e?.message ?? 'Transaction failed',
      }))
    } finally {
      submittingRef.current = false
    }
  }, [])

  // Initialize worker
  useEffect(() => {
    // Skip worker in SSR/build time
    if (typeof window === 'undefined') {
      setStats(s => ({ ...s, status: 'ready' }))
      return
    }
    
    // Use inline worker to avoid bundling issues
    const worker = createInlineMinerWorker()
    
    if (!worker) {
      setStats(s => ({ 
        ...s, 
        status: 'error', 
        error: 'Web Worker not supported in this browser' 
      }))
      return
    }

    worker.onmessage = (e) => {
      const msg = e.data
      switch (msg.type) {
        case 'READY':
          setStats(s => ({
            ...s,
            status: s.status === 'idle' || s.status === 'loading' ? 'ready' : s.status,
          }))
          break

        case 'STATS':
          setStats(s => ({
            ...s,
            slotsScanned: msg.slotsScanned,
            hashRate: msg.hashRate,
            hashesFound: msg.totalHashes,
            superhashesFound: msg.totalSuperhashes,
            status: msg.running ? (s.status === 'submitting' ? 'submitting' : 'mining') : (s.status === 'mining' ? 'ready' : s.status),
          }))
          break

        case 'RESULT':
          if (msg.worthSubmitting && autoSubmitRef.current && !submittingRef.current) {
            submitMineHashesTx()
          }
          break
      }
    }

    worker.onerror = (e: ErrorEvent) => {
      console.error('[useMiner] Worker error:', e)
      setStats(s => ({ ...s, status: 'error', error: e.message || 'Worker error' }))
    }

    workerRef.current = worker
    setStats(s => ({ ...s, status: 'loading' }))

    return () => {
      worker?.terminate()
      workerRef.current = null
    }
  }, [submitMineHashesTx])

  // Poll on-chain state
  const startPolling = useCallback(() => {
    if (pollingRef.current) return

    async function poll() {
      try {
        const conn = connectionRef.current
        const kind = minerKindRef.current
        const minerPK = new PublicKey(MINER_IDS[kind])
        const [globalPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('xn-miner-global'), Buffer.from([kind])],
          minerPK
        )

        const [info, slot] = await Promise.all([
          conn.getAccountInfo(globalPDA),
          conn.getSlot('confirmed'),
        ])

        if (info) {
          const parsed = parseGlobalXnRecord(Buffer.from(info.data))
          setStats(s => ({
            ...s,
            currentSlot: slot,
            currentNonce: parsed.nonce,
            amp: parsed.amp,
          }))

          if (workerRef.current) {
            workerRef.current.postMessage({
              type: 'UPDATE',
              nonce: parsed.nonce,
              slot,
            })
          }
        } else {
          setStats(s => ({ ...s, currentSlot: slot }))
        }
      } catch (e) {
        console.warn('[useMiner] Poll error:', e)
      }
    }

    poll()
    pollingRef.current = setInterval(poll, 5000)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Start mining
  const startMining = useCallback(async () => {
    if (!workerRef.current || !publicKey) return

    autoSubmitRef.current = true
    startPolling()

    try {
      const conn = connectionRef.current
      const kind = minerKindRef.current
      const minerPK = new PublicKey(MINER_IDS[kind])
      const [globalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('xn-miner-global'), Buffer.from([kind])],
        minerPK
      )

      const [info, slot] = await Promise.all([
        conn.getAccountInfo(globalPDA),
        conn.getSlot('confirmed'),
      ])

      let nonce = [0, 0, 0, 0]
      let amp = 0
      if (info) {
        const parsed = parseGlobalXnRecord(Buffer.from(info.data))
        nonce = parsed.nonce
        amp = parsed.amp
      }

      setStats(s => ({
        ...s,
        status: 'mining',
        currentSlot: slot,
        currentNonce: nonce,
        amp,
        error: null,
      }))

      workerRef.current.postMessage({
        type: 'START',
        nonce,
        slot,
        minerKind: kind,
        autoSubmit: true,
      })
    } catch (e: any) {
      setStats(s => ({ ...s, status: 'error', error: e?.message ?? 'Failed to start' }))
    }
  }, [publicKey, startPolling])

  // Stop mining
  const stopMining = useCallback(() => {
    autoSubmitRef.current = false
    stopPolling()
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'STOP' })
    }
    setStats(s => ({ ...s, status: 'ready' }))
  }, [stopPolling])

  // Cleanup
  useEffect(() => {
    return () => { stopPolling() }
  }, [stopPolling])

  return { stats, startMining, stopMining }
}

// Compute Anchor instruction discriminator: sha256("global:<name>")[0..8]
async function computeDiscriminator(name: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(`global:${name}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hash).slice(0, 8)
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}
