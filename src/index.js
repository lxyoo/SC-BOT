const Discord = require("discord.js")
const { Client, Collection, MessageEmbed, MessageAttachment } = require('discord.js');
const ms = require("ms");
const { registerCommands, registerEvents } = require('./utils/registry');
const config = require('../slappey.json');
const cooldowns = new Collection();
const client = new Client();
client.snipes = new Map();
client.commands = new Collection()
const command = client.commands
client.queue = new Map();

(async () => {
  client.commands = new Map();
  client.events = new Map();
  client.prefix = config.prefix;
  await registerCommands(client, '../commands');
  await registerEvents(client, '../events');
  await client.login(config.token);
})();