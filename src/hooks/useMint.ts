import { useState } from 'react'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { X1_RPC, PROGRAM_IDS } from '../constants'

export type MintStatus = 'idle' | 'preparing' | 'signing' | 'confirming' | 'success' | 'error'

export interface MintResult {
  status:     MintStatus
  txSig:      string | null
  error:      string | null
  mint:       (wallet: any, publicKey: PublicKey) => Promise<void>
  reset:      () => void
}

const MINTER_PK = new PublicKey(PROGRAM_IDS.MINTER)
const GLOBAL_SEED = Buffer.from('xn-global-counter')
const MINT_SEED   = Buffer.from('mint')

export function useMint(): MintResult {
  const [status, setStatus]   = useState<MintStatus>('idle')
  const [txSig,  setTxSig]    = useState<string | null>(null)
  const [error,  setError]    = useState<string | null>(null)

  function reset() { setStatus('idle'); setTxSig(null); setError(null) }

  async function mint(wallet: any, publicKey: PublicKey) {
    setStatus('preparing'); setTxSig(null); setError(null)
    try {
      const conn = new Connection(X1_RPC, 'confirmed')

      // Derive PDAs
      const [globalPDA]   = PublicKey.findProgramAddressSync([GLOBAL_SEED], MINTER_PK)
      const [mintPDA]     = PublicKey.findProgramAddressSync([MINT_SEED],   MINTER_PK)

      // mint_tokens discriminator from IDL: [59, 132, 24, 246, 122, 39, 8, 243]
      const discriminator = Buffer.from([59, 132, 24, 246, 122, 39, 8, 243])

      // Build ATA address for user
      const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      const ATA_PROGRAM   = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bEg')

      const [ataAddress] = PublicKey.findProgramAddressSync(
        [publicKey.toBuffer(), TOKEN_PROGRAM.toBuffer(), mintPDA.toBuffer()],
        ATA_PROGRAM
      )

      // Build instruction data: discriminator only (no args for mint_tokens)
      const data = discriminator

      // Build transaction
      const { blockhash } = await conn.getLatestBlockhash()
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey })

      // mint_tokens accounts (from IDL):
      // user_token_account, global_xn_record (PDA), user_record (PDA), mint_account (PDA),
      // token_program, system_program, associated_token_program
      const keys = [
        { pubkey: ataAddress,            isSigner: false, isWritable: true  },
        { pubkey: globalPDA,             isSigner: false, isWritable: true  },
        { pubkey: publicKey,             isSigner: true,  isWritable: true  },
        { pubkey: mintPDA,               isSigner: false, isWritable: true  },
        { pubkey: TOKEN_PROGRAM,         isSigner: false, isWritable: false },
        { pubkey: ATA_PROGRAM,           isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]

      tx.add({
        programId: MINTER_PK,
        keys,
        data,
      })

      setStatus('signing')
      const signed = await wallet.signTransaction(tx)

      setStatus('confirming')
      const sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: false })
      await conn.confirmTransaction(sig, 'confirmed')

      setStatus('success')
      setTxSig(sig)
    } catch (e: any) {
      setStatus('error')
      setError(e?.message ?? 'Transaction failed')
    }
  }

  return { status, txSig, error, mint, reset }
}
