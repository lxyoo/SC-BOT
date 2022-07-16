const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const sourcebin = require('sourcebin_js');
const Discord = require("discord.js");

module.exports = class CloseCommand extends BaseCommand {
  constructor() {
    super('close', 'ticket', []);
  }

  async run(client, message, args) {
    var prefix = db.fetch(`guildprefix_${message.guild.id}`);
    if (!prefix) {
      var prefix = "%";
    }

    if (message.channel.name.includes('ticket-')) {
      const member = message.guild.members.cache.get(message.channel.name.split('ticket-').join(''));
      if (message.member.hasPermission('ADMINISTRATOR') || message.channel.name === `ticket-${message.author.id}`) {
        message.channel.messages.fetch().then(async (messages) => {
          const output = messages.array().reverse().map(m => `${new Date(m.createdAt).toLocaleString('en-US')} - ${m.author.tag}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`).join('\n');

          let response;
          try {
            response = await sourcebin.create([
              {
                name: ' ',
                content: output,
                languageId: 'text',
              },
            ], {
              title: `Chat transcript for ${message.channel.name}`,
              description: ' ',
              color: '#ff0000',
            });
          }
          catch (e) {
            return message.channel.send('An error occurred, please try again!');
          }

          const embed = new Discord.MessageEmbed()
            .setDescription(`[\`📄 View\`](${response.url})`)
            .setColor('#ff0000');
          member.send('Here is a transcript of your ticket, please click the link below to view the transcript', embed);
        }).then(() => {
          try {
            message.channel.updateOverwrite(member.user, {
              VIEW_CHANNEL: false,
              SEND_MESSAGES: false,
              ATTACH_FILES: false,
              READ_MESSAGE_HISTORY: false,
            }).then(() => {
              message.channel.send(`✅ Successfully closed ${message.channel}.`);
            });
          }
          catch (e) {
            return message.channel.send('❌ An error occurred, please try again!');
          }
        });
      }
    }
    else {
      return message.reply('❌ You cannot use this command here. Please use this command when you\'re closing a ticket.');
    }

  }
}