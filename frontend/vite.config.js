import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { nodePolyfills } from "vite-plugin-node-polyfills"

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
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 9090,
    allowedHosts: [
      "units.jhubafrica.com",
      "www.units.jhubafrica.com",
    ],
  },
})
