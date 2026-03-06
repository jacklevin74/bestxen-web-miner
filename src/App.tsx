import { BestXenWalletProvider } from './WalletProvider'
import { useChainStats } from './hooks/useChainStats'
import { ErrorBoundary } from './components/ErrorBoundary'
import NavBar from './components/NavBar'
import Hero from './components/Hero'
import StatsBar from './components/StatsBar'
import Dashboard from './components/Dashboard'
import WebMiner from './components/WebMiner'
import MintPanel from './components/MintPanel'
import Leaderboard from './components/Leaderboard'
import HowToMine from './components/HowToMine'
import Footer from './components/Footer'

// Global keyframe animations injected once
const globalStyle = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @media (max-width: 768px) {
    .desktop-only { display: none !important; }
  }
  html { scroll-behavior: smooth; }
`

function SafeWebMiner() {
  return (
    <ErrorBoundary>
      <WebMiner />
    </ErrorBoundary>
  )
}

function Inner() {
  const stats = useChainStats()
  return (
    <>
      <NavBar />
      <Hero />
      <StatsBar stats={stats} />
      <Dashboard />
      <SafeWebMiner />
      <MintPanel />
      <Leaderboard />
      <HowToMine />
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BestXenWalletProvider>
      <style>{globalStyle}</style>
      <Inner />
    </BestXenWalletProvider>
  )
}
