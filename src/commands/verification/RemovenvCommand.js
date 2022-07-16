const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js')

module.exports = class RemovenvCommand extends BaseCommand {
  constructor() {
    super('removenv', 'verification', []);
  }

  async run(client, message, args) {
    //$removenv @member, ID
    if (!message.guild.me.hasPermission("MANAGE_ROLES")) return message.channel.send("I am missing the proper role permission to remove roles, silly!")
    const envRole = message.guild.roles.cache.find(role => role.name === "Non-Verified");
    const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    const embed = new Discord.MessageEmbed()
      .setTitle("❌ NV Removed!")
      .setDescription(`${mentionedMember}, you are no longer registered as a Non-Verified.`)
      .setColor('#FF0000')
    if (!envRole) return message.channel.send('There is no NV role I can remove!');
    message.channel.send(embed);
    await mentionedMember.roles.remove(envRole.id).catch(err => message.channel.send(`Unable to remove this role due to an error: ${err}`));
  }
}