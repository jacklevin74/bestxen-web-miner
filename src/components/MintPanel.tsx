import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useMint } from '../hooks/useMint'
import { useUserData } from '../hooks/useUserData'
import { X1_EXPLORER_URL, PROGRAM_IDS } from '../constants'

export default function MintPanel() {
  const { publicKey, connected, signTransaction } = useWallet()
  const userData = useUserData(publicKey)
  const { status, txSig, error, mint, reset } = useMint()

  async function handleMint() {
    if (!publicKey || !signTransaction) return
    // Pass a wallet-like object that has signTransaction
    await mint({ signTransaction }, publicKey)
  }

  const isPending = status === 'preparing' || status === 'signing' || status === 'confirming'

  return (
    <section id="mint" style={wrap}>
      <div style={inner}>
        <h2 style={heading}>Mint bestXEN</h2>
        <p style={desc}>
          Convert your accumulated mining points into bestXEN tokens on-chain.
          The minter program reads your hashes from all 4 miner programs and
          issues tokens directly to your wallet.
        </p>

        {/* Program info */}
        <div style={infoBox}>
          <div style={infoRow}>
            <span style={infoKey}>Minter Program</span>
            <a
              href={`${X1_EXPLORER_URL}/account/${PROGRAM_IDS.MINTER}`}
              target="_blank" rel="noreferrer"
              style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--accent)', wordBreak: 'break-all' }}
            >
              {PROGRAM_IDS.MINTER}
            </a>
          </div>
        </div>

        {!connected ? (
          <div style={centerBox}>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Connect your wallet to mint bestXEN.</p>
            <WalletMultiButton />
          </div>
        ) : (
          <div style={mintCard}>
            {/* Points summary */}
            <div style={summaryGrid}>
              <SummaryItem label="Mining Points" value={Number(userData.pointsAccrued) > 0 ? (Number(userData.pointsAccrued) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'} />
              <SummaryItem label="Hashes" value={userData.hashes.toLocaleString()} />
              <SummaryItem label="Super Hashes" value={userData.superHashes.toLocaleString()} />
              <SummaryItem label="Current Balance" value={`${userData.bestXenBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} bXEN`} color="var(--green)" />
            </div>

            {/* Status feedback */}
            {status === 'success' && txSig && (
              <div style={successBox}>
                ✅ Mint successful!{' '}
                <a
                  href={`${X1_EXPLORER_URL}/tx/${txSig}`}
                  target="_blank" rel="noreferrer"
                  style={{ color: 'var(--green)' }}
                >
                  View on Explorer ↗
                </a>
                <button onClick={reset} style={resetBtn}>Dismiss</button>
              </div>
            )}
            {status === 'error' && error && (
              <div style={errorBox}>
                ❌ {error}
                <button onClick={reset} style={resetBtn}>Dismiss</button>
              </div>
            )}

            {/* Status label */}
            {isPending && (
              <div style={pendingBox}>
                <Spinner />
                {status === 'preparing'  && 'Building transaction…'}
                {status === 'signing'    && 'Waiting for wallet signature…'}
                {status === 'confirming' && 'Confirming on-chain…'}
              </div>
            )}

            {/* Mint button */}
            {status !== 'success' && (
              <button
                onClick={handleMint}
                disabled={isPending || userData.loading || userData.pointsAccrued === 0n}
                style={mintBtn(isPending || userData.loading || userData.pointsAccrued === 0n)}
              >
                {isPending ? 'Processing…' : '⛏ Mint bestXEN'}
              </button>
            )}

            {userData.pointsAccrued === 0n && !userData.loading && (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 12, textAlign: 'center' }}>
                No mining points found. Start mining with the CLI first (see "How to Mine" below).
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function SummaryItem({ label, value, color = 'var(--text)' }: { label: string; value: string; color?: string }) {
  return (
    <div style={sumItem}>
      <div style={{ fontWeight: 700, color, fontSize: '1.1rem' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 16, height: 16, border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', marginRight: 10, flexShrink: 0,
    }} />
  )
}

const mintBtn = (disabled: boolean): React.CSSProperties => ({
  display: 'block', width: '100%', padding: '16px',
  background: disabled ? 'var(--bg3)' : 'var(--accent)',
  color: disabled ? 'var(--muted)' : '#000',
  fontWeight: 800, fontSize: '1.05rem', border: 'none',
  borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: 24, transition: 'background .2s',
})

const wrap: React.CSSProperties = { padding: '80px 24px', background: 'var(--bg2)' }
const inner: React.CSSProperties = { maxWidth: 700, margin: '0 auto' }
const heading: React.CSSProperties = { fontSize: '2rem', fontWeight: 800, marginBottom: 16 }
const desc: React.CSSProperties = { color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 28 }
const infoBox: React.CSSProperties = {
  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10,
  padding: '14px 18px', marginBottom: 28,
}
const infoRow: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }
const infoKey: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }
const mintCard: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px',
}
const summaryGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: 16, marginBottom: 8,
}
const sumItem: React.CSSProperties = {
  background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px', textAlign: 'center',
  border: '1px solid var(--border)',
}
const centerBox: React.CSSProperties = { textAlign: 'center', padding: '40px 20px' }
const successBox: React.CSSProperties = {
  background: 'rgba(63,185,80,0.1)', border: '1px solid var(--green)',
  borderRadius: 10, padding: '12px 16px', marginTop: 16, color: 'var(--green)',
  fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
}
const errorBox: React.CSSProperties = {
  background: 'rgba(248,81,73,0.1)', border: '1px solid var(--red)',
  borderRadius: 10, padding: '12px 16px', marginTop: 16, color: 'var(--red)',
  fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
}
const pendingBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', color: 'var(--accent)',
  fontSize: '0.9rem', marginTop: 16,
}
const resetBtn: React.CSSProperties = {
  marginLeft: 'auto', background: 'none', border: '1px solid currentColor',
  borderRadius: 6, padding: '3px 10px', cursor: 'pointer', color: 'inherit', fontSize: '0.8rem',
}
