import React from 'react'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { X1_EXPLORER_URL } from '../constants'

export default function Leaderboard() {
  const { entries, loading, error } = useLeaderboard(50)

  return (
    <section id="leaderboard" style={wrap}>
      <div style={inner}>
        <h2 style={heading}>Top Miners</h2>
        <p style={desc}>Live leaderboard — top 50 wallets by hashes found, updated every minute.</p>

        {error && (
          <div style={errBox}>
            ⚠️ Could not load leaderboard: {error}
            <br /><small>On-chain fetch may fail if RPC rate limits are hit. Data refreshes automatically.</small>
          </div>
        )}

        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <Th style={{ width: 50 }}>#</Th>
                <Th>Wallet</Th>
                <Th align="right">Hashes</Th>
                <Th align="right">Super Hashes</Th>
                <Th align="right">Points</Th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j} style={td}>
                      <div style={skeleton} />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && entries.length === 0 && !error && (
                <tr>
                  <td colSpan={5} style={{ ...td, textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                    No mining data found yet. Be the first to mine! ⛏
                  </td>
                </tr>
              )}
              {entries.map((e, i) => (
                <tr key={e.wallet} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ ...td, color: rankColor(e.rank), fontWeight: 700, textAlign: 'center' }}>
                    {e.rank <= 3 ? ['🥇','🥈','🥉'][e.rank - 1] : e.rank}
                  </td>
                  <td style={td}>
                    <a
                      href={`${X1_EXPLORER_URL}/account/${e.wallet}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--accent)' }}
                    >
                      {e.wallet.slice(0, 6)}…{e.wallet.slice(-6)}
                    </a>
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--text)' }}>
                    {e.hashes.toLocaleString()}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--yellow)' }}>
                    {e.superHashes.toLocaleString()}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--accent2)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {(Number(e.points) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 12, textAlign: 'center' }}>
          Data fetched directly from X1 on-chain program accounts. Refreshes every 60s.
        </p>
      </div>
    </section>
  )
}

function Th({ children, align = 'left', style = {} }: { children: React.ReactNode; align?: string; style?: React.CSSProperties }) {
  return (
    <th style={{ ...th, textAlign: align as any, ...style }}>{children}</th>
  )
}

function rankColor(rank: number) {
  if (rank === 1) return '#ffd700'
  if (rank === 2) return '#c0c0c0'
  if (rank === 3) return '#cd7f32'
  return 'var(--muted)'
}

const wrap: React.CSSProperties = { padding: '80px 24px', background: 'var(--bg)' }
const inner: React.CSSProperties = { maxWidth: 1000, margin: '0 auto' }
const heading: React.CSSProperties = { fontSize: '2rem', fontWeight: 800, marginBottom: 12 }
const desc: React.CSSProperties = { color: 'var(--muted)', marginBottom: 28 }
const tableWrap: React.CSSProperties = {
  overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border)',
}
const table: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', background: 'var(--card)',
}
const th: React.CSSProperties = {
  padding: '12px 16px', fontSize: '0.75rem', color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid var(--border)', background: 'var(--bg3)',
}
const td: React.CSSProperties = {
  padding: '11px 16px', borderBottom: '1px solid rgba(33,38,45,0.6)', fontSize: '0.9rem',
}
const skeleton: React.CSSProperties = {
  height: 16, background: 'var(--bg3)', borderRadius: 4,
  animation: 'pulse 1.5s ease-in-out infinite',
}
const errBox: React.CSSProperties = {
  background: 'rgba(210,153,34,0.1)', border: '1px solid var(--yellow)',
  borderRadius: 10, padding: '14px 18px', color: 'var(--yellow)',
  marginBottom: 20, fontSize: '0.9rem',
}
