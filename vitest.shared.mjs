import react from '@vitejs/plugin-react';

// Shared vite options for the node and browser vitest configs. The alias
// stubs the Next.js 'server-only' marker so server modules load in tests.
export const sharedResolve = {
  alias: {
    'server-only': 'next/dist/compiled/server-only/empty.js',
  },
  tsconfigPaths: true,
};

export const sharedPlugins = [react()];
