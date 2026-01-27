
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY || 'sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr'),
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || 'sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr')
      },
      envPrefix: ['VITE_', 'OPENROUTER_', 'GEMINI_'], // Expose these prefixes to client-side
      resolve: {
        alias: {
          // Fixed: Use path.resolve('.') to resolve the current working directory instead of process.cwd() to avoid typing issues.
          '@': path.resolve('.'),
        }
      }
    };
});
