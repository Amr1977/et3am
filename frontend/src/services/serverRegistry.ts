import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface ServerInfo {
  id: string;
  url: string;
  isHealthy?: boolean;
  lastHealthCheck?: number;
}

const SERVERS_COLLECTION = 'servers';

export async function fetchServerListFromFirestore(): Promise<ServerInfo[]> {
  const serversRef = collection(db, SERVERS_COLLECTION);
  const q = query(serversRef, orderBy('serverId'));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.serverId || doc.id,
      url: data.url,
      isHealthy: data.isHealthy ?? true,
      lastHealthCheck: data.lastHealthCheck,
    };
  });
}

export async function getActiveServers(): Promise<ServerInfo[]> {
  const servers = await fetchServerListFromFirestore();
  return servers.filter((server) => server.isHealthy !== false);
}
