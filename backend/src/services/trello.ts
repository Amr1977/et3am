import dotenv from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

const envPath = join(__dirname, '../../.env.production');
const devEnvPath = join(__dirname, '../../.env');

if (existsSync(envPath)) {
  console.log('[trello] Loading production env from:', envPath);
  dotenv.config({ path: envPath });
} else if (existsSync(devEnvPath)) {
  console.log('[trello] Loading dev env from:', devEnvPath);
  dotenv.config({ path: devEnvPath });
} else {
  dotenv.config();
}

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_SHORT_ID = 'QA8Tk2hW';

const LIST_IDS = {
  BACKLOG: '69ced5e831401e9d1e1b1a50',
  TODO: '69ced5ea4eca79db1e3c7a60',
  PROGRESS: '69ced5ece11ab70340dc4b4f',
  DONE: '69ced5eec9b0716cdea1ee46',
};

async function trelloRequest(endpoint: string, method = 'GET', body?: string) {
  const baseUrl = 'https://api.trello.com/1';
  const auth = `key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
  const url = `${baseUrl}${endpoint}?${auth}`;

  const options: RequestInit = { method };
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = body;
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Trello API error: ${res.status} - ${error}`);
  }
  return res.json();
}

export const trelloService = {
  async createCard(name: string, desc: string, listId: string) {
    const card = await trelloRequest('/cards', 'POST', JSON.stringify({
      name,
      desc,
      idList: listId,
    }));
    return card;
  },

  async createFeatureCard(taskId: string, title: string, description: string, listId = LIST_IDS.BACKLOG) {
    const cardName = `${taskId}: ${title}`;
    const cardDesc = `## ${taskId} - ${title}

### Overview
${description}

### Status
- [ ] Backend
- [ ] Frontend
- [ ] Testing
- [ ] Deployed

### Notes
<!-- Add implementation notes here -->`.trim();

    return this.createCard(cardName, cardDesc, listId);
  },

  async moveCard(cardId: string, listId: string) {
    return trelloRequest(`/cards/${cardId}`, 'PUT', JSON.stringify({ idList: listId }));
  },

  async addComment(cardId: string, text: string) {
    return trelloRequest(`/cards/${cardId}/actions/comments`, 'POST', JSON.stringify({ text }));
  },

  async updateCardDescription(cardId: string, desc: string) {
    return trelloRequest(`/cards/${cardId}`, 'PUT', JSON.stringify({ desc }));
  },

  async archiveCard(cardId: string) {
    return trelloRequest(`/cards/${cardId}`, 'PUT', JSON.stringify({ closed: true }));
  },

  async getCards(listId: string): Promise<any[]> {
    return (await trelloRequest(`/lists/${listId}/cards`)) as any[];
  },

  async getBoardCards(): Promise<any[]> {
    return (await trelloRequest(`/boards/${TRELLO_BOARD_SHORT_ID}/cards`)) as any[];
  },

  async findCardByName(taskId: string) {
    const cards = await this.getBoardCards();
    return cards.find((c: any) => c.name.startsWith(taskId));
  },

  lists: LIST_IDS,
};

export default trelloService;