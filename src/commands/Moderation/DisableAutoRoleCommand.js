const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class DisableAutoRoleCommand extends BaseCommand {
  constructor() {
    super('disable-auto-role', 'moderation', ['disableautorole']);
  }

  async run(client, message, args) {
    if (!message.member.permissions.has('MANAGE_ROLES')) {
      return message.reply('You need the "Manage Roles" permission to use this command!');
    }

    if (!client.autoRoleGuilds || !client.autoRoleGuilds.has(message.guild.id)) {
      return message.reply('Auto-role system is not active in this server!');
    }

    client.autoRoleGuilds.delete(message.guild.id);

    const embed = new MessageEmbed()
      .setTitle('Auto-Role System Disabled')
      .setDescription('Auto-role assignment for new members has been disabled.')
      .setColor('#FF0000')
      .addField('Status:', 'Disabled')
      .addField('Note:', 'Existing roles will remain unchanged')
      .setFooter('Use /auto-role-setup to re-enable')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};