import { v4 as uuidv4 } from 'uuid';
import { initDb, warmupDatabase } from '../database';

const SERVER_ID = process.env.SERVER_ID || `et3am-${uuidv4().slice(0, 8)}`;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;

const SERVERS_CONFIG = [
  { id: 'et3am-gcp', url: 'https://et3am-api.mywire.org' },
  { id: 'et3am-aws', url: 'https://et3am-api.matrix-delivery.com' },
];

const HEALTH_CHECK_INTERVAL = 60000;
const HEALTH_CHECK_TIMEOUT = 10000;

const registeredServers = new Map<string, { id: string; url: string; lastHealthCheck: number; isHealthy: boolean }>();

function getMyPosition(): number {
  const index = SERVERS_CONFIG.findIndex(s => s.id === SERVER_ID);
  return index >= 0 ? index + 1 : 1;
}

function getTotalServers(): number {
  return SERVERS_CONFIG.length;
}

function shouldRunHealthCheck(): boolean {
  const myPosition = getMyPosition();
  const totalServers = getTotalServers();
  const currentMinute = Math.floor(Date.now() / 60000);
  const checkPosition = (currentMinute % totalServers) + 1;
  return myPosition === checkPosition;
}

async function checkServerHealth(server: { id: string; url: string }): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${server.url}/api/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function healthCheckAndClean(): Promise<void> {
  console.log(`[${SERVER_ID}] Running health check...`);

  for (const server of SERVERS_CONFIG) {
    const isHealthy = await checkServerHealth(server);
    registeredServers.set(server.id, {
      ...server,
      lastHealthCheck: Date.now(),
      isHealthy,
    });

    if (!isHealthy) {
      console.log(`[${SERVER_ID}] Server ${server.id} is DOWN`);
    }
  }
}

async function registerServer(): Promise<void> {
  console.log(`[${SERVER_ID}] Registering server with URL: ${SERVER_URL}`);
  console.log(`[${SERVER_ID}] My position: ${getMyPosition()} of ${getTotalServers()}`);
}

function getHealthyServers(): { id: string; url: string }[] {
  return Array.from(registeredServers.values())
    .filter(s => s.isHealthy)
    .map(s => ({ id: s.id, url: s.url }));
}

function startServerRegistry(): void {
  registerServer();

  setInterval(async () => {
    if (shouldRunHealthCheck()) {
      await healthCheckAndClean();
    }
  }, HEALTH_CHECK_INTERVAL);

  const healthyServers = getHealthyServers();
  console.log(`[${SERVER_ID}] Healthy servers: ${healthyServers.map(s => s.id).join(', ') || 'none'}`);
}

export {
  SERVER_ID,
  SERVER_URL,
  startServerRegistry,
  getHealthyServers,
  shouldRunHealthCheck,
};
