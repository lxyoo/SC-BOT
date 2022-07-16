const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const sourcebin = require('sourcebin_js');
const Discord = require("discord.js");

module.exports = class RemoveCommand extends BaseCommand {
  constructor() {
    super('remove', 'ticket', []);
  }

  async run(client, message, args) {
    var prefix = db.fetch(`guildprefix_${message.guild.id}`);
    if (!prefix) {
      var prefix = "%";
    }
    if (!message.member.hasPermission("ADMINISTRATOR")) {
      return;
    }
    if (message.channel.name.includes('ticket-')) {
      const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(x => x.user.username === args.slice(0).join(' ') || x.user.username === args[0]);
      if (!member) {
        const embed = new Discord.MessageEmbed()
          .setDescription(`❌ Incorrect usage. Correct usage: %remove <member>`)
          .setColor("#ff0000")
        return message.channel.send(embed);
      }
      try {
        message.channel.updateOverwrite(member.user, {
          VIEW_CHANNEL: false,
          SEND_MESSAGES: false,
          ATTACH_FILES: false,
          READ_MESSAGE_HISTORY: false,
        }).then(() => {
          message.channel.send(`✅ Successfully removed ${member} from ${message.channel}!`);
        });
      }
      catch (e) {
        const embed = new Discord.MessageEmbed()
          .setDescription('❌ An error occurred, please try again!')
          .setColor("#ff0000")
        return message.channel.send(embed);
      }
    }
  }
}