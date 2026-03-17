import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({ protocolImports: true }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
  key:  fs.readFileSync(path.resolve(__dirname, '../DESKTOP-I80NJCN+2-key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '../DESKTOP-I80NJCN+2.pem')),
},
proxy: {
  '/api': {
    target: 'https://localhost:5000',   // ← always localhost, never changes
    changeOrigin: true,
    secure: false,
  },
  '/socket.io': {
    target: 'https://localhost:5000',   // ← always localhost, never changes
    ws: true,
    secure: false,
  },
},
  },
})