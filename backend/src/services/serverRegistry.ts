import { v4 as uuidv4 } from 'uuid';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { serviceAccount } from '../firebase-admin';
import { initDb, warmupDatabase } from '../database';

const SERVER_ID = process.env.SERVER_ID || `et3am-${uuidv4().slice(0, 8)}`;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;

const HEALTH_CHECK_INTERVAL = 60000;
const HEALTH_CHECK_TIMEOUT = 10000;

const FIRESTORE_COLLECTION = 'servers';

let db: Firestore | null = null;
let firebaseInitialized = false;

function initFirestore(): void {
  if (getApps().length > 0) {
    db = getFirestore();
    firebaseInitialized = true;
    return;
  }

  if (serviceAccount?.privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId: serviceAccount.projectId,
          privateKey: serviceAccount.privateKey,
          clientEmail: serviceAccount.clientEmail,
        }),
      });
      db = getFirestore();
      firebaseInitialized = true;
      console.log('Firebase Firestore initialized in serverRegistry');
    } catch (err) {
      console.warn('Firebase Firestore initialization failed:', err);
    }
  } else {
    console.warn('Firebase private key not configured - using in-memory fallback');
  }
}

interface ServerDoc {
  serverId: string;
  url: string;
  isHealthy: boolean;
  lastHealthCheck: number;
  registeredAt: number;
}

const registeredServers = new Map<string, ServerDoc>();

function getMyPosition(): number {
  const servers = Array.from(registeredServers.values()).sort((a, b) => 
    a.serverId.localeCompare(b.serverId)
  );
  const index = servers.findIndex(s => s.serverId === SERVER_ID);
  return index >= 0 ? index + 1 : 1;
}

function getTotalServers(): number {
  return registeredServers.size || 1;
}

function shouldRunHealthCheck(): boolean {
  const totalServers = getTotalServers();
  if (totalServers === 0) return true;
  
  const myPosition = getMyPosition();
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

async function fetchServersFromFirestore(): Promise<ServerDoc[]> {
  if (!db || !firebaseInitialized) {
    return Array.from(registeredServers.values());
  }

  try {
    const snapshot = await db.collection(FIRESTORE_COLLECTION).get();
    return snapshot.docs.map(doc => doc.data() as ServerDoc);
  } catch (err) {
    console.warn('Failed to fetch servers from Firestore:', err);
    return Array.from(registeredServers.values());
  }
}

async function updateServerInFirestore(server: ServerDoc): Promise<void> {
  if (!db || !firebaseInitialized) return;

  try {
    await db.collection(FIRESTORE_COLLECTION).doc(server.serverId).set(server, { merge: true });
  } catch (err) {
    console.warn('Failed to update server in Firestore:', err);
  }
}

async function removeServerFromFirestore(serverId: string): Promise<void> {
  if (!db || !firebaseInitialized) return;

  try {
    await db.collection(FIRESTORE_COLLECTION).doc(serverId).delete();
  } catch (err) {
    console.warn('Failed to remove server from Firestore:', err);
  }
}

async function healthCheckAndClean(): Promise<void> {
  console.log(`[${SERVER_ID}] Running health check...`);

  const servers = await fetchServersFromFirestore();

  for (const server of servers) {
    const isHealthy = await checkServerHealth({ id: server.serverId, url: server.url });
    
    const updatedServer: ServerDoc = {
      ...server,
      isHealthy,
      lastHealthCheck: Date.now(),
    };

    registeredServers.set(server.serverId, updatedServer);
    await updateServerInFirestore(updatedServer);

    if (!isHealthy) {
      console.log(`[${SERVER_ID}] Server ${server.serverId} is DOWN`);
      await removeServerFromFirestore(server.serverId);
    }
  }
}

async function registerServer(): Promise<void> {
  console.log(`[${SERVER_ID}] Registering server with URL: ${SERVER_URL}`);
  console.log(`[${SERVER_ID}] My position: ${getMyPosition()} of ${getTotalServers()}`);

  const serverDoc: ServerDoc = {
    serverId: SERVER_ID,
    url: SERVER_URL,
    isHealthy: true,
    lastHealthCheck: Date.now(),
    registeredAt: Date.now(),
  };

  registeredServers.set(SERVER_ID, serverDoc);
  await updateServerInFirestore(serverDoc);
}

function getHealthyServers(): { id: string; url: string }[] {
  return Array.from(registeredServers.values())
    .filter(s => s.isHealthy)
    .map(s => ({ id: s.serverId, url: s.url }));
}

async function startServerRegistry(): Promise<void> {
  initFirestore();

  try {
    await initDb();
    await warmupDatabase();
  } catch (err) {
    console.warn('Database initialization failed:', err);
  }

  await registerServer();

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
