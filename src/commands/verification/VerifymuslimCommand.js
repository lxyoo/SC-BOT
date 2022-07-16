const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require("discord.js")

module.exports = class VerifymuslimCommand extends BaseCommand {
  constructor() {
    super('verifymuslim', 'verification', []);
  }

  async run(client, message, args) {
    if (!message.guild.me.hasPermission("MANAGE_ROLES")) return message.channel.send("I am missing the proper role permission to remove roles, silly!")
    const envRole = message.guild.roles.cache.find(role => role.name === "Muslim -  مسلم");
    const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    const embed = new Discord.MessageEmbed()
      .setTitle("🤝 Muslim Role Given!")
      .setDescription(`${mentionedMember} has been given the Muslim role in ${message.guild}.`)
      .setColor('#FF0000')
    if (!envRole) return message.channel.send('There is no Muslim role I can add!');
    message.channel.send(embed);
    await mentionedMember.roles.add(envRole.id).catch(err => message.channel.send(`Unable to add this role due to an error: ${err}`));
  }
}