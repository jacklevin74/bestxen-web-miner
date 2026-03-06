import React from 'react'
import { GITHUB_URL, TELEGRAM_URL, XDEX_SWAP_URL, X1_EXPLORER_URL, PROGRAM_IDS } from '../constants'

export default function Footer() {
  return (
    <footer style={wrap}>
      <div style={inner}>
        <div style={grid}>
          <div>
            <div style={logo}>
              <span style={{ color: 'var(--accent)' }}>best</span>XEN
            </div>
            <p style={tagline}>
              Proof of Work mining on X1.<br />
              No pre-mine. No admin keys. Pure PoW.
            </p>
          </div>

          <div>
            <div style={colHead}>Links</div>
            <ul style={list}>
              <li><a href={GITHUB_URL}    target="_blank" rel="noreferrer" style={link}>GitHub ↗</a></li>
              <li><a href={TELEGRAM_URL}  target="_blank" rel="noreferrer" style={link}>Telegram ↗</a></li>
              <li><a href={XDEX_SWAP_URL} target="_blank" rel="noreferrer" style={link}>Buy on xDEX ↗</a></li>
              <li><a href="https://docs.x1.xyz/" target="_blank" rel="noreferrer" style={link}>X1 Docs ↗</a></li>
            </ul>
          </div>

          <div>
            <div style={colHead}>Program IDs (X1 Mainnet)</div>
            <ul style={list}>
              {[
                { label: 'Minter',  id: PROGRAM_IDS.MINTER  },
                { label: 'Miner 0', id: PROGRAM_IDS.MINER_0 },
                { label: 'Miner 1', id: PROGRAM_IDS.MINER_1 },
                { label: 'Miner 2', id: PROGRAM_IDS.MINER_2 },
                { label: 'Miner 3', id: PROGRAM_IDS.MINER_3 },
              ].map(({ label, id }) => (
                <li key={id} style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.75rem', display: 'block' }}>{label}</span>
                  <a
                    href={`${X1_EXPLORER_URL}/account/${id}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent)', wordBreak: 'break-all' }}
                  >
                    {id}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={bottom}>
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
            © 2025 bestXEN — Built on X1 Blockchain. Fair launch, open source.
          </span>
        </div>
      </div>
    </footer>
  )
}

const wrap: React.CSSProperties = { background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '60px 24px 32px' }
const inner: React.CSSProperties = { maxWidth: 1100, margin: '0 auto' }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 40 }
const logo: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 900, marginBottom: 12 }
const tagline: React.CSSProperties = { color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }
const colHead: React.CSSProperties = { color: 'var(--text)', fontWeight: 700, marginBottom: 14, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }
const list: React.CSSProperties = { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }
const link: React.CSSProperties = { color: 'var(--muted)', fontSize: '0.9rem', textDecoration: 'none' }
const bottom: React.CSSProperties = { borderTop: '1px solid var(--border)', paddingTop: 24, textAlign: 'center' }
