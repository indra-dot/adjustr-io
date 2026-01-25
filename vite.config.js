import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // base ini WAJIB sama dengan nama repository lo di GitHub
  // Biar aset JS/CSS gak 404 pas dideploy
  base: '/adjustr-io/', 
})