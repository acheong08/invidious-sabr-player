import { computed, readonly } from 'vue';
import type { ProxySettings } from '@/utils/helpers';

// Proxy settings now use a relative path approach.
// The proxy is served at /sabr/proxy and uses relative URLs.
// The ytc-bridge extension can still override these settings if installed.
const settingsState: ProxySettings = {
  // Use relative path for the proxy endpoint
  basePath: '/sabr/proxy'
};

export function useProxySettings() {
  const isProxyConfigured = computed(() => !!settingsState.basePath);

  return {
    settings: readonly(settingsState),
    isProxyConfigured
  };
}