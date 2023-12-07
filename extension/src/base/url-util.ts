import { URL } from 'url';
import { config } from './configurations';

const codespaceEngineHost = `${process.env.CODESPACE_NAME}-${process.env.ENGINE_PORT}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`;

export function toWebSocketUrl(engineUrl: string): URL {
  const url = new URL(engineUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url;
}

export function resolveClientEngineHost(url: URL): URL {
  if (process.env.CODESPACES === 'true' && config.engineUrl && url.hostname === new URL(config.engineUrl).hostname) {
    url.host = codespaceEngineHost;
    url.port = '';
  }
  return url;
}
