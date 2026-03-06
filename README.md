# bestXEN Web UI

A React + Vite frontend for **bestXEN** — Proof of Work mining on the X1 blockchain.

## Features

| Section | What it does |
|---------|-------------|
| **Hero / Landing** | Token overview, contract addresses, quick links |
| **Stats Bar** | Live on-chain stats: total hashes, super hashes, bestXEN minted, AMP, block height |
| **Dashboard** | Per-wallet: bestXEN balance, mining points, hash count, super hash count |
| **Mint Panel** | One-click on-chain claim — calls `mint_tokens` on the minter program |
| **Leaderboard** | Top 50 miners by hashes, fetched directly from program accounts on X1 |
| **How to Mine** | Step-by-step CLI mining guide (Linux / macOS / Windows tabs) + tokenomics reference |

## Program IDs (X1 Mainnet)

| Role     | Address |
|----------|---------|
| Minter   | `7pQWSzAL3TiP1a9HEArVW5UJaT9rUivNsFpHbpzmJn4Y` |
| Miner 0  | `9jwmN4omMxC9r9Wa2YbYhVpt9qxHVzprC6ZR11KuE4GU` |
| Miner 1  | `6VAdRXDe24nDdkaBJmpws51bhUWkp8Y4QPKKPKbZMchE` |
| Miner 2  | `GvVx5YyjrYwNpkGDFyjvKwdvPCny2zWzWUaK3T3c4zQD` |
| Miner 3  | `6pR9MXWVEkRLqVBtg9FV4NYPuzjMGNHu8ukvjpzoq5G2` |

All addresses are in `src/constants.ts`.

## Tech Stack

- **React 18 + Vite** — fast dev server, tree-shaken production bundle
- **@solana/web3.js v1** — X1 RPC + program account reads
- **@solana/wallet-adapter** — X1 Wallet (Wallet Standard auto-detect), Backpack, Phantom
- **TypeScript** — full type safety
- **Pure CSS** — dark theme with CSS custom properties, no UI library dependency

## Wallet Support

- **X1 Wallet** — auto-detected via the [Wallet Standard](https://github.com/wallet-standard/wallet-standard)
- **Backpack** — explicitly configured
- **Phantom** — explicitly configured
- Any other Wallet Standard-compliant wallet is detected automatically

## Setup & Development

```bash
cd bestxen-web-ui
npm install
npm run dev        # http://localhost:5173
```

## Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the dist/ build locally
```

Serve `dist/` from any static host (Vercel, Netlify, Cloudflare Pages, nginx, etc.).

### nginx example

```nginx
server {
    listen 80;
    root /var/www/bestxen-web-ui/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Vercel / Netlify

Just point at this directory — Vite's `dist/` output is a standard SPA.
Set the rewrite rule: `/* → /index.html`.

## Architecture Notes

### On-chain Data Flow

```
X1 RPC (https://rpc.mainnet.x1.xyz)
  ├── Global PDA (minter) → total hashes, superHashes, minted supply, AMP
  ├── Per-user PDAs (4 miners) → wallet's own points, hashes, super hashes
  └── getProgramAccounts (miners) → leaderboard raw data
```

### Mint Flow

1. Derive `global_xn_record` PDA from minter program (seed: `xn-global-counter`)
2. Derive `mint_account` PDA from minter program (seed: `mint`)
3. Derive user's ATA for the bestXEN mint
4. Build `mint_tokens` instruction (discriminator: `[59,132,24,246,122,39,8,243]`)
5. Send signed transaction → X1 mainnet

### Why no backend API?

All data is fetched directly from X1 on-chain state. No server required for the
read-only features. The mint instruction is signed by the user's own wallet — this
UI never touches private keys.

## Customisation

- **Colors / theme** — `src/index.css` CSS custom properties (`:root { --accent: ... }`)
- **Program IDs** — `src/constants.ts`
- **RPC endpoint** — `src/constants.ts` → `X1_RPC`

## Source Repo (upstream)

Based on: https://github.com/jacklevin74/bestxen-web (Next.js version)
This UI: standalone React + Vite, no Next.js dependency.
