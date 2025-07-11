const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class CheckRolesCommand extends BaseCommand {
  constructor() {
    super('check-roles', 'moderation', ['checkroles', 'rolecheck']);
  }

  async run(client, message, args) {
    if (!message.member.permissions.has('MANAGE_ROLES')) {
      return message.reply('You need the "Manage Roles" permission to use this command!');
    }
    
    if (!client.autoRoleSettings || !client.autoRoleSettings.has(guild.id)) {
      return message.reply('❌ Auto-role system is not set up in this server. Use `/auto-role-setup` to enable it.');
    }

    const settings = client.autoRoleSettings.get(guild.id);
    
    const supremeRole = guild.roles.cache.get(settings.supremeRoleId);
    const masterRole = guild.roles.cache.get(settings.masterRoleId);
    const plebeianRole = guild.roles.cache.get(settings.plebeianRoleId);

    // Count current role holders
    const supremeCount = supremeRole ? supremeRole.members.size : 0;
    const masterCount = masterRole ? masterRole.members.size : 0;
    const plebeianCount = plebeianRole ? plebeianRole.members.size : 0;

    const embed = new MessageEmbed()
      .setTitle('📊 Auto-Role System Status')
      .setDescription('Current system configuration and statistics:')
      .setColor(settings.enabled ? 'GREEN' : 'RED')
      .addField('🔧 System Status:', settings.enabled ? '✅ Enabled' : '❌ Disabled')
      .addField('👑 Supreme Mikos Role:', supremeRole ? `✅ ${supremeRole.name} (${supremeCount} members)` : '❌ Not found')
      .addField('🎣 Master Baiter Role:', masterRole ? `✅ ${masterRole.name} (${masterCount} members)` : '❌ Not found')
      .addField('😐 Plebeian Role:', plebeianRole ? `✅ ${plebeianRole.name} (${plebeianCount} members)` : '❌ Not found')
      .addField('🤖 Bot Permissions:', message.guild.me.permissions.has('MANAGE_ROLES') ? '✅ Can manage roles' : '❌ Missing MANAGE_ROLES permission')
      .addField('📈 Total Managed:', `${supremeCount + masterCount + plebeianCount} members with roles`)
      .addField('💡 How it works:', 'New members automatically get Plebeian unless they have Supreme Mikos or Master Baiter')
      .setFooter('Use /auto-role-setup to reconfigure or /auto-role-setup --force to force-fetch all members')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};