import React from 'react'
import { type ChainStats } from '../hooks/useChainStats'

function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

function fmtToken(raw: bigint) {
  const n = Number(raw) / 1e9
  return fmt(Math.round(n))
}

interface Props { stats: ChainStats }

export default function StatsBar({ stats }: Props) {
  const items = [
    { label: 'Total Hashes',      value: fmt(stats.totalHashes),           color: 'var(--accent)' },
    { label: 'Super Hashes',      value: fmt(stats.totalSuperHashes),      color: 'var(--accent2)' },
    { label: 'bestXEN Minted',    value: fmtToken(stats.totalBestXen),     color: 'var(--green)' },
    { label: 'AMP',               value: stats.amp > 0 ? String(stats.amp) : '—', color: 'var(--yellow)' },
    { label: 'Block Height',      value: fmt(stats.blockHeight),           color: 'var(--muted)' },
  ]

  return (
    <div style={wrap}>
      <div style={inner}>
        {items.map(it => (
          <div key={it.label} style={card}>
            <div style={{ ...val, color: it.color }}>
              {stats.loading ? <Skeleton /> : it.value}
            </div>
            <div style={lbl}>{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Skeleton() {
  return <span style={{ display:'inline-block', width:60, height:20, background:'var(--bg3)', borderRadius:4, animation:'pulse 1.5s infinite' }} />
}

const wrap: React.CSSProperties = {
  background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
  padding: '20px 24px',
}
const inner: React.CSSProperties = {
  maxWidth: 1200, margin: '0 auto',
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16,
}
const card: React.CSSProperties = {
  textAlign: 'center', padding: '12px 8px',
  background: 'var(--card)', borderRadius: 10, border: '1px solid var(--border)',
}
const val: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 }
const lbl: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }
