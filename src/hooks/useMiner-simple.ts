import { useState, useEffect, useRef, useCallback } from 'react'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { keccak256 } from 'js-sha3'
import { X1_RPC, MINER_IDS } from '../constants'

const DUMMY_ETH_ADDR = '0x0000000000000000000000000000000000000000'
const DUMMY_ETH_BYTES = new Uint8Array(20)
const MAX_HASHES = 72
const HASH_PATTERN = '420'
const SUPERHASH_PATTERN = '42069'

export type MinerStatus = 'idle' | 'loading' | 'ready' | 'mining' | 'submitting' | 'paused' | 'error'

export interface MinerStats {
  status: MinerStatus
  slotsScanned: number
  hashRate: number
  hashesFound: number
  superhashesFound: number
  txSubmitted: number
  txConfirmed: number
  txFailed: number
  currentSlot: number
  currentNonce: number[]
  amp: number
  error: string | null
  lastTxSig: string | null
  minerKind: number
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

function findHashes(nonce: Uint8Array, slot: number): [number, number] {
  let hashes = 0
  let superhashes = 0

  const slotBytes = new Uint8Array(8)
  const dv = new DataView(slotBytes.buffer)
  dv.setUint32(0, slot >>> 0, true)
  dv.setUint32(4, Math.floor(slot / 0x100000000) >>> 0, true)

  const input = new Uint8Array(13)
  input.set(nonce, 0)
  input.set(slotBytes, 4)

  for (let i = 0; i < MAX_HASHES; i++) {
    input[12] = i
    const hash = keccak256(input)
    
    if (hash.includes(SUPERHASH_PATTERN)) {
      superhashes++
    } else if (hash.includes(HASH_PATTERN)) {
      hashes++
    }
  }

  return [hashes, superhashes]
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useMiner(
  publicKey: PublicKey | null,
  signTransaction: ((tx: Transaction) => Promise<Transaction>) | undefined,
  ethAddress?: string,
) {
  const [stats, setStats] = useState<MinerStats>(INITIAL_STATS)
  const connectionRef = useRef<Connection>(new Connection(X1_RPC, 'confirmed'))
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const minerKindRef = useRef(0)
  const autoSubmitRef = useRef(false)
  const submittingRef = useRef(false)
  const runningRef = useRef(false)
  const currentNonceRef = useRef([0, 0, 0, 0])
  const currentSlotRef = useRef(0)
  const slotsScannedRef = useRef(0)
  const totalHashesFoundRef = useRef(0)
  const totalSuperhashesFoundRef = useRef(0)
  const startTimeRef = useRef(0)
  
  const publicKeyRef = useRef(publicKey)
  const signTransactionRef = useRef(signTransaction)
  const ethAddressRef = useRef(ethAddress)
  
  useEffect(() => { publicKeyRef.current = publicKey }, [publicKey])
  useEffect(() => { signTransactionRef.current = signTransaction }, [signTransaction])
  useEffect(() => { ethAddressRef.current = ethAddress }, [ethAddress])

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

      const disc = await computeDiscriminator('mine_hashes')

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

      const data = Buffer.concat([
        Buffer.from(disc),
        Buffer.from(ethAccountData),
        Buffer.from(kindByte),
      ])

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
        { pubkey: globalPDA, isSigner: false, isWritable: true },
        { pubkey: xnByEthPDA, isSigner: false, isWritable: true },
        { pubkey: xnBySolPDA, isSigner: false, isWritable: true },
        { pubkey: pk, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
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

  const mineLoop = useCallback(async () => {
    runningRef.current = true
    startTimeRef.current = Date.now()
    
    while (runningRef.current) {
      const nonce = new Uint8Array(currentNonceRef.current)
      const slot = currentSlotRef.current

      if (slot === 0) {
        await sleep(100)
        continue
      }

      const [hashes, superhashes] = findHashes(nonce, slot)
      slotsScannedRef.current++

      if (hashes > 0 || superhashes > 0) {
        totalHashesFoundRef.current += hashes
        totalSuperhashesFoundRef.current += superhashes

        if (autoSubmitRef.current && !submittingRef.current) {
          submitMineHashesTx()
        }
      }

      if (slotsScannedRef.current % 5 === 0) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        const hashRate = elapsed > 0 ? Math.round((slotsScannedRef.current * MAX_HASHES) / elapsed) : 0
        
        setStats(s => ({
          ...s,
          slotsScanned: slotsScannedRef.current,
          hashRate,
          hashesFound: totalHashesFoundRef.current,
          superhashesFound: totalSuperhashesFoundRef.current,
        }))
      }

      await sleep(0)
    }

    setStats(s => ({ ...s, status: 'ready' }))
  }, [submitMineHashesTx])

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
          currentNonceRef.current = parsed.nonce
          currentSlotRef.current = slot
          
          setStats(s => ({
            ...s,
            currentSlot: slot,
            currentNonce: parsed.nonce,
            amp: parsed.amp,
          }))
        } else {
          currentSlotRef.current = slot
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

  const startMining = useCallback(async () => {
    if (!publicKey) return

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

      currentNonceRef.current = nonce
      currentSlotRef.current = slot
      slotsScannedRef.current = 0
      totalHashesFoundRef.current = 0
      totalSuperhashesFoundRef.current = 0

      setStats(s => ({
        ...s,
        status: 'mining',
        currentSlot: slot,
        currentNonce: nonce,
        amp,
        error: null,
      }))

      mineLoop()
    } catch (e: any) {
      setStats(s => ({ ...s, status: 'error', error: e?.message ?? 'Failed to start' }))
    }
  }, [publicKey, startPolling, mineLoop])

  const stopMining = useCallback(() => {
    autoSubmitRef.current = false
    runningRef.current = false
    stopPolling()
  }, [stopPolling])

  useEffect(() => {
    setStats(s => ({ ...s, status: 'ready' }))
    return () => { stopPolling() }
  }, [stopPolling])

  return { stats, startMining, stopMining }
}

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

function parseGlobalXnRecord(data: Buffer): { amp: number; nonce: number[]; slot: number } {
  if (data.length < 23) return { amp: 0, nonce: [0, 0, 0, 0], slot: 0 }
  const amp = data.readUInt16LE(8)
  const lastAmpSlot = Number(data.readBigUInt64LE(10))
  const nonce = [data[18], data[19], data[20], data[21]]
  return { amp, nonce, slot: lastAmpSlot }
}
