const BaseEvent = require('../../utils/structures/BaseEvent');
const UserTracker = require('../../utils/userTracking');
const { MessageEmbed } = require('discord.js');

module.exports = class MessageEvent extends BaseEvent {
  constructor() {
    super('messageCreate');
  }

  async run(client, message) {
    if (message.author.bot) return;

    // Update user activity tracking (for all messages)
    if (message.guild) {
      await this.updateUserTracking(message);
    }

    // Handle commands
    if (message.guild) {
      await this.handleCommands(client, message);
    }
  }

  async updateUserTracking(message) {
    try {
      // Update user activity
      await UserTracker.updateUserActivity(message.author.id, {
        type: 'message',
        channel: message.channel.id,
        guild: message.guild.id
      });
      
      // Check for file uploads
      if (message.attachments.size > 0) {
        await UserTracker.updateFileUpload(message.author.id);
      }
      
      // Check for links
      if (message.content.includes('http')) {
        const userData = await require('quick.db').get(`user_${message.author.id}`) || {};
        userData.linksShared = (userData.linksShared || 0) + 1;
        await require('quick.db').set(`user_${message.author.id}`, userData);
      }

      // Track popular channels
      const userData = await require('quick.db').get(`user_${message.author.id}`) || {};
      userData.channelActivity = userData.channelActivity || {};
      userData.channelActivity[message.channel.id] = (userData.channelActivity[message.channel.id] || 0) + 1;
      
      // Update favorite channel
      const favoriteChannelId = Object.keys(userData.channelActivity).reduce((a, b) => 
        userData.channelActivity[a] > userData.channelActivity[b] ? a : b
      );
      userData.favoriteChannel = message.guild.channels.cache.get(favoriteChannelId)?.name || 'Unknown';
      
      await require('quick.db').set(`user_${message.author.id}`, userData);
    } catch (error) {
      console.error('Error updating user tracking:', error);
    }
  }

  async handleCommands(client, message) {
    const prefix = client.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Find command
    const command = client.commands.get(commandName) ||
      Array.from(client.commands.values()).find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    // ✅ CHECK IF USER IS BLACKLISTED
    if (client.blacklistedUsers?.has(message.author.id)) {
      const blacklistData = client.blacklistedUsers.get(message.author.id);
      const embed = new MessageEmbed()
        .setTitle('🚫 Access Denied')
        .setDescription('You are blacklisted from using this bot!')
        .setColor('#FF6B6B')
        .addFields([
          { name: 'Reason', value: blacklistData.reason, inline: true },
          { name: 'Blacklisted', value: blacklistData.blacklistedAt.toLocaleDateString(), inline: true },
          { name: 'By', value: `<@${blacklistData.blacklistedBy}>`, inline: true }
        ])
  
      return message.reply({ embeds: [embed] });
    }

    try {
      // Update command usage tracking
      await UserTracker.updateCommandUsage(message.author.id, commandName);
      
      // Execute command
      await command.run(client, message, args);
    } catch (error) {
      console.error('Command execution error:', error);
      
      const errorEmbed = new MessageEmbed()
        .setDescription('`❌` Error | Something went wrong.. It\'s all your fault.')
        .setColor('#FF6B6B')
        .addFields(
          { name: 'Command', value: commandName, inline: true },
          { name: 'Error', value: error.message.slice(0, 100), inline: true }
        )
        .setTimestamp();

      message.reply({ embeds: [errorEmbed] }).catch(() => {
        // Fallback to simple text if embed fails
        message.reply('Something went wrong.. I know it\'s your fault.');
      });
    }
  }
};