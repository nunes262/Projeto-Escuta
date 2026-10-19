import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Sem source maps em produção: o código do site já é público,
    // mas não há por que facilitar a leitura.
    sourcemap: false,
    // O SDK do Firestore sozinho passa de 500 kB; o aviso padrão não ajuda aqui
    chunkSizeWarningLimit: 1000,
  },
});
