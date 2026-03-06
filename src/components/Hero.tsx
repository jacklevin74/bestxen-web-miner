import React from 'react'
import { XDEX_SWAP_URL, TELEGRAM_URL, PROGRAM_IDS } from '../constants'

export default function Hero() {
  return (
    <section id="home" style={wrap}>
      {/* Glow orbs */}
      <div style={{ ...orb, left: '15%', top: '30%', background: 'var(--accent)' }} />
      <div style={{ ...orb, right: '10%', bottom: '20%', background: 'var(--accent2)' }} />

      <div style={content}>
        <div style={badge}>⛏ PROOF OF WORK · X1 BLOCKCHAIN</div>
        <h1 style={title}>
          <span style={{ color: 'var(--accent)' }}>best</span>XEN
        </h1>
        <p style={sub}>
          A fairly distributed 1st-principles community token earned through CPU mining.<br />
          No pre-mine. No admin keys. Pure PoW.
        </p>

        <div style={btnRow}>
          <a href="#mint"       style={btnPrimary}>Claim Tokens →</a>
          <a href="#leaderboard" style={btnSecondary}>Leaderboard</a>
          <a href={XDEX_SWAP_URL} target="_blank" rel="noreferrer" style={btnGhost}>Buy on xDEX ↗</a>
          <a href={TELEGRAM_URL}  target="_blank" rel="noreferrer" style={btnGhost}>Telegram ↗</a>
        </div>

        {/* Contract address pills */}
        <div style={pills}>
          <div style={pillWrap}>
            <span style={pillLabel}>Minter Program</span>
            <code style={pillCode}>{PROGRAM_IDS.MINTER}</code>
          </div>
          <div style={pillWrap}>
            <span style={pillLabel}>Miner 0</span>
            <code style={pillCode}>{PROGRAM_IDS.MINER_0}</code>
          </div>
        </div>
      </div>
    </section>
  )
}

const wrap: React.CSSProperties = {
  position: 'relative', overflow: 'hidden',
  background: 'linear-gradient(180deg, #0a0c10 0%, #0d1420 100%)',
  padding: '100px 24px 80px',
  textAlign: 'center',
}
const orb: React.CSSProperties = {
  position: 'absolute', width: 400, height: 400, borderRadius: '50%',
  opacity: 0.07, filter: 'blur(80px)', pointerEvents: 'none',
}
const content: React.CSSProperties = {
  position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto',
}
const badge: React.CSSProperties = {
  display: 'inline-block', background: 'rgba(0,195,255,0.1)',
  border: '1px solid rgba(0,195,255,0.25)', borderRadius: 20,
  padding: '4px 16px', fontSize: '0.78rem', letterSpacing: '0.06em',
  color: 'var(--accent)', marginBottom: 24,
}
const title: React.CSSProperties = {
  fontSize: 'clamp(3rem, 9vw, 6rem)', fontWeight: 900,
  letterSpacing: '-2px', lineHeight: 1, marginBottom: 24,
}
const sub: React.CSSProperties = {
  fontSize: '1.15rem', color: 'var(--muted)', lineHeight: 1.7,
  maxWidth: 560, margin: '0 auto 36px',
}
const btnRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 48,
}
const btnPrimary: React.CSSProperties = {
  background: 'var(--accent)', color: '#000', fontWeight: 700,
  padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
}
const btnSecondary: React.CSSProperties = {
  background: 'var(--accent2)', color: '#fff', fontWeight: 700,
  padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
}
const btnGhost: React.CSSProperties = {
  background: 'var(--bg3)', color: 'var(--text)', fontWeight: 600,
  padding: '12px 24px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
  border: '1px solid var(--border)',
}
const pills: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
}
const pillWrap: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, justifyContent: 'center',
}
const pillLabel: React.CSSProperties = {
  fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
}
const pillCode: React.CSSProperties = {
  fontSize: '0.75rem', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
