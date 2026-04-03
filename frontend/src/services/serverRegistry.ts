import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface ServerInfo {
  id: string;
  url: string;
  isHealthy?: boolean;
  lastHealthCheck?: number;
}

const SERVERS_COLLECTION = 'servers';

const FALLBACK_SERVERS: ServerInfo[] = [
  { id: 'et3am-aws', url: 'https://api.et3am.com' },
  { id: 'et3am-aws-fallback', url: 'https://et3am-api.matrix-delivery.com' },
];

export async function fetchServerListFromFirestore(): Promise<ServerInfo[]> {
  try {
    const serversRef = collection(db, SERVERS_COLLECTION);
    const q = query(serversRef, orderBy('serverId'));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return FALLBACK_SERVERS;
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.serverId || doc.id,
        url: data.url,
        isHealthy: data.isHealthy ?? true,
        lastHealthCheck: data.lastHealthCheck,
      };
    });
  } catch (error) {
    return FALLBACK_SERVERS;
  }
}

export async function getActiveServers(): Promise<ServerInfo[]> {
  const servers = await fetchServerListFromFirestore();
  return servers.filter((server) => server.isHealthy !== false);
}
