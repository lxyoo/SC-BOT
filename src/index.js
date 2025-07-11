const { Client, Intents, MessageEmbed } = require('discord.js');
const { registerCommands, registerEvents } = require('./utils/registry');
const config = require('../slappey.json');
require('dotenv').config();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.MESSAGE_CONTENT
  ]
});

// Initialize blacklist Map
client.blacklistedUsers = new Map();

// Load blacklist from database on ready
client.once('ready', async () => {
  console.log(`${client.user.tag} is online!`);
  
  // Load blacklist from database
  try {
    const db = require('quick.db');
    const savedBlacklist = await db.get('blacklistedUsers') || {};
    
    // Convert saved object back to Map with proper date objects
    for (const [userId, data] of Object.entries(savedBlacklist)) {
      client.blacklistedUsers.set(userId, {
        ...data,
        blacklistedAt: new Date(data.blacklistedAt) // Convert back to Date object
      });
    }
    
    console.log(`Loaded ${client.blacklistedUsers.size} blacklisted users.`);
  } catch (error) {
    console.error('❌ Error loading blacklist:', error);
    client.blacklistedUsers = new Map();
  }
});

// Function to save blacklist to database
client.saveBlacklist = async function() {
  try {
    const db = require('quick.db');
    const blacklistObj = Object.fromEntries(client.blacklistedUsers);
    await db.set('blacklistedUsers', blacklistObj);
    console.log('Blacklist saved to database!');
  } catch (error) {
    console.error('❌ Error saving blacklist:', error);
  }
};

// Auto-save blacklist every 5 minutes
setInterval(() => {
  if (client.blacklistedUsers.size > 0) {
    client.saveBlacklist();
  }
}, 300000); // 5 minutes

// Save blacklist on process exit
process.on('SIGINT', async () => {
  console.log('\nSaving blacklist before shutdown...');
  await client.saveBlacklist();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nSaving blacklist before shutdown...');
  await client.saveBlacklist();
  process.exit(0);
});

(async () => {
  client.commands = new Map();
  client.events = new Map();
  client.prefix = config.prefix;
  await registerCommands(client, '../commands');
  await registerEvents(client, '../events');
  await client.login(config.token);
})();