import { defineConfig } from 'vitest/config';

// Backend-only tests config.
// This repo also contains a Vite/TanStack Start setup elsewhere; without a dedicated
// config vitest may try to bootstrap TanStack Start/Vite plugins for the backend,
// leading to startup errors like:
// "Could not resolve entry for router entry: router in <project>/src".

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // Only load actual runnable tests; keep disabled smoke tests out.
    include: ['tests/**/*.spec.ts'],
    exclude: ['tests/**/*.wireup.test.ts'],
    pool: 'forks',
    isolate: true,
    passWithNoTests: true,
  },
});
