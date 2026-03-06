import { useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { X1_RPC, PROGRAM_IDS } from '../constants'

export interface ChainStats {
  totalHashes:      number
  totalSuperHashes: number
  totalBestXen:     bigint   // raw lamports (9 decimals)
  amp:              number
  blockHeight:      number
  loading:          boolean
  error:            string | null
}

const INITIAL: ChainStats = {
  totalHashes: 0, totalSuperHashes: 0, totalBestXen: 0n,
  amp: 0, blockHeight: 0, loading: true, error: null,
}

// xn-global-counter seed bytes = [120,110,45,103,108,111,98,97,108,45,99,111,117,110,116,101,114]
const GLOBAL_SEED = Buffer.from('xn-global-counter')

function parseGlobalRecord(data: Buffer): { hashes: number; superHashes: number; solXen: bigint; amp: number } {
  // Anchor account discriminator is 8 bytes
  // Layout (from IDL inspection of solXEN):
  //   [8]  discriminator
  //   [8]  points       (u64)
  //   [8]  hashes       (u64 — stored as number)
  //   [8]  super_hashes (u64)
  //   [8]  txs          (u64)
  //   [2]  amp          (u16)
  //   ...rest
  if (data.length < 42) return { hashes: 0, superHashes: 0, solXen: 0n, amp: 0 }
  const points      = data.readBigUInt64LE(8)
  const hashes      = Number(data.readBigUInt64LE(16))
  const superHashes = Number(data.readBigUInt64LE(24))
  const amp         = data.readUInt16LE(40)
  return { hashes, superHashes, solXen: points, amp }
}

export function useChainStats() {
  const [stats, setStats] = useState<ChainStats>(INITIAL)

  useEffect(() => {
    const conn = new Connection(X1_RPC, 'confirmed')
    let mounted = true

    async function fetch() {
      try {
        const minterPubkey = new PublicKey(PROGRAM_IDS.MINTER)
        const [globalPDA] = PublicKey.findProgramAddressSync([GLOBAL_SEED], minterPubkey)

        const [acctInfo, slot] = await Promise.all([
          conn.getAccountInfo(globalPDA),
          conn.getSlot('confirmed'),
        ])

        if (!mounted) return
        if (!acctInfo) {
          setStats(s => ({ ...s, loading: false, blockHeight: slot }))
          return
        }

        const parsed = parseGlobalRecord(Buffer.from(acctInfo.data))
        setStats({
          totalHashes:      parsed.hashes,
          totalSuperHashes: parsed.superHashes,
          totalBestXen:     parsed.solXen,
          amp:              parsed.amp,
          blockHeight:      slot,
          loading:          false,
          error:            null,
        })
      } catch (e: any) {
        if (mounted) setStats(s => ({ ...s, loading: false, error: e.message }))
      }
    }

    fetch()
    const id = setInterval(fetch, 15_000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  return stats
}
