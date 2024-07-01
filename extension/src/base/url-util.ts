import { URL } from 'url';
import { IvyEngineManager } from '../engine/engine-manager';

export function toWebSocketUrl(engineUrl: URL): URL {
  const url = new URL(engineUrl.toString());
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url;
}

export function resolveClientEngineHost(url: URL): URL {
  const engineUrl = IvyEngineManager.instance.engineUrl;
  if (process.env.CODESPACES === 'true' && url.host === engineUrl.host) {
    const codespaceEngineHost = `${process.env.CODESPACE_NAME}-${engineUrl.port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`;
    url.host = codespaceEngineHost;
    url.port = '';
  }
  return url;
}
