import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import fs from "fs"
import path from "path"

const isProd = process.env.NODE_ENV === "production"

const certPath = path.resolve(__dirname, "../DESKTOP-I80NJCN+2.pem")
const keyPath  = path.resolve(__dirname, "../DESKTOP-I80NJCN+2-key.pem")
const hasCerts = !isProd && fs.existsSync(certPath) && fs.existsSync(keyPath)

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({ protocolImports: true }),
  ],
  resolve: {
    alias: { "@": "/src" },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    ...(hasCerts && {
      https: {
        key:  fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    }),
    proxy: {
      "/api": {
        target: "https://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "https://localhost:5000",
        ws: true,
        secure: false,
      },
    },
  },
})
