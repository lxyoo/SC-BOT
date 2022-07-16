const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js')

module.exports = class ManualvCommand extends BaseCommand {
  constructor() {
    super('manualv', 'verify', []);
  }

  async run(client, message, args) {
    if (!message.guild.me.hasPermission("MANAGE_ROLES")) return message.channel.send("I am missing the proper role permission to verify!");

    const role = message.guild.roles.cache.find(role => role.name === "Verified")
    let guild = message.guild.name

    const embed = new Discord.MessageEmbed()
      .setTitle('✅ Verified!')
      .setDescription(`${message.author} has been verified in **${guild}**.`)
      .setColor('#ff0000')
    message.channel.send(embed);
    await message.member.roles.add(role).catch(err => console.log(role));
  }
}