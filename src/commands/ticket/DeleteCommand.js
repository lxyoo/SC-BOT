const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const sourcebin = require('sourcebin_js');
const Discord = require("discord.js");

module.exports = class DeleteCommand extends BaseCommand {
  constructor() {
    super('delete', 'ticket', []);
  }

  async run(client, message, args) {
    if (!message.member.hasPermission("MANAGE_SERVER")) {
      return;
    }
    var prefix = db.fetch(`guildprefix_${message.guild.id}`);
    if (!prefix) {
      var prefix = "%";
    }

    if (message.channel.name.includes('ticket-')) {
      message.channel.delete();
    }
    else {
      const neew = new Discord.MessageEmbed()
      .setTitle('❌ You cannot use this command here. Please use this command when you want to delete a ticket.')
      return message.reply(neew);
    }

  }
}
