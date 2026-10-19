import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Os testes de integração usam o código real de src/firebase.js
    // apontando para os emuladores locais.
    env: { VITE_USE_EMULATORS: 'true' },
    fileParallelism: false,
    testTimeout: 20000,
  },
});
