const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js')

module.exports = class VerifyCommand extends BaseCommand {
  constructor() {
    super('verify', 'verification', []);
  }

 async run(client, message, args) {
    if (!message.guild.me.hasPermission("MANAGE_ROLES")) return message.channel.send("I am missing the proper role permission to remove roles, silly!")
    const envRole = message.guild.roles.cache.find(role => role.name === "Verified");
    const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    const embed = new Discord.MessageEmbed()
      .setTitle("✅ Verified")
      .setDescription(`${mentionedMember} has been verified in ${message.guild}.`)
      .setColor('#FF0000')
    if (!envRole) return message.channel.send('There is Verified role I can add!');
    message.channel.send(embed);
    await mentionedMember.roles.add(envRole.id).catch(err => message.channel.send(`Unable to add this role due to an error: ${err}`));
  }
}
