import { v4 as uuidv4 } from 'uuid';
import { initFirestore } from '../firebase-firestore';

const SERVER_ID = process.env.SERVER_ID || `et3am-${uuidv4().slice(0, 8)}`;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;

const STATIC_SERVERS = [
  { id: 'et3am-gcp', url: 'https://et3am-api.mywire.org' },
  { id: 'et3am-aws', url: 'https://et3am-api.matrix-delivery.com' },
];

const HEALTH_CHECK_INTERVAL = 60000;
const HEALTH_CHECK_TIMEOUT = 10000;

interface ServerDoc {
  serverId: string;
  url: string;
  isHealthy: boolean;
  lastHealthCheck: number;
}

const registeredServers = new Map<string, ServerDoc>();
let useFirestore = false;

function getMyPosition(): number {
  const index = STATIC_SERVERS.findIndex(s => s.id === SERVER_ID);
  return index >= 0 ? index + 1 : 1;
}

function getTotalServers(): number {
  return STATIC_SERVERS.length;
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
  } catch {
    return false;
  }
}

async function healthCheckAndClean(): Promise<void> {
  console.log(`[${SERVER_ID}] Running health check...`);

  for (const server of STATIC_SERVERS) {
    if (server.id === SERVER_ID) continue;
    
    const isHealthy = await checkServerHealth(server);
    registeredServers.set(server.id, {
      serverId: server.id,
      url: server.url,
      isHealthy,
      lastHealthCheck: Date.now(),
    });

    if (!isHealthy) {
      console.log(`[${SERVER_ID}] Server ${server.id} is DOWN`);
    }

    if (useFirestore) {
      try {
        const db = initFirestore();
        await db?.collection('servers').doc(server.id).set({
          serverId: server.id,
          url: server.url,
          isHealthy,
          lastHealthCheck: Date.now(),
        }, { merge: true });
      } catch (err) {
        console.warn(`[${SERVER_ID}] Failed to update health in Firestore:`, err);
      }
    }
  }

  const healthy = getHealthyServers();
  console.log(`[${SERVER_ID}] Healthy servers: ${healthy.map(s => s.id).join(', ') || 'none'}`);
}

async function registerServer(): Promise<void> {
  const serverDoc: ServerDoc = {
    serverId: SERVER_ID,
    url: SERVER_URL,
    isHealthy: true,
    lastHealthCheck: Date.now(),
  };

  registeredServers.set(SERVER_ID, serverDoc);
  console.log(`[${SERVER_ID}] Registered with URL: ${SERVER_URL}`);
  console.log(`[${SERVER_ID}] My position: ${getMyPosition()} of ${getTotalServers()}`);

  try {
    const db = initFirestore();
    if (db) {
      useFirestore = true;
      await db.collection('servers').doc(SERVER_ID).set({
        serverId: SERVER_ID,
        url: SERVER_URL,
        isHealthy: true,
        lastHealthCheck: Date.now(),
      }, { merge: true });
      console.log(`[${SERVER_ID}] Registered in Firestore`);
    }
  } catch (err) {
    console.warn(`[${SERVER_ID}] Failed to register in Firestore:`, err);
  }
}

function getHealthyServers(): { id: string; url: string }[] {
  return STATIC_SERVERS.map(s => ({ id: s.id, url: s.url }));
}

async function startServerRegistry(): Promise<void> {
  await registerServer();

  setInterval(async () => {
    if (shouldRunHealthCheck()) {
      await healthCheckAndClean();
    }
  }, HEALTH_CHECK_INTERVAL);

  const healthyServers = getHealthyServers();
  console.log(`[${SERVER_ID}] Initial healthy servers: ${healthyServers.map(s => s.id).join(', ') || 'none'}`);
}

export {
  SERVER_ID,
  SERVER_URL,
  startServerRegistry,
  getHealthyServers,
  shouldRunHealthCheck,
};
