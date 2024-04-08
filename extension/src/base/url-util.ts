import { URL } from 'url';

export function toWebSocketUrl(engineUrl: string): URL {
  const url = new URL(engineUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url;
}
