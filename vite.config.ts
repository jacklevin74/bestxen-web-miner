import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
    },
  },
  optimizeDeps: {
    include: ['buffer', '@solana/web3.js', '@coral-xyz/anchor', 'js-sha3'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  worker: {
    format: 'es',
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'solana': ['@solana/web3.js', '@coral-xyz/anchor'],
          'wallet-adapter': [
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-base',
          ],
        },
      },
    },
  },
})
