import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No GitHub Pages o site fica em https://USUARIO.github.io/protocolo-de-reorganizacao/.
// Localmente (npm run dev) continua em http://127.0.0.1:5173/.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/protocolo-de-reorganizacao/' : '/',
  plugins: [react()],
}));
