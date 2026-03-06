import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useMiner } from '../hooks/useMiner'
import { X1_EXPLORER_URL, MINER_IDS } from '../constants'
import { FiZap, FiSquare, FiCpu, FiActivity, FiHash, FiStar, FiSend, FiCheckCircle, FiXCircle } from 'react-icons/fi'

export default function WebMiner() {
  const { publicKey, connected, signTransaction } = useWallet()
  const [ethAddress, setEthAddress] = useState('')
  const { stats, startMining, stopMining } = useMiner(
    publicKey ?? null,
    signTransaction,
    ethAddress || undefined,
  )

  const isMining = stats.status === 'mining' || stats.status === 'submitting'
  const isReady = stats.status === 'ready' || stats.status === 'idle'
  const canStart = connected && publicKey && (isReady || stats.status === 'error')

  return (
    <section id="webminer" style={wrap}>
      <div style={inner}>
        {/* Header */}
        <div style={headerRow}>
          <div>
            <h2 style={heading}>
              <FiCpu style={{ verticalAlign: 'middle', marginRight: 10 }} />
              Web Mining
            </h2>
            <p style={desc}>
              Mine bestXEN directly in your browser. The miner pre-computes hash results 
              and auto-submits transactions to the 4 miner programs when profitable hashes are found.
            </p>
          </div>
          <span style={wasmBadge}>⚡ In-Browser</span>
        </div>

        {!connected ? (
          <div style={connectBox}>
            <FiZap size={48} style={{ color: 'var(--accent)', marginBottom: 20 }} />
            <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: '1.05rem' }}>
              Connect your wallet to start web mining.
            </p>
            <WalletMultiButton />
          </div>
        ) : (
          <>
            {/* ETH Address Input (optional) */}
            <div style={ethInputBox}>
              <label style={ethLabel}>Ethereum Address (optional)</label>
              <input
                type="text"
                placeholder="0x0000...0000 (for cross-chain mining credit)"
                value={ethAddress}
                onChange={(e) => setEthAddress(e.target.value)}
                disabled={isMining}
                style={ethInput}
              />
              <p style={ethHint}>
                Leave blank to mine with a default address. Your X1 wallet always receives credit.
              </p>
            </div>

            {/* Status Banner */}
            <div style={statusBanner(stats.status)}>
              <StatusIndicator status={stats.status} />
              <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                {stats.status === 'mining' && '⛏ Mining Active'}
                {stats.status === 'submitting' && '📡 Submitting Transaction...'}
                {stats.status === 'ready' && '✅ Ready to Mine'}
                {stats.status === 'loading' && '⏳ Loading Miner...'}
                {stats.status === 'idle' && '💤 Idle'}
                {stats.status === 'paused' && '⏸ Paused'}
                {stats.status === 'error' && `❌ Error: ${stats.error}`}
              </span>
              {stats.status === 'mining' && (
                <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.9rem' }}>
                  Miner {stats.minerKind}/3
                </span>
              )}
            </div>

            {/* Stats Grid */}
            <div style={statsGrid}>
              <StatCard
                icon={<FiActivity />}
                label="Hash Rate"
                value={formatHashRate(stats.hashRate)}
                color="var(--accent)"
              />
              <StatCard
                icon={<FiHash />}
                label="Hashes Found"
                value={stats.hashesFound.toLocaleString()}
                color="var(--green)"
              />
              <StatCard
                icon={<FiStar />}
                label="Super Hashes"
                value={stats.superhashesFound.toLocaleString()}
                color="var(--yellow)"
              />
              <StatCard
                icon={<FiCpu />}
                label="Slots Scanned"
                value={stats.slotsScanned.toLocaleString()}
                color="var(--muted)"
              />
            </div>

            {/* Transaction Stats */}
            <div style={txStatsRow}>
              <TxStat icon={<FiSend />} label="Submitted" value={stats.txSubmitted} color="var(--accent)" />
              <TxStat icon={<FiCheckCircle />} label="Confirmed" value={stats.txConfirmed} color="var(--green)" />
              <TxStat icon={<FiXCircle />} label="Failed" value={stats.txFailed} color="var(--red)" />
            </div>

            {/* Chain Info */}
            <div style={chainInfoGrid}>
              <div style={chainInfoItem}>
                <span style={chainInfoLabel}>Current Slot</span>
                <span style={chainInfoValue}>{stats.currentSlot > 0 ? stats.currentSlot.toLocaleString() : '—'}</span>
              </div>
              <div style={chainInfoItem}>
                <span style={chainInfoLabel}>AMP</span>
                <span style={{ ...chainInfoValue, color: 'var(--yellow)' }}>{stats.amp > 0 ? stats.amp : '—'}</span>
              </div>
              <div style={chainInfoItem}>
                <span style={chainInfoLabel}>Current Nonce</span>
                <span style={{ ...chainInfoValue, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {stats.currentNonce.some(n => n !== 0)
                    ? `0x${stats.currentNonce.map(b => b.toString(16).padStart(2, '0')).join('')}`
                    : '—'}
                </span>
              </div>
              <div style={chainInfoItem}>
                <span style={chainInfoLabel}>Active Miner</span>
                <a
                  href={`${X1_EXPLORER_URL}/account/${MINER_IDS[stats.minerKind]}`}
                  target="_blank" rel="noreferrer"
                  style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--accent)' }}
                >
                  Miner {stats.minerKind} ↗
                </a>
              </div>
            </div>

            {/* Last Tx */}
            {stats.lastTxSig && (
              <div style={lastTxBox}>
                <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Last TX:</span>
                <a
                  href={`${X1_EXPLORER_URL}/tx/${stats.lastTxSig}`}
                  target="_blank" rel="noreferrer"
                  style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--green)' }}
                >
                  {stats.lastTxSig.slice(0, 16)}…{stats.lastTxSig.slice(-8)} ↗
                </a>
              </div>
            )}

            {/* Control Button */}
            <button
              onClick={isMining ? stopMining : startMining}
              disabled={!canStart && !isMining}
              style={controlBtn(isMining, !canStart && !isMining)}
            >
              {isMining ? (
                <>
                  <FiSquare style={{ marginRight: 8 }} />
                  Stop Mining
                </>
              ) : (
                <>
                  <FiZap style={{ marginRight: 8 }} />
                  Start Mining
                </>
              )}
            </button>

            {/* Info */}
            <div style={infoSection}>
              <h3 style={infoHeading}>How It Works</h3>
              <ol style={infoList}>
                <li>The miner reads the current on-chain state (slot, nonce, AMP)</li>
                <li>It pre-computes keccak256 hashes matching the on-chain algorithm</li>
                <li>When hashes containing "420" or "42069" are found, a <code>mine_hashes</code> transaction is submitted</li>
                <li>Transactions auto-rotate across all 4 miner programs for maximum throughput</li>
                <li>Points accumulate on-chain — mint bestXEN tokens in the Mint section</li>
              </ol>
              <p style={infoNote}>
                💡 <strong>Tip:</strong> Mining runs entirely in your browser using a Web Worker.
                Your private keys never leave your wallet.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// Sub-components
function StatusIndicator({ status }: { status: string }) {
  const color = status === 'mining' ? 'var(--green)' 
    : status === 'submitting' ? 'var(--yellow)'
    : status === 'error' ? 'var(--red)' 
    : 'var(--muted)'
  const pulse = status === 'mining' || status === 'submitting'

  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: color,
      marginRight: 10,
      animation: pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }} />
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={statCard}>
      <div style={{ color, fontSize: '1.3rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  )
}

function TxStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color }}>
      {icon}
      <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{value}</span>
      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{label}</span>
    </div>
  )
}

function formatHashRate(rate: number): string {
  if (rate === 0) return '0'
  if (rate >= 1_000_000) return `${(rate / 1_000_000).toFixed(1)}M`
  if (rate >= 1_000) return `${(rate / 1_000).toFixed(1)}K`
  return rate.toString()
}

// Styles
const wrap: React.CSSProperties = {
  padding: '80px 24px',
  background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%)',
}
const inner: React.CSSProperties = { maxWidth: 900, margin: '0 auto' }
const headerRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  marginBottom: 28, flexWrap: 'wrap', gap: 16,
}
const heading: React.CSSProperties = {
  fontSize: '2rem', fontWeight: 800, marginBottom: 12,
  display: 'flex', alignItems: 'center',
}
const desc: React.CSSProperties = {
  color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 600,
}
const wasmBadge: React.CSSProperties = {
  background: 'rgba(0,195,255,0.15)',
  color: 'var(--accent)',
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: '0.8rem',
  fontWeight: 700,
  border: '1px solid rgba(0,195,255,0.3)',
  whiteSpace: 'nowrap',
}
const connectBox: React.CSSProperties = {
  textAlign: 'center', padding: '60px 40px',
  background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
}
const ethInputBox: React.CSSProperties = {
  marginBottom: 24,
}
const ethLabel: React.CSSProperties = {
  display: 'block', color: 'var(--muted)', fontSize: '0.8rem',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
}
const ethInput: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontFamily: 'monospace',
  fontSize: '0.9rem', outline: 'none',
}
const ethHint: React.CSSProperties = {
  color: 'var(--muted)', fontSize: '0.78rem', marginTop: 6,
}

const statusBanner = (status: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', padding: '14px 20px',
  background: status === 'mining' ? 'rgba(63,185,80,0.08)' 
    : status === 'error' ? 'rgba(248,81,73,0.08)'
    : 'var(--bg3)',
  border: `1px solid ${status === 'mining' ? 'rgba(63,185,80,0.3)' 
    : status === 'error' ? 'rgba(248,81,73,0.3)'
    : 'var(--border)'}`,
  borderRadius: 12, marginBottom: 24,
})

const statsGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 16, marginBottom: 20,
}
const statCard: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
  padding: '24px 20px', textAlign: 'center',
}
const txStatsRow: React.CSSProperties = {
  display: 'flex', gap: 24, flexWrap: 'wrap',
  padding: '14px 20px', background: 'var(--bg3)',
  borderRadius: 10, border: '1px solid var(--border)',
  marginBottom: 20,
}
const chainInfoGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12, marginBottom: 20,
}
const chainInfoItem: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4,
  padding: '12px 16px', background: 'var(--bg3)',
  borderRadius: 8, border: '1px solid var(--border)',
}
const chainInfoLabel: React.CSSProperties = {
  fontSize: '0.7rem', color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
}
const chainInfoValue: React.CSSProperties = {
  fontSize: '1rem', fontWeight: 700, color: 'var(--text)',
}
const lastTxBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 16px', background: 'rgba(63,185,80,0.06)',
  border: '1px solid rgba(63,185,80,0.2)', borderRadius: 8,
  marginBottom: 20,
}

const controlBtn = (isMining: boolean, disabled: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '100%', padding: '18px',
  background: disabled ? 'var(--bg3)' 
    : isMining ? 'var(--red)' 
    : 'var(--green)',
  color: disabled ? 'var(--muted)' : '#000',
  fontWeight: 800, fontSize: '1.1rem', border: 'none',
  borderRadius: 14, cursor: disabled ? 'not-allowed' : 'pointer',
  marginBottom: 32, transition: 'all .2s',
})

const infoSection: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 16, padding: '28px 32px',
}
const infoHeading: React.CSSProperties = {
  fontSize: '1.1rem', fontWeight: 700, marginBottom: 16,
}
const infoList: React.CSSProperties = {
  paddingLeft: 24, color: 'var(--muted)', lineHeight: 2,
  fontSize: '0.9rem',
}
const infoNote: React.CSSProperties = {
  marginTop: 16, padding: '12px 16px',
  background: 'rgba(0,195,255,0.07)',
  border: '1px solid rgba(0,195,255,0.2)',
  borderRadius: 8, fontSize: '0.85rem', color: 'var(--muted)',
}
