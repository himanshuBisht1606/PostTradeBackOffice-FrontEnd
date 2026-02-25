import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerUnauthorizedHandler } from '@core/api/interceptors';
import { useAuthStore } from '@modules/auth/store/authStore';
import App from './App';
import 'antd/dist/reset.css';

// ── Hydrate auth state from sessionStorage on page load ──────────────────────
const { hydrateFromStorage } = useAuthStore.getState();
hydrateFromStorage();

// ── Register 401 handler so the interceptor can clear auth and redirect ───────
registerUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
  window.location.replace('/login?reason=session_expired');
});

// ── Mount React ───────────────────────────────────────────────────────────────
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found in index.html');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
