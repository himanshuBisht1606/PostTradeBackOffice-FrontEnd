import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function envValidationPlugin(): Plugin {
  return {
    name: 'env-validation',
    buildStart() {
      const required = ['VITE_API_BASE_URL', 'VITE_ENV', 'VITE_APP_NAME'];
      const missing = required.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(
          `[env-validation] Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
            `Ensure your .env.dev or .env.prod file is present and populated.`,
        );
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Inject VITE_ vars so the validation plugin can read them via process.env
  Object.entries(env).forEach(([key, value]) => {
    if (key.startsWith('VITE_')) {
      process.env[key] = value;
    }
  });

  return {
    plugins: [react(), envValidationPlugin()],

    resolve: {
      alias: {
        '@core': path.resolve(__dirname, 'src/core'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@modules': path.resolve(__dirname, 'src/modules'),
        '@router': path.resolve(__dirname, 'src/router'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@app-types': path.resolve(__dirname, 'src/types'),
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
    },

    build: {
      sourcemap: mode === 'dev',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            antd: ['antd', '@ant-design/icons'],
            query: ['@tanstack/react-query'],
            charts: ['recharts'],
          },
        },
      },
    },

    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
