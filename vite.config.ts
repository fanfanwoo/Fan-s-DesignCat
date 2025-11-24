import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import crypto from 'crypto'

// POLYFILL: This fixes the "crypto.getRandomValues is not a function" error 
// on Node.js versions < 19 (like your v16).
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = {
    getRandomValues: (arr: any) => crypto.randomFillSync(arr)
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cast process to any to avoid TypeScript error: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})