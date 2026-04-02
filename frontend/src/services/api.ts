const API_SERVERS = [
  { id: 'et3am-gcp', url: 'https://et3am-api.mywire.org' },
  { id: 'et3am-aws', url: 'https://et3am-api.matrix-delivery.com' },
];

const HEALTH_CHECK_TIMEOUT = 5000;
const SERVER_LIST_CACHE_TIME = 60000;

interface ServerInfo {
  id: string;
  url: string;
}

let serverCache: { servers: ServerInfo[]; timestamp: number } | null = null;
let currentServer: ServerInfo | null = null;

async function checkServerHealth(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${url}/api/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

async function getHealthyServers(): Promise<ServerInfo[]> {
  const now = Date.now();

  if (serverCache && now - serverCache.timestamp < SERVER_LIST_CACHE_TIME) {
    return serverCache.servers;
  }

  const healthChecks = await Promise.all(
    API_SERVERS.map(async (server) => ({
      ...server,
      isHealthy: await checkServerHealth(server.url),
    }))
  );

  const healthyServers = healthChecks
    .filter((s) => s.isHealthy)
    .map(({ id, url }) => ({ id, url }));

  serverCache = {
    servers: healthyServers,
    timestamp: now,
  };

  return healthyServers;
}

export async function fetchWithFailover(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const servers = await getHealthyServers();

  if (servers.length === 0) {
    throw new Error('No healthy servers available');
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
  currentServer = null;
}
