const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const sourcebin = require('sourcebin_js');
const { MessageEmbed } = require("discord.js");

module.exports = class NewCommand extends BaseCommand {
  constructor() {
    super('new', 'Ticketing', []);
  }

  async run(client, message, args) {
    let channel3 = await db.fetch(`setuped_${message.guild.id}`);
    if (channel3 == null) {
      const embed1 = new MessageEmbed()
        .setDescription(`\`❌\` Please setup the ticket system`)
      return message.reply({ embeds: [embed1] });
    }

    if (channel3 != message.channel.id) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` You can only create a ticket in the ticket-box channel.`)
      return message.reply({ embeds: [embed] })
    }

    var prefix = db.fetch(`guildprefix_${message.guild.id}`);
    if (!prefix) {
      prefix = "~";
    }

    if (message.author.bot) return;

    const user = message.author;

    // Define the timeout (6 minutes in milliseconds)
    const timeout = 10 * 1000; // 6 minutes in milliseconds

    var weekly = db.fetch(`messageem_${message.guild.id}_${user.id}`);

    if (weekly !== null && timeout - (Date.now() - weekly) > 0) {
      const timeLeft = Math.round((timeout - (Date.now() - weekly)) / 1000); // Remaining time in minutes
      message.channel.send(`You may only create 1 ticket in 6 minutes to avoid spam tickets. Please wait ${timeLeft} more minute(s).`);
    } else {

      db.set(`messageem_${message.guild.id}_${user.id}`, Date.now());

      if (message.guild.channels.cache.find(channel => channel.name === `ticket-${message.author.id}`)) {
        const discord = new MessageEmbed()
          .setDescription('\`❌\` You already have a ticket. Close your existing ticket first before opening a new one.')
        return message.reply({ embeds: [discord] });
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
        const embed = new MessageEmbed()
          .setDescription('`📞`  Admins will be with you shortly.')
        channel.send({ embeds: [embed] });

        const logchannel = message.guild.channels.cache.find(channel => channel.name === `ticket-logs`);
        if (logchannel) {
          logchannel.send(`Ticket ${message.author.id} created! Please click the following to view <#${channel.id}>.`);
        }
      });
    }
  }
}
