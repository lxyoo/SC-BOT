const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, Permissions } = require('discord.js');

module.exports = class AutoRoleSetupCommand extends BaseCommand {
  constructor() {
    super('autorolesetup', 'moderation', ['autorole', 'setup']);
  }

  async run(client, message, args) {
    if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
      return message.reply('You need the "Manage Roles" permission to use this command!');
    }

    const guild = message.guild;
    const forceFind = args.includes('--force') || args.includes('-f');
    
    try {
      // Step 1: Setup roles
      let supremeRole = guild.roles.cache.find(role => role.name === 'Supreme Mikos');
      let masterRole = guild.roles.cache.find(role => role.name === 'Master Baiter');
      let plebeianRole = guild.roles.cache.find(role => role.name === 'Plebeians');

      const setupEmbed = new MessageEmbed()
        .setTitle('🔧 Setting Up Auto-Role System...')
        .setDescription('Creating roles and configuring system...')
        .setColor('YELLOW')
        .setTimestamp();

      const statusMessage = await message.reply({ embeds: [setupEmbed] });

      // Create roles if they don't exist
      if (!supremeRole) {
        supremeRole = await guild.roles.create({
          name: 'Supreme Mikos',
          color: 'RED',
          reason: 'Auto-role setup'
        });
      }

      if (!masterRole) {
        masterRole = await guild.roles.create({
          name: 'Master Baiter',
          color: 'GREEN',
          reason: 'Auto-role setup'
        });
      }

      if (!plebeianRole) {
        plebeianRole = await guild.roles.create({
          name: 'Plebeians',
          color: 'GREY',
          reason: 'Auto-role setup'
        });
      }

      // Store auto-role settings
      if (!client.autoRoleSettings) {
        client.autoRoleSettings = new Map();
      }
      
      client.autoRoleSettings.set(guild.id, {
        supremeRoleId: supremeRole.id,
        masterRoleId: masterRole.id,
        plebeianRoleId: plebeianRole.id,
        enabled: true
      });

      // Step 2: Process existing members
      const processingEmbed = new MessageEmbed()
        .setTitle('🔄 Processing Existing Members...')
        .setDescription(forceFind ? 'Fetching all members from Discord...' : 'Processing cached members...')
        .setColor('YELLOW')
        .addField('Method:', forceFind ? 'Force Fetch (slower but complete)' : 'Cached Only (faster)')
        .setTimestamp();

      await statusMessage.edit({ embeds: [processingEmbed] });

      let members;
      let totalMembers = 0;

      if (forceFind) {
        try {
          members = await guild.members.fetch({ 
            withPresences: false,
            time: 30000 // 30 second timeout
          });
          totalMembers = members.size;
        } catch (error) {
          console.error('Force fetch failed, falling back to cached members:', error);
          members = guild.members.cache;
          totalMembers = members.size;
        }
      } else {
        members = guild.members.cache;
        totalMembers = members.size;
      }

      let processedCount = 0;
      let alreadyHasRole = 0;
      let specialRoles = 0;
      let bots = 0;
      let errors = 0;

      for (const [memberId, member] of members) {
        try {
          // Skip bots
          if (member.user.bot) {
            bots++;
            continue;
          }

          const hasSupreme = member.roles.cache.has(supremeRole.id);
          const hasMaster = member.roles.cache.has(masterRole.id);
          const hasPlebeian = member.roles.cache.has(plebeianRole.id);

          // Count special role holders
          if (hasSupreme || hasMaster) {
            specialRoles++;
            continue;
          }

          // Count those who already have Plebeian
          if (hasPlebeian) {
            alreadyHasRole++;
            continue;
          }

          // Assign Plebeian to those who need it
          await member.roles.add(plebeianRole, 'Auto-role setup assignment');
          processedCount++;
          
          // Rate limit protection
          await new Promise(resolve => setTimeout(resolve, 150));

        } catch (error) {
          console.error(`Error processing member ${member.user.tag}:`, error);
          errors++;
        }
      }

      // Step 3: Complete
      const completedEmbed = new MessageEmbed()
        .setTitle('✅ Auto-Role System Setup Complete!')
        .setDescription('System is now active and existing members have been processed!')
        .setColor('GREEN')
        .addField('🎭 Roles Setup:', `Supreme Mikos, Master Baiter, Plebeian`)
        .addField('🔄 Auto-Role Status:', 'Active for new members')
        .addField('📊 Processing Results:', `Found ${totalMembers} total members`)
        .addField('👑 Supreme Mikos/Master Baiter:', `${specialRoles} members`)
        .addField('😐 Already had Plebeian:', `${alreadyHasRole} members`)
        .addField('🆕 Newly assigned Plebeian:', `${processedCount} members`)
        .addField('🤖 Bots (skipped):', `${bots} members`)
        .addField('❌ Errors:', `${errors} members`)
        .addField('💡 System Logic:', 'New members without Supreme Mikos or Master Baiter will automatically get Plebeian')
        .setFooter('The hierarchy has been established and enforced!')
        .setTimestamp();

      await statusMessage.edit({ embeds: [completedEmbed] });

    } catch (error) {
      console.error('Error in auto-role setup:', error);
      message.reply('❌ An error occurred during setup. Please check bot permissions and try again.');
    }
  }
};