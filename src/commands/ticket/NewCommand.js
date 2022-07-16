const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const sourcebin = require('sourcebin_js');
const Discord = require("discord.js");

module.exports = class NewCommand extends BaseCommand {
  constructor() {
    super('new', 'ticket', []);
  }

  async run(client, message, args) {
    let channel3 = await db.fetch(`setuped_${message.guild.id}`);
    if (channel3 == null) {
      return message.reply("You have not yet setup the ticket system. Please do it by running `%setup`!");
    }
    if (channel3 != message.channel.id) {
      const embed = new Discord.MessageEmbed()
      .setDescription(`❌ You can only create a ticket in ticket-box channel.`)
      return message.reply(embed)
    }
    var prefix = db.fetch(`guildprefix_${message.guild.id}`);
    if (!prefix) {
      var prefix = "%";
    }
    if (message.author.bot) {
      return;
    }
    let user = message.author;
    var weekly = db.fetch(`messageem_${message.guild.id}_${user.id}`);
    if (weekly !== null && timeout - (Date.now() - weekly) > 0) {
      message.channel.send("You may only create 1 ticket in 6 minutes to avoid spam tickets.")
    } else {

      db.set(`messageem_${message.guild.id}_${user.id}`, Date.now());


      if (message.guild.channels.cache.find(channel => channel.name === `ticket-${message.author.id}`)) {
        const discord = new Discord.MessageEmbed()
        .setDescription('❌ You already have a ticket, please close your exsisting ticket first before opening a new one.')
        .setColor("ff0000")
        return message.reply(discord);
      }

      message.guild.channels.create(`ticket-${message.author.id}`, {
        permissionOverwrites: [
          {
            id: message.author.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: message.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: 'text',
      }).then(async channel => {
        message.reply(`You have successfully created a ticket! Please click on ${channel} to view your ticket.`);
        const embed = new Discord.MessageEmbed()
        .setTitle('Verification')
        .setDescription('Please answer the following questions to be verified. __Please include format in one sentance__: (EX. Female, 17, Muslim)\n1. What is your gender?\n2. How old are you?\n3. Are you a muslim or a non-muslim?\n\n**THESE QUESTIONS ARE FOR MUSLIM\'S ONLY!**\n1. Name the first Prophet.\n 2. Name the last Prophet\n 3. Name the 5 pillars of islam, in order.')
        .addField("When you are done, please close the ticket.", "Using %close.")
       .setColor("#ff0000")
        channel.send(embed);
        let logchannel = message.guild.channels.cache.find(channel => channel.name === `ticket-logs`)
        if (logchannel) {
          logchannel.send(`👉 Ticket ${message.author.id} created! Please click the following to view <#${channel.id}>.`);
         
        }
      });
    }
  }
}
