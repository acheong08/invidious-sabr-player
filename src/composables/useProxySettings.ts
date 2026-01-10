import { computed, readonly } from 'vue';
import type { ProxySettings } from '@/utils/helpers';

// Proxy settings are now configured via environment variables at build time
// and cannot be changed at runtime. The ytc-bridge extension can still
// override these settings if installed.
const settingsState: ProxySettings = {
  protocol: import.meta.env.VITE_PROXY_PROTOCOL || 'https',
  host: import.meta.env.VITE_PROXY_HOST || 'kube.duti.dev',
  port: import.meta.env.VITE_PROXY_PORT || '443'
};

export function useProxySettings() {
  const isProxyConfigured = computed(() => !!settingsState.host);

  return {
    settings: readonly(settingsState),
    isProxyConfigured
  };
}