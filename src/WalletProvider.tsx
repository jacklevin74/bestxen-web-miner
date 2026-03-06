import { type FC, type ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import '@solana/wallet-adapter-react-ui/styles.css'
import { X1_RPC } from './constants'

// X1 Wallet auto-detects via Wallet Standard (window.x1).
// Backpack and Phantom are explicitly included as fallback adapters.
export const BestXenWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const wallets = useMemo(() => [
    new BackpackWalletAdapter(),
    new PhantomWalletAdapter(),
  ], [])

  return (
    <ConnectionProvider endpoint={X1_RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
