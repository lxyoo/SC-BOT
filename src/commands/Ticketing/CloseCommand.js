const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const sourcebin = require('sourcebin_js');
const { MessageEmbed } = require("discord.js");

module.exports = class CloseCommand extends BaseCommand {
  constructor() {
    super('close', 'ticket', []);
  }

  async run(client, message, args) {
    var prefix = db.fetch(`guildprefix_${message.guild.id}`);
    if (!prefix) {
      var prefix = "~";
    }

    if (message.channel.name.includes('ticket-')) {
      const member = message.guild.members.cache.get(message.channel.name.split('ticket-').join(''));

      if (!message.member.permissions.has('ADMINISTRATOR') && message.channel.name !== `ticket-${message.author.id}`) {
        const bozo = new MessageEmbed()
          .setDescription(`\`❌\` Hey, buddy. You __don't__ have this shiny permission: \n\`${requiredPermission}\`. \nYa can\'t touch this! (Close ticket)`)
          .setColor("RED")
          .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
        return message.channel.send({ embeds: [bozo] });
      }

      message.channel.messages.fetch().then(async (messages) => {
        const output = messages.reverse().map(m => `${new Date(m.createdAt).toLocaleString('en-US')} - ${m.author.tag}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`).join('\n');

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
          return message.channel.send('❌ An error occurred, please try again!');
        }

        const embed = new MessageEmbed()
          .setDescription(`Here\'s a transcript of your ticket!\n[\`📄 View\`](${response.url}) \nClick the **shiny**, *not* IP-Grabbing link to view.`)
          .setColor('GREEN');
        member.send({ embeds: [embed] });

        // Change permissions to prevent the member from viewing the ticket after closing it
        try {
          await message.channel.permissionOverwrites.edit(member.user, {
            VIEW_CHANNEL: false,
            SEND_MESSAGES: false,
            ATTACH_FILES: false,
            READ_MESSAGE_HISTORY: false,
          });

          let closed = new MessageEmbed()
            .setDescription(`\`✅\` Successfully closed ${message.channel.name}. This channel will be deleted in 3 seconds.`)
            .setColor("GREEN")

          await message.channel.send({ embeds: [closed] });

          // Delete the channel after 3 seconds
          setTimeout(() => {
            message.channel.delete().catch(console.error);
          }, 3000);

        }
        catch (e) {
          let idiot = new MessageEmbed()
            .setDescription('`❌` An error occurred. I bet you ruined it.')
            .setColor("RED")
          return message.channel.send({ embeds: [idiot] });
        }
      });
    }
    else {
      let dumbo = new MessageEmbed()
        .setDescription('`❌` Are you stupid, yo? You can\'t use this command here. Please use this command when you\'re closing a ticket, like a normal person.')
        .setColor("RED")
      return message.channel.send({ embeds: [dumbo] });
    }
  }
}