const BaseEvent = require('../utils/structures/BaseEvent');

module.exports = class GuildMemberAddEvent extends BaseEvent {
  constructor() {
    super('guildMemberAdd');
  }

  async run(client, member) {
    // Check if auto-role is enabled for this guild
    if (!client.autoRoleGuilds || !client.autoRoleGuilds.has(member.guild.id)) {
      return;
    }

    const autoRoleData = client.autoRoleGuilds.get(member.guild.id);
    
    try {
      // Get the roles
      const supremeRole = member.guild.roles.cache.get(autoRoleData.supremeRoleId);
      const masterRole = member.guild.roles.cache.get(autoRoleData.masterRoleId);
      const plebeianRole = member.guild.roles.cache.get(autoRoleData.plebeianRoleId);

      // Skip if roles don't exist
      if (!plebeianRole) return;

      // Wait a moment to ensure member is fully loaded
      setTimeout(async () => {
        try {
          // Check if member has special roles (shouldn't happen for new members, but just in case)
          const hasSupreme = member.roles.cache.has(autoRoleData.supremeRoleId);
          const hasMaster = member.roles.cache.has(autoRoleData.masterRoleId);

          // If they don't have either special role, give them Plebeian
          if (!hasSupreme && !hasMaster) {
            await member.roles.add(plebeianRole);
            console.log(`Auto-assigned Plebeian role to ${member.user.tag}`);
          }
        } catch (error) {
          console.error(`Error auto-assigning role to ${member.user.tag}:`, error);
        }
      }, 1000); // 1 second delay

    } catch (error) {
      console.error('Error in guildMemberAdd event:', error);
    }
  }
};