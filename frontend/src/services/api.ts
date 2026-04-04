import { fetchServerListFromFirestore, getActiveServers, ServerInfo } from './serverRegistry';

const SERVER_LIST_CACHE_TIME = 60000;

let serverCache: ServerInfo[] | null = null;
let cacheTimestamp: number | null = null;
let currentServer: ServerInfo | null = null;

const DEFAULT_SERVERS: ServerInfo[] = [
  { id: 'et3am-aws', url: 'https://api.et3am.com' },
  { id: 'et3am-aws-fallback', url: 'https://et3am-api.matrix-delivery.com' },
];

async function getServers(): Promise<ServerInfo[]> {
  const now = Date.now();

  if (serverCache && cacheTimestamp && now - cacheTimestamp < SERVER_LIST_CACHE_TIME) {
    return serverCache;
  }

  try {
    const servers = await getActiveServers();
    if (servers.length > 0) {
      serverCache = servers;
      cacheTimestamp = now;
      return servers;
    }
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using default servers:', error);
  }

  serverCache = DEFAULT_SERVERS;
  cacheTimestamp = now;
  return DEFAULT_SERVERS;
}

export async function fetchWithFailover(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const servers = await getServers();

  if (servers.length === 0) {
    throw new Error('No servers available');
  }

  if (!currentServer) {
    currentServer = servers[0];
  } else if (!servers.find((s) => s.id === currentServer!.id)) {
    currentServer = servers[0];
  }

  const errors: Error[] = [];

  for (const server of servers) {
    try {
      const response = await fetch(`${server.url}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      if (response.ok) {
        currentServer = server;
        return response;
      }

      if (response.status >= 500) {
        errors.push(new Error(`Server ${server.id} returned ${response.status}`));
        continue;
      }

      return response;
    } catch (error) {
      errors.push(error as Error);
    }
  }

  serverCache = null;

  if (servers.length > 1) {
    return fetchWithFailover(endpoint, options);
  }

  throw new Error(`All servers failed: ${errors.map((e) => e.message).join(', ')}`);
}

export function getCurrentServer(): ServerInfo | null {
  return currentServer;
}

export function clearServerCache(): void {
  serverCache = null;
  cacheTimestamp = null;
  currentServer = null;
}

let cachedServerUrl: string | null = null;

export async function getServerUrl(): Promise<string> {
  if (cachedServerUrl) {
    return cachedServerUrl;
  }
  
  const servers = await getServers();
  cachedServerUrl = servers.length > 0 ? servers[0].url : DEFAULT_SERVERS[0].url;
  return cachedServerUrl;
}
