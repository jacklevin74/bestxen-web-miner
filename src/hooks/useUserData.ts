import { useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { X1_RPC, PROGRAM_IDS, MINER_IDS } from '../constants'

export interface UserData {
  bestXenBalance:  number   // UI units (9 decimals stripped)
  pointsAccrued:   bigint
  hashes:          number
  superHashes:     number
  loading:         boolean
  error:           string | null
}

const INITIAL: UserData = {
  bestXenBalance: 0, pointsAccrued: 0n,
  hashes: 0, superHashes: 0,
  loading: false, error: null,
}

function parseUserRecord(data: Buffer): { points: bigint; hashes: number; superHashes: number } {
  if (data.length < 32) return { points: 0n, hashes: 0, superHashes: 0 }
  const points      = data.readBigUInt64LE(8)
  const hashes      = Number(data.readBigUInt64LE(16))
  const superHashes = Number(data.readBigUInt64LE(24))
  return { points, hashes, superHashes }
}

export function useUserData(walletPubkey: PublicKey | null) {
  const [data, setData] = useState<UserData>(INITIAL)

  useEffect(() => {
    if (!walletPubkey) {
      setData(INITIAL)
      return
    }
    const conn = new Connection(X1_RPC, 'confirmed')
    let mounted = true

    async function fetchData() {
      if (!walletPubkey) return
      setData(s => ({ ...s, loading: true, error: null }))
      try {
        let totalPoints = 0n, totalHashes = 0, totalSuperHashes = 0

        for (const minerId of MINER_IDS) {
          const minerPK = new PublicKey(minerId)
          const seeds = [
            Buffer.from('sol-xen-miner'),
            walletPubkey.toBuffer(),
          ]
          const [pda] = PublicKey.findProgramAddressSync(seeds, minerPK)
          const info = await conn.getAccountInfo(pda)
          if (info) {
            const parsed = parseUserRecord(Buffer.from(info.data))
            totalPoints      += parsed.points
            totalHashes      += parsed.hashes
            totalSuperHashes += parsed.superHashes
          }
        }

        // Fetch SPL token balance for bestXEN mint (PDA of minter with seed "mint")
        const minterPK = new PublicKey(PROGRAM_IDS.MINTER)
        const [mintPDA] = PublicKey.findProgramAddressSync([Buffer.from('mint')], minterPK)

        let balance = 0
        try {
          const tokenAccounts = await conn.getParsedTokenAccountsByOwner(walletPubkey!, {
            mint: mintPDA,
          })
          if (tokenAccounts.value.length > 0) {
            const uiAmt = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
            balance = uiAmt ?? 0
          }
        } catch { /* mint may not exist yet */ }

        if (!mounted) return
        setData({
          bestXenBalance: balance,
          pointsAccrued:  totalPoints,
          hashes:         totalHashes,
          superHashes:    totalSuperHashes,
          loading:        false,
          error:          null,
        })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (mounted) setData(s => ({ ...s, loading: false, error: msg }))
      }
    }

    fetchData()
    const id = setInterval(fetchData, 30_000)
    return () => { mounted = false; clearInterval(id) }
  }, [walletPubkey?.toBase58()])

  return data
}
