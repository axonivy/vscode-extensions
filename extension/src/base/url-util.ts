import { URL } from 'url';

export function toWebSocketUrl(engineUrl: URL): URL {
  const url = new URL(engineUrl.toString());
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url;
}
