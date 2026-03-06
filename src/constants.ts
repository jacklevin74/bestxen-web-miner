export const PROGRAM_IDS = {
  MINTER:  '7pQWSzAL3TiP1a9HEArVW5UJaT9rUivNsFpHbpzmJn4Y',
  MINER_0: '9jwmN4omMxC9r9Wa2YbYhVpt9qxHVzprC6ZR11KuE4GU',
  MINER_1: '6VAdRXDe24nDdkaBJmpws51bhUWkp8Y4QPKKPKbZMchE',
  MINER_2: 'GvVx5YyjrYwNpkGDFyjvKwdvPCny2zWzWUaK3T3c4zQD',
  MINER_3: '6pR9MXWVEkRLqVBtg9FV4NYPuzjMGNHu8ukvjpzoq5G2',
}

export const MINER_IDS = [
  PROGRAM_IDS.MINER_0,
  PROGRAM_IDS.MINER_1,
  PROGRAM_IDS.MINER_2,
  PROGRAM_IDS.MINER_3,
]

export const X1_RPC  = 'https://rpc.mainnet.x1.xyz'
export const X1_WS   = 'wss://rpc.mainnet.x1.xyz'

// bestXEN token mint (derived PDA from minter program, seed = "mint")
// This is the SPL token mint account for bestXEN
export const BESTXEN_MINT = 'bestXENTokenMintAddressHere' // placeholder – actual mint derived from minter PDA

export const XDEX_SWAP_URL   = 'https://app.xdex.xyz/swap'
export const X1_EXPLORER_URL = 'https://explorer.mainnet.x1.xyz'
export const GITHUB_URL      = 'https://github.com/jacklevin74/bestxen-web'
export const TELEGRAM_URL    = 'https://t.me/+Z5kEez70pyQ5NTAz'
export const X1_WALLET_URL   = 'https://chromewebstore.google.com/detail/x1-wallet/kcfmcpdmlchhbikbogddmgopmjbflnae'
export const DOCS_URL        = 'https://docs.x1.xyz'
