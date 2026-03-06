import React, { useState } from 'react'
import { PROGRAM_IDS, X1_RPC, X1_WALLET_URL, TELEGRAM_URL } from '../constants'

type OS = 'linux' | 'macos' | 'windows'

export default function HowToMine() {
  const [os, setOs] = useState<OS>('linux')

  return (
    <section id="howto" style={wrap}>
      <div style={inner}>
        <h2 style={heading}>How to Mine bestXEN</h2>
        <p style={desc}>
          Mining runs locally on your CPU — it cannot run in a browser. The CLI miner
          hashes locally and submits valid transactions to X1. You accumulate points
          on-chain, then claim your bestXEN tokens via the{' '}
          <a href="#mint">Mint panel</a> above.
        </p>

        {/* Step cards */}
        <div style={steps}>
          <StepCard n={1} title="Get an X1 Wallet">
            Install the{' '}
            <a href={X1_WALLET_URL} target="_blank" rel="noreferrer">X1 Wallet Chrome extension</a>{' '}
            or use <a href="https://www.backpack.app/" target="_blank" rel="noreferrer">Backpack</a>.
            Fund your wallet with XNT to pay transaction fees (≈ $0.001–0.01 per hash).
          </StepCard>

          <StepCard n={2} title="Install Rust & Solana CLI">
            <OS_Tabs os={os} setOs={setOs} />
            {os === 'linux' && (
              <pre><code>{`# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Install Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"`}</code></pre>
            )}
            {os === 'macos' && (
              <pre><code>{`# Install Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Install Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"`}</code></pre>
            )}
            {os === 'windows' && (
              <pre><code>{`# Use WSL2 (Windows Subsystem for Linux) — strongly recommended
# Enable WSL2, install Ubuntu, then follow Linux instructions above.

# Alternative: Rust on Windows
# 1. Download rustup-init.exe from https://rustup.rs/
# 2. Run it and follow prompts
# 3. Solana CLI on Windows: https://docs.solanalabs.com/cli/install`}</code></pre>
            )}
          </StepCard>

          <StepCard n={3} title="Set up X1 Mainnet">
            <pre><code>{`# Configure Solana CLI for X1 Mainnet
solana config set --url ${X1_RPC}

# Import your wallet (from seed phrase or private key)
solana-keygen recover --force -o ~/x1-wallet.json
# or generate a new one:
# solana-keygen new -o ~/x1-wallet.json

# Verify balance
solana balance ~/x1-wallet.json`}</code></pre>
          </StepCard>

          <StepCard n={4} title="Clone & Build the Miner">
            <pre><code>{`git clone https://github.com/jacklevin74/xenminer-x1
cd xenminer-x1
cargo build --release`}</code></pre>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 8 }}>
              Build takes a few minutes. The binary ends up at <code>target/release/xenminer</code>.
            </p>
          </StepCard>

          <StepCard n={5} title="Start Mining">
            <pre><code>{`# Basic usage (replace with your wallet path)
./target/release/xenminer \\
  --keypair ~/x1-wallet.json \\
  --rpc-url ${X1_RPC} \\
  --program-id ${PROGRAM_IDS.MINER_0}

# To mine across all 4 programs (maximise points):
for PROG in \\
  ${PROGRAM_IDS.MINER_0} \\
  ${PROGRAM_IDS.MINER_1} \\
  ${PROGRAM_IDS.MINER_2} \\
  ${PROGRAM_IDS.MINER_3}; do
  ./target/release/xenminer --keypair ~/x1-wallet.json --rpc-url ${X1_RPC} --program-id $PROG &
done
wait`}</code></pre>
          </StepCard>

          <StepCard n={6} title="Claim Your Tokens">
            Once you've accumulated points, come back here and use the{' '}
            <a href="#mint">Mint panel</a> to claim your bestXEN tokens on-chain.
            The minter program at <code>{PROGRAM_IDS.MINTER.slice(0, 16)}…</code>{' '}
            reads your accumulated hashes and issues tokens to your wallet.
          </StepCard>
        </div>

        {/* Tokenomics quick ref */}
        <div style={tokoBox}>
          <h3 style={tokoHeading}>Tokenomics Quick Reference</h3>
          <div style={tokoGrid}>
            <TokoItem label="Mining Algorithm" value="Keccak256 (CPU)" />
            <TokoItem label="420 hash reward" value="420 × AMP bestXEN" />
            <TokoItem label="42069 super hash" value="250× multiplier" />
            <TokoItem label="AMP start" value="300" />
            <TokoItem label="AMP decay" value="-1 per 100,000 blocks" />
            <TokoItem label="Distribution window" value="≈ 139 days" />
            <TokoItem label="Block time" value="400 ms" />
            <TokoItem label="420 hash probability" value="≈ 95%" />
            <TokoItem label="42069 probability" value="≈ 0.2%" />
            <TokoItem label="Pre-mine" value="None ✓" />
            <TokoItem label="Admin keys" value="None ✓" />
            <TokoItem label="Chain" value="X1 Mainnet (SVM)" />
          </div>
        </div>

        <div style={helpBox}>
          <strong>Need help?</strong>{' '}
          Join the{' '}
          <a href={TELEGRAM_URL} target="_blank" rel="noreferrer">Hashhead Community Telegram</a>{' '}
          for mining support, tips, and announcements.
        </div>
      </div>
    </section>
  )
}

function OS_Tabs({ os, setOs }: { os: OS; setOs: (o: OS) => void }) {
  const tabs: { id: OS; label: string }[] = [
    { id: 'linux', label: '🐧 Linux' },
    { id: 'macos', label: '🍎 macOS' },
    { id: 'windows', label: '🪟 Windows' },
  ]
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setOs(t.id)}
          style={{
            background: os === t.id ? 'var(--accent)' : 'var(--bg3)',
            color: os === t.id ? '#000' : 'var(--muted)',
            border: '1px solid var(--border)',
            borderRadius: 8, padding: '5px 14px', cursor: 'pointer',
            fontWeight: os === t.id ? 700 : 400, fontSize: '0.85rem',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function StepCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={stepCard}>
      <div style={stepNum}>{n}</div>
      <div style={{ flex: 1 }}>
        <h3 style={stepTitle}>{title}</h3>
        <div style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  )
}

function TokoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={tokoItem}>
      <div style={{ color: 'var(--muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{value}</div>
    </div>
  )
}

const wrap: React.CSSProperties = { padding: '80px 24px', background: 'var(--bg2)' }
const inner: React.CSSProperties = { maxWidth: 900, margin: '0 auto' }
const heading: React.CSSProperties = { fontSize: '2rem', fontWeight: 800, marginBottom: 16 }
const desc: React.CSSProperties = { color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 40 }
const steps: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 48 }
const stepCard: React.CSSProperties = {
  display: 'flex', gap: 20, alignItems: 'flex-start',
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px',
}
const stepNum: React.CSSProperties = {
  background: 'var(--accent)', color: '#000', borderRadius: '50%',
  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 900, fontSize: '1rem', flexShrink: 0,
}
const stepTitle: React.CSSProperties = { fontSize: '1.05rem', fontWeight: 700, marginBottom: 12, color: 'var(--text)' }

const tokoBox: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
  padding: '28px', marginBottom: 28,
}
const tokoHeading: React.CSSProperties = { fontSize: '1.15rem', fontWeight: 700, marginBottom: 20, color: 'var(--accent)' }
const tokoGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16,
}
const tokoItem: React.CSSProperties = {
  background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)',
}
const helpBox: React.CSSProperties = {
  background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.3)',
  borderRadius: 10, padding: '16px 20px', color: 'var(--muted)', fontSize: '0.95rem',
}
