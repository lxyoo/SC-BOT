const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const sourcebin = require('sourcebin_js');
const { MessageEmbed } = require("discord.js");

module.exports = class DeleteCommand extends BaseCommand {
  constructor() {
    super('delete', 'ticket', []);
  }

  async run(client, message, args) {
    if (!message.member.permissions.has("MANAGE_SERVER")) {
      const bozo = new MessageEmbed()
        .setDescription(`\`❌\` Hey, buddy. You __don't__ have this shiny permission: \n\`${requiredPermission}\`.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [bozo] });
      return;
    }
    var prefix = db.fetch(`guildprefix_${message.guild.id}`);
    if (!prefix) {
      var prefix = "~";
    }

    if (message.channel.name.includes('ticket-')) {
      message.channel.delete();
    }
    else {
      const neew = new MessageEmbed()
        .setTitle('\`❌\` Nani! You cannot use this command here. Please use this when you want to delete a ticket...')
      return message.reply({ embeds: [neew] });
    }

  }
}