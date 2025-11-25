import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent folder
dotenv.config({
  path: path.resolve(__dirname, '..', '.env')
});

// Debug
// eslint-disable-next-line no-undef
console.log('Loaded BACKEND URL:', process.env.VITE_BACKEND_URL);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // eslint-disable-next-line no-undef
        target: process.env.VITE_BACKEND_URL,
        changeOrigin: true
      }
    }
  }
});
