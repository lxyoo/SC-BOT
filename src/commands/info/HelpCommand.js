const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js')

module.exports = class HelpCommand extends BaseCommand {
  constructor() {
    super('help', 'info', []);
  }

 async run(client, message, args) {
    const embed = new Discord.MessageEmbed()
    .setTitle('Salam Community Bot\'s Info')
    .addField("**📩 TICKETING SYSTEM**", "`add` `close` `delete` `new` `open` `remove` `setup`")
    .addField("**✅ VERIFYING SYSTEM**", "`manualv` `verify`")
    .setColor("#ff0000")
    message.channel.send(embed)
  }
}