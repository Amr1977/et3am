#!/usr/bin/env node
import dotenv from 'dotenv';
import { trelloService } from '../src/services/trello.js';

dotenv.config({ path: './.env' });

const args = process.argv.slice(2);
const command = args[0];

async function main() {
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
      cards.forEach((c: any) => console.log(`- ${c.name} [${c.idList}]`));
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