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

  async syncFromTodo(todoContent) {
    const tasks = [];
    const inProgressTasks = [];
    const doneTasks = [];
    
    const lines = todoContent.split('\n');
    let currentTask = null;
    
    for (const line of lines) {
      const inProgressMatch = line.match(/^\- \[P\]\s+(.+)$/);
      const doneMatch = line.match(/^\- \[x\]\s+(.+)$/);
      const pendingMatch = line.match(/^\- \[\]\s+(.+)$/);
      
      if (inProgressMatch) {
        currentTask = { id: null, title: inProgressMatch[1].trim(), status: 'IN_PROGRESS' };
        inProgressTasks.push(currentTask);
      } else if (doneMatch) {
        currentTask = { id: null, title: doneMatch[1].trim(), status: 'DONE' };
        doneTasks.push(currentTask);
      } else if (pendingMatch) {
        currentTask = { id: null, title: pendingMatch[1].trim(), status: 'PENDING' };
        tasks.push(currentTask);
      }
    }
    
    return { pending: tasks, inProgress: inProgressTasks, done: doneTasks };
  },

  async updateTodoFromTrello(todoContent, boardCards) {
    const lines = todoContent.split('\n');
    const doneListId = LIST_IDS.DONE;
    const progressListId = LIST_IDS.PROGRESS;
    
    const doneCards = boardCards.filter(c => c.idList === doneListId);
    const progressCards = boardCards.filter(c => c.idList === progressListId);
    
    const doneTitles = doneCards.map(c => {
      const clean = c.name.replace(/^(ET3AM-\d+|BUG-\d+):\s*/, '').toLowerCase();
      return { original: c.name, clean, keywords: clean.split(/\s+/).filter(w => w.length > 3).slice(0, 5) };
    });
    
    const progressTitles = progressCards.map(c => {
      const clean = c.name.replace(/^(ET3AM-\d+|BUG-\d+):\s*/, '').toLowerCase();
      return { original: c.name, clean, keywords: clean.split(/\s+/).filter(w => w.length > 3).slice(0, 5) };
    });
    
    const newLines = [];
    
    for (const line of lines) {
      let newLine = line;
      
      if (line.match(/^\s*-\s*\[\s*\]\s+/)) {
        const titleMatch = line.match(/^\s*-\s*\[\s*\]\s+(.+)$/);
        if (titleMatch) {
          const title = titleMatch[1].toLowerCase();
          const titleKeywords = title.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
          
          let isDone = false;
          let isProgress = false;
          
          for (const done of doneTitles) {
            const matchCount = titleKeywords.filter(kw => done.clean.includes(kw)).length;
            const reverseMatch = done.keywords.filter(kw => title.includes(kw)).length;
            if (matchCount >= 2 || reverseMatch >= 2 || title.includes(done.clean.substring(0, 30)) || done.clean.includes(title.substring(0, 30))) {
              isDone = true;
              break;
            }
          }
          
          for (const prog of progressTitles) {
            const matchCount = titleKeywords.filter(kw => prog.clean.includes(kw)).length;
            const reverseMatch = prog.keywords.filter(kw => title.includes(kw)).length;
            if (matchCount >= 2 || reverseMatch >= 2 || title.includes(prog.clean.substring(0, 30)) || prog.clean.includes(title.substring(0, 30))) {
              isProgress = true;
              break;
            }
          }
          
          if (isDone) {
            newLine = line.replace(/\[\s*\]/, '[x]');
          } else if (isProgress) {
            newLine = line.replace(/\[\s*\]/, '[P]');
          }
        }
      }
      
      newLines.push(newLine);
    }
    
    return newLines.join('\n');
  },

  async updateCardName(cardId, newName) {
    return trelloRequest(`/cards/${cardId}`, 'PUT', { name: newName });
  },

  async addLabel(cardId, labelId) {
    return trelloRequest(`/cards/${cardId}/idLabels`, 'POST', { value: labelId });
  },

  async getLabels() {
    return trelloRequest(`/boards/${TRELLO_BOARD_SHORT_ID}/labels`);
  },

  async fixCardIds(todoContent) {
    const boardCards = await this.getBoardCards();
    const labels = await this.getLabels();
    
    const labelMap = {};
    for (const label of labels) {
      labelMap[label.name.toUpperCase()] = label.id;
    }
    
    const lines = todoContent.split('\n');
    
    const extractId = (line) => {
      const match = line.match(/^\- \[.\]\s+(ET3AM-\d+|BUG-\d+):\s*(.+)/);
      return match ? { id: match[1], title: match[2] } : null;
    };
    
    const todoTasks = [];
    for (const line of lines) {
      const task = extractId(line);
      if (task) todoTasks.push(task);
    }
    
    const maxEt3am = todoTasks.filter(t => t.id.startsWith('ET3AM-'))
      .map(t => parseInt(t.id.replace('ET3AM-', '')))
      .reduce((max, n) => Math.max(max, n), 0);
    
    const maxBug = todoTasks.filter(t => t.id.startsWith('BUG-'))
      .map(t => parseInt(t.id.replace('BUG-', '')))
      .reduce((max, n) => Math.max(max, n), 0);
    
    let nextEt3am = maxEt3am + 1;
    let nextBug = maxBug + 1;
    
    const updates = [];
    for (const card of boardCards) {
      const hasId = card.name.match(/^(ET3AM-\d+|BUG-\d+):/);
      if (!hasId) {
        const isBug = card.name.toLowerCase().includes('bug') || 
                      card.name.toLowerCase().includes('error') ||
                      card.name.toLowerCase().includes('fix');
        
        let newId, labelKey;
        if (isBug) {
          newId = `BUG-${nextBug++}`;
          labelKey = 'BUG';
        } else {
          newId = `ET3AM-${nextEt3am++}`;
          labelKey = 'FEATURE';
        }
        
        const newName = `${newId}: ${card.name}`;
        updates.push({ card, newName, taskId: newId, labelKey });
      }
    }
    
    return { cardsWithoutId: updates, labelMap };
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
    case 'sync': {
      const fs = require('fs');
      const todoPath = path.join(__dirname, '..', 'TODO.md');
      if (!fs.existsSync(todoPath)) {
        console.error('TODO.md not found');
        process.exit(1);
      }
      const todoContent = fs.readFileSync(todoPath, 'utf-8');
      const { pending, inProgress, done } = await trelloService.syncFromTodo(todoContent);
      
      const boardCards = await trelloService.getBoardCards();
      const progressListId = LIST_IDS.PROGRESS;
      const doneListId = LIST_IDS.DONE;
      const progressCards = boardCards.filter(c => c.idList === progressListId);
      const doneCards = boardCards.filter(c => c.idList === doneListId);
      
      console.log('\n=== SYNC REPORT ===\n');
      console.log('TODO.md Status:');
      console.log(`  Pending: ${pending.length}`);
      console.log(`  In Progress: ${inProgress.length}`);
      console.log(`  Done: ${done.length}`);
      console.log('\nTrello Status:');
      console.log(`  PROGRESS: ${progressCards.length}`);
      console.log(`  DONE: ${doneCards.length}`);
      
      console.log('\n--- Fixing cards without IDs ---');
      const { cardsWithoutId, labelMap } = await trelloService.fixCardIds(todoContent);
      const dryRun = args[1] !== '--apply';
      
      for (const update of cardsWithoutId) {
        console.log(`  Would rename: "${update.card.name}" -> "${update.newName}"`);
        if (!dryRun) {
          await trelloService.updateCardName(update.card.id, update.newName);
          
          const taskId = update.taskId;
          if (taskId.startsWith('ET3AM-')) {
            const labelId = labelMap['FEATURE'];
            if (labelId) {
              await trelloService.addLabel(update.card.id, labelId);
            }
          } else if (taskId.startsWith('BUG-')) {
            const labelId = labelMap['BUG'];
            if (labelId) {
              await trelloService.addLabel(update.card.id, labelId);
            }
          }
          console.log(`    -> Fixed!`);
        }
      }
      
      console.log('\n--- Moving tasks to correct lists ---');
      
      for (const task of inProgress) {
        const found = progressCards.find(c => c.name.toLowerCase().includes(task.title.toLowerCase().substring(0, 20)));
        if (!found) {
          const possibleCard = boardCards.find(c => c.name.toLowerCase().includes(task.title.toLowerCase().substring(0, 20)));
          if (possibleCard) {
            console.log(`  Would move to PROGRESS: "${task.title}" (${possibleCard.id})`);
            if (!dryRun) {
              await trelloService.moveCard(possibleCard.id, progressListId);
              console.log(`    -> Moved!`);
            }
          }
        }
      }
      
      for (const task of done) {
        const found = doneCards.find(c => c.name.toLowerCase().includes(task.title.toLowerCase().substring(0, 20)));
        if (!found) {
          const possibleCard = boardCards.find(c => c.name.toLowerCase().includes(task.title.toLowerCase().substring(0, 20)));
          if (possibleCard && possibleCard.idList !== doneListId) {
            console.log(`  Would move to DONE: "${task.title}" (${possibleCard.id})`);
            if (!dryRun) {
              await trelloService.moveCard(possibleCard.id, doneListId);
              console.log(`    -> Moved!`);
            }
          }
        }
      }
      
      console.log('\n--- Syncing Trello status to TODO.md ---');
      const updatedTodo = await trelloService.updateTodoFromTrello(todoContent, boardCards);
      
      console.log(`  TODO.md has ${pending.length} pending, ${inProgress.length} in progress, ${done.length} done`);
      console.log(`  Trello has ${progressCards.length} in PROGRESS, ${doneCards.length} in DONE`);
      
      const changedLines = [];
      const oldLines = todoContent.split('\n');
      const newLines = updatedTodo.split('\n');
      
      for (let i = 0; i < oldLines.length; i++) {
        if (oldLines[i] !== newLines[i]) {
          changedLines.push({ line: i + 1, old: oldLines[i], new: newLines[i] });
        }
      }
      
      if (changedLines.length > 0) {
        console.log(`  Found ${changedLines.length} tasks to update:`);
        for (const change of changedLines.slice(0, 10)) {
          console.log(`    Line ${change.line}: ${change.old.substring(0, 40)} -> ${change.new.substring(0, 40)}`);
        }
        if (changedLines.length > 10) {
          console.log(`    ... and ${changedLines.length - 10} more`);
        }
        
        if (!dryRun) {
          fs.writeFileSync(todoPath, updatedTodo, 'utf-8');
          console.log('  -> TODO.md updated!');
        }
      } else {
        console.log('  No changes needed in TODO.md');
      }
      
      if (dryRun) {
        console.log('\n** Dry run only. Add --apply to actually apply all changes. **');
      }
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
  node trello-cli.js sync                            Sync TODO.md with Trello

Example:
  node trello-cli.js create ET3AM-004 "Push Notifications" TODO
      `);
  }
}

main().catch(console.error);