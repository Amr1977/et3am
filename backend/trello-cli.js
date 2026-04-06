const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_SHORT_ID = 'QA8Tk2hW';

const LIST_IDS = {
  BACKLOG: '69ced5e831401e9d1e1b1a50',
  TODO: '69ced5ea4eca79db1e3c7a60',
  PROGRESS: '69ced5ece11ab70340dc4b4f',
  DONE: '69ced5eec9b0716cdea1ee46',
};

async function trelloRequest(endpoint, method = 'GET', body = null) {
  const baseUrl = 'https://api.trello.com/1';
  const auth = `key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
  const url = `${baseUrl}${endpoint}?${auth}`;

  const options = { method };
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Trello API error: ${res.status} - ${error}`);
  }
  return res.json();
}

const trelloService = {
  async createCard(name, desc, listId) {
    return trelloRequest('/cards', 'POST', { name, desc, idList: listId });
  },

  async createFeatureCard(taskId, title, description, listId = LIST_IDS.BACKLOG) {
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
<!-- Add implementation notes here -->`;

    return this.createCard(cardName, cardDesc, listId);
  },

  async moveCard(cardId, listId) {
    return trelloRequest(`/cards/${cardId}`, 'PUT', { idList: listId });
  },

  async addComment(cardId, text) {
    return trelloRequest(`/cards/${cardId}/actions/comments`, 'POST', { text });
  },

  async updateCardDescription(cardId, desc) {
    return trelloRequest(`/cards/${cardId}`, 'PUT', { desc });
  },

  async archiveCard(cardId) {
    return trelloRequest(`/cards/${cardId}`, 'PUT', { closed: true });
  },

  async getCards(listId) {
    return trelloRequest(`/lists/${listId}/cards`);
  },

  async getBoardCards() {
    return trelloRequest(`/boards/${TRELLO_BOARD_SHORT_ID}/cards`);
  },

  async findCardByName(taskId) {
    const cards = await this.getBoardCards();
    return cards.find(c => c.name.startsWith(taskId));
  },

  lists: LIST_IDS,
};

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
    console.error('Missing TRELLO_API_KEY or TRELLO_TOKEN in .env');
    process.exit(1);
  }

  switch (command) {
    case 'create': {
      const taskId = args[1];
      const title = args[2];
      const list = args[3] || 'BACKLOG';
      if (!taskId || !title) {
        console.error('Usage: node trello-cli.js create <TASK_ID> <title> [list]');
        process.exit(1);
      }
      const card = await trelloService.createFeatureCard(taskId, title, '', trelloService.lists[list]);
      console.log(`Created card: ${card.url}`);
      break;
    }
    case 'move': {
      const taskId = args[1];
      const list = args[2];
      if (!taskId || !list) {
        console.error('Usage: node trello-cli.js move <TASK_ID> <list>');
        process.exit(1);
      }
      const card = await trelloService.findCardByName(taskId);
      if (!card) {
        console.error(`Card not found: ${taskId}`);
        process.exit(1);
      }
      await trelloService.moveCard(card.id, trelloService.lists[list]);
      console.log(`Moved ${taskId} to ${list}`);
      break;
    }
    case 'comment': {
      const taskId = args[1];
      const text = args.slice(2).join(' ');
      if (!taskId || !text) {
        console.error('Usage: node trello-cli.js comment <TASK_ID> <text>');
        process.exit(1);
      }
      const card = await trelloService.findCardByName(taskId);
      if (!card) {
        console.error(`Card not found: ${taskId}`);
        process.exit(1);
      }
      await trelloService.addComment(card.id, text);
      console.log(`Added comment to ${taskId}`);
      break;
    }
    case 'list': {
      const cards = await trelloService.getBoardCards();
      console.log(`Total cards: ${cards.length}`);
      cards.forEach(c => console.log(`- ${c.name} [${c.idList}]`));
      break;
    }
    case 'done': {
      const taskId = args[1];
      if (!taskId) {
        console.error('Usage: node trello-cli.js done <TASK_ID>');
        process.exit(1);
      }
      const card = await trelloService.findCardByName(taskId);
      if (!card) {
        console.error(`Card not found: ${taskId}`);
        process.exit(1);
      }
      await trelloService.moveCard(card.id, trelloService.lists.DONE);
      console.log(`Moved ${taskId} to DONE`);
      break;
    }
    default:
      console.log(`
Trello CLI for Et3am

Usage:
  node trello-cli.js create <TASK_ID> <title> [list]  Create new card
  node trello-cli.js move <TASK_ID> <list>             Move card to list (BACKLOG/TODO/PROGRESS/DONE)
  node trello-cli.js comment <TASK_ID> <text>        Add comment to card
  node trello-cli.js done <TASK_ID>                  Move card to DONE
  node trello-cli.js list                             List all cards

Example:
  node trello-cli.js create ET3AM-004 "Push Notifications" TODO
      `);
  }
}

main().catch(console.error);