/**
 * Type-safe environment configuration.
 * This is the ONLY file in the codebase that accesses import.meta.env directly.
 * All other files must import from this module.
 */

interface AppConfig {
  readonly apiBaseUrl: string;
  readonly env: 'dev' | 'prod';
  readonly appName: string;
  readonly isDev: boolean;
  readonly isProd: boolean;
}

const config: AppConfig = {
  apiBaseUrl: import.meta.env['VITE_API_BASE_URL'] as string,
  env: import.meta.env['VITE_ENV'] as 'dev' | 'prod',
  appName: import.meta.env['VITE_APP_NAME'] as string,
  get isDev() {
    return this.env === 'dev';
  },
  get isProd() {
    return this.env === 'prod';
  },
};

export default config;
