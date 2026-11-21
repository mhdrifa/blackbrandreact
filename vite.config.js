import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawMode = String(env.VITE_APP_MODE || '').trim().toLowerCase();
  // Mock backend & sandbox UI are compiled out completely unless explicitly enabled in dev/mock mode
  const allowMock = rawMode === 'mock' || (command === 'serve' && !rawMode);

  return {
    plugins: [react()],
    define: {
      __ALLOW_MOCK__: JSON.stringify(allowMock)
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'brand-management.html')
        }
      }
    }
  };
});
