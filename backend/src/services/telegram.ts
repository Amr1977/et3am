import { Telegraf, Markup } from 'telegraf';
import { pool } from '../database';

console.log('Loading Telegram bot, env keys:', Object.keys(process.env).filter(k => k.includes('TELEGRAM')));

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN not configured - Telegram notifications disabled');
} else {
  console.log('TELEGRAM_BOT_TOKEN loaded, length:', TELEGRAM_BOT_TOKEN.length);
}

export const bot = TELEGRAM_BOT_TOKEN ? new Telegraf(TELEGRAM_BOT_TOKEN) : null;

export async function sendTelegramMessage(chatId: string, message: string) {
  if (!bot) return;
  
  try {
    await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Telegram send error:', error);
  }
}

export async function notifyNewDonation(donation: any) {
  if (!bot) return;
  
  var message = '🎁 *New Donation Available!*\n\n*' + donation.title + '*\n🍽️ ' + donation.food_type + '\n📦 ' + donation.quantity + ' ' + donation.unit + '\n📍 Location shared on reservation\n\nView details: https://foodshare777.web.app/donations/' + donation.id;

  try {
    var result = await pool.query(
      'SELECT telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL'
    );
    
    for (var row of result.rows) {
      await sendTelegramMessage(row.telegram_chat_id, message);
    }
  } catch (error) {
    console.error('New donation notification error:', error);
  }
}

export async function notifyReservation(donation: any, userName: string) {
  if (!bot) return;
  
  var message = '🔔 *Reservation Confirmed!*\n\n*' + donation.title + '*\n📦 ' + donation.quantity + ' ' + donation.unit + '\n🔑 Hash: `' + donation.hash_code + '`\n\nShow this hash code when picking up the donation.\n\nThank you for being part of the solution! 🙌';

  try {
    await sendTelegramMessage(donation.reserved_by_telegram, message);
  } catch (error) {
    console.error('Reservation notification error:', error);
  }
}

export function setupBotCommands() {
  if (!bot) return;
  
  bot.start(function(ctx: any) {
    var welcome = '🕌 *Welcome to Et3am!*\n\nYour daily bridge between those who have and those who need.\n\n🍽️ *How it works:*\n• Browse available food donations near you\n• Reserve a meal to help someone in need\n• Pick up and deliver the donation\n\n📍 Available donations: https://foodshare777.web.app/donations\n\nWhat would you like to do?';

    ctx.reply(welcome, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🍽️ Browse Donations', url: 'https://foodshare777.web.app/donations' }],
          [{ text: '📋 My Reservations', url: 'https://foodshare777.web.app/my-reservations' }],
          [{ text: '💝 Donate Food', url: 'https://foodshare777.web.app/donations/new' }],
        ]
      }
    });
  });

  bot.help(function(ctx: any) {
    ctx.reply('📚 *Help*\n\n/start - Welcome message\n/donations - Browse available donations\n/myreservations - Your reservations\n/help - Show this help\n\n*Quick Links:*\n🔗 https://foodshare777.web.app', { parse_mode: 'Markdown' });
  });

  bot.command('donations', function(ctx: any) {
    ctx.reply('🍽️ Browse available donations:\n\n🔗 https://foodshare777.web.app/donations', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'View Donations', url: 'https://foodshare777.web.app/donations' }]
        ]
      }
    });
  });

  bot.command('myreservations', function(ctx: any) {
    ctx.reply('📋 Your reservations:\n\n🔗 https://foodshare777.web.app/my-reservations', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'My Reservations', url: 'https://foodshare777.web.app/my-reservations' }]
        ]
      }
    });
  });
}
