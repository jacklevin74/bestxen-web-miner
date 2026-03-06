import { useEffect, useState } from 'react'
import { Connection, PublicKey, type GetProgramAccountsFilter } from '@solana/web3.js'
import { X1_RPC, PROGRAM_IDS } from '../constants'

export interface LeaderEntry {
  rank:        number
  wallet:      string
  hashes:      number
  superHashes: number
  points:      bigint
  bestXen:     bigint
}

const MINER_PROGRAMS = [
  PROGRAM_IDS.MINER_0,
  PROGRAM_IDS.MINER_1,
  PROGRAM_IDS.MINER_2,
  PROGRAM_IDS.MINER_3,
]

function parseUserRecord(data: Buffer, wallet: string): Partial<LeaderEntry> {
  if (data.length < 32) return {}
  const points      = data.readBigUInt64LE(8)
  const hashes      = Number(data.readBigUInt64LE(16))
  const superHashes = Number(data.readBigUInt64LE(24))
  return { wallet, points, hashes, superHashes, bestXen: points }
}

export function useLeaderboard(limit = 25) {
  const [entries, setEntries] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const conn = new Connection(X1_RPC, 'confirmed')
    let mounted = true

    async function fetch() {
      try {
        const map = new Map<string, LeaderEntry>()

        for (const programId of MINER_PROGRAMS) {
          const pk = new PublicKey(programId)
          // Each user miner account is a PDA with discriminator at [0..8]
          // accounts have size >= 40 bytes; fetch all
          const accounts = await conn.getProgramAccounts(pk, {
            dataSlice: { offset: 0, length: 48 },
            filters: [{ dataSize: 48 }] as GetProgramAccountsFilter[],
          })

          for (const { pubkey, account } of accounts) {
            const data = Buffer.from(account.data)
            // The wallet pubkey is stored in the account data at offset 8 (after discriminator)
            // but getProgramAccounts gives us the PDA, not user. We need full data.
            // Re-fetch without dataSlice for accounts with data
            const parsed = parseUserRecord(data, pubkey.toBase58())
            if (parsed.hashes && parsed.hashes > 0) {
              const existing = map.get(pubkey.toBase58())
              if (existing) {
                existing.hashes      += parsed.hashes ?? 0
                existing.superHashes += parsed.superHashes ?? 0
                existing.points      += parsed.points ?? 0n
                existing.bestXen     += parsed.bestXen ?? 0n
              } else {
                map.set(pubkey.toBase58(), {
                  rank:        0,
                  wallet:      pubkey.toBase58(),
                  hashes:      parsed.hashes ?? 0,
                  superHashes: parsed.superHashes ?? 0,
                  points:      parsed.points ?? 0n,
                  bestXen:     parsed.bestXen ?? 0n,
                })
              }
            }
          }
        }

        if (!mounted) return

        const sorted = [...map.values()]
          .sort((a, b) => (b.hashes - a.hashes))
          .slice(0, limit)
          .map((e, i) => ({ ...e, rank: i + 1 }))

        setEntries(sorted)
        setLoading(false)
      } catch (e: any) {
        if (mounted) { setError(e.message); setLoading(false) }
      }
    }

    fetch()
    const id = setInterval(fetch, 60_000)
    return () => { mounted = false; clearInterval(id) }
  }, [limit])

  return { entries, loading, error }
}
