import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useUserData } from '../hooks/useUserData'
import { X1_EXPLORER_URL } from '../constants'

function fmtBig(n: bigint) {
  const ui = Number(n) / 1e9
  return ui.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

export default function Dashboard() {
  const { publicKey, connected } = useWallet()
  const userData = useUserData(publicKey)

  return (
    <section id="dashboard" style={wrap}>
      <div style={inner}>
        <h2 style={heading}>My Dashboard</h2>

        {!connected ? (
          <div style={connectBox}>
            <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: '1.05rem' }}>
              Connect your wallet to see your mining stats and bestXEN balance.
            </p>
            <WalletMultiButton />
          </div>
        ) : (
          <>
            <div style={addrRow}>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Connected:</span>
              <a
                href={`${X1_EXPLORER_URL}/account/${publicKey?.toBase58()}`}
                target="_blank" rel="noreferrer"
                style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--accent)' }}
              >
                {publicKey?.toBase58().slice(0, 8)}…{publicKey?.toBase58().slice(-8)}
              </a>
              {userData.loading && <Spinner />}
            </div>

            {userData.error && (
              <div style={errBox}>{userData.error}</div>
            )}

            <div style={grid}>
              <StatCard
                label="bestXEN Balance"
                value={userData.bestXenBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                color="var(--green)"
                icon="🪙"
              />
              <StatCard
                label="Mining Points"
                value={fmtBig(userData.pointsAccrued)}
                color="var(--accent)"
                icon="⚡"
              />
              <StatCard
                label="Hashes Found"
                value={userData.hashes.toLocaleString()}
                color="var(--accent2)"
                icon="⛏"
              />
              <StatCard
                label="Super Hashes"
                value={userData.superHashes.toLocaleString()}
                color="var(--yellow)"
                icon="🌟"
              />
            </div>

            <div style={tipBox}>
              <strong>Tip:</strong> Points accumulate as you mine. When you're ready to claim, head to the{' '}
              <a href="#mint">Mint section</a> to convert points into bestXEN tokens on-chain.
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div style={statCard}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 16, height: 16, border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', marginLeft: 8,
    }} />
  )
}

const wrap: React.CSSProperties = {
  padding: '80px 24px', background: 'var(--bg)',
}
const inner: React.CSSProperties = {
  maxWidth: 900, margin: '0 auto',
}
const heading: React.CSSProperties = {
  fontSize: '2rem', fontWeight: 800, marginBottom: 32,
  borderBottom: '1px solid var(--border)', paddingBottom: 16,
}
const connectBox: React.CSSProperties = {
  textAlign: 'center', padding: '60px 40px',
  background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
}
const addrRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
  flexWrap: 'wrap',
}
const grid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20,
  marginBottom: 28,
}
const statCard: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
  padding: '28px 20px', textAlign: 'center',
}
const errBox: React.CSSProperties = {
  background: 'rgba(248,81,73,0.1)', border: '1px solid var(--red)',
  borderRadius: 10, padding: '12px 16px', color: 'var(--red)',
  fontSize: '0.85rem', marginBottom: 20,
}
const tipBox: React.CSSProperties = {
  background: 'rgba(0,195,255,0.07)', border: '1px solid rgba(0,195,255,0.2)',
  borderRadius: 10, padding: '14px 18px', fontSize: '0.9rem', color: 'var(--muted)',
}
