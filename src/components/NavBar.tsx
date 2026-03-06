import React, { useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { FiMenu, FiX, FiGithub } from 'react-icons/fi'
import { GITHUB_URL, XDEX_SWAP_URL, DOCS_URL } from '../constants'

const links = [
  { label: 'Home',        href: '#home' },
  { label: 'Dashboard',   href: '#dashboard' },
  { label: 'Web Mining',  href: '#webminer' },
  { label: 'Mint',        href: '#mint' },
  { label: 'Leaderboard', href: '#leaderboard' },
  { label: 'How to Mine', href: '#howto' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <nav style={nav}>
      <div style={inner}>
        {/* Logo */}
        <a href="#home" style={logo}>
          <span style={{ color: 'var(--accent)', fontWeight: 900 }}>best</span>
          <span style={{ fontWeight: 700 }}>XEN</span>
        </a>

        {/* Desktop links */}
        <div style={deskLinks}>
          {links.map(l => (
            <a key={l.href} href={l.href} style={navLink}>{l.label}</a>
          ))}
          <a href={XDEX_SWAP_URL} target="_blank" rel="noreferrer" style={{ ...navLink, color: 'var(--green)' }}>Buy ↗</a>
          <a href={DOCS_URL}      target="_blank" rel="noreferrer" style={navLink}>Docs ↗</a>
          <a href={GITHUB_URL}    target="_blank" rel="noreferrer" style={{ ...navLink, display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiGithub /> GitHub
          </a>
        </div>

        {/* Wallet + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <WalletMultiButton />
          <button onClick={() => setOpen(!open)} style={hamburger} aria-label="menu">
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={mobileMenu}>
          {links.map(l => (
            <a key={l.href} href={l.href} style={mobileLink} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <a href={XDEX_SWAP_URL} target="_blank" rel="noreferrer" style={{ ...mobileLink, color: 'var(--green)' }} onClick={() => setOpen(false)}>Buy on xDEX ↗</a>
          <a href={DOCS_URL}      target="_blank" rel="noreferrer" style={mobileLink} onClick={() => setOpen(false)}>Docs ↗</a>
          <a href={GITHUB_URL}    target="_blank" rel="noreferrer" style={mobileLink} onClick={() => setOpen(false)}>GitHub ↗</a>
        </div>
      )}
    </nav>
  )
}

const nav: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 100,
  background: 'rgba(10,12,16,0.92)',
  backdropFilter: 'blur(12px)',
  borderBottom: '1px solid var(--border)',
}
const inner: React.CSSProperties = {
  maxWidth: 1200, margin: '0 auto', padding: '0 24px',
  height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
}
const logo: React.CSSProperties = {
  fontSize: '1.35rem', letterSpacing: '-0.5px', color: 'var(--text)', textDecoration: 'none',
}
const deskLinks: React.CSSProperties = {
  display: 'flex', gap: 24, alignItems: 'center',
  // responsive handled via JS open/close
}
const navLink: React.CSSProperties = {
  color: 'var(--muted)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color .2s',
}
const hamburger: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer',
  display: 'none', padding: 4,
  // show on mobile via inline style toggle — we use JS instead
}
const mobileMenu: React.CSSProperties = {
  padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: 14,
  borderTop: '1px solid var(--border)', background: 'var(--bg2)',
}
const mobileLink: React.CSSProperties = {
  color: 'var(--text)', fontSize: '1rem', textDecoration: 'none',
}
