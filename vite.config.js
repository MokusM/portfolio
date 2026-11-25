import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 4 so the project runs on Node 16 as well as on Node 24.
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: { port: 5173, strictPort: true },
})
