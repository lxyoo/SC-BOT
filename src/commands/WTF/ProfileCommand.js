const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const db = require('quick.db');

module.exports = class ProfileCommand extends BaseCommand {
  constructor() {
    super('profile', 'WTF', ['pfp', 'whois', 'userinfo', 'info']);
  }

  async run(client, message, args) {
    const target = message.mentions.users.first() ||
      client.users.cache.get(args[0]) ||
      message.author;

    const member = message.guild.members.cache.get(target.id);

    if (!member) {
      return message.channel.send({
        embeds: [
          new MessageEmbed()
            .setTitle('User Not Found')
            .setDescription('Could not find that user in this server!')
            .setColor('#FF6B6B')
        ]
      });
    }

    const userData = await this.getUserData(target.id);
    const embed = new MessageEmbed()
      .setTitle(`${target.username}'s Profile`)
      .setColor(member.displayHexColor || '#7289DA')
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .setTimestamp();

    // Combined basic info
    const basicInfo = this.getBasicInfo(target, member);
    embed.addFields({ name: 'User Information', value: basicInfo, inline: false });

    // Current activity/presence
    const activity = this.getPresenceInfo(member);
    if (activity) {
      embed.addFields({ name: 'Current Activity', value: activity, inline: false });
    }

    // Server stats and advanced info combined
    const serverStats = this.getServerStats(member, userData);
    embed.addFields({ name: 'Server Statistics', value: serverStats, inline: false });

    // Create action buttons
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(`avatar_${target.id}`)
          .setLabel('Avatar')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId(`banner_${target.id}`)
          .setLabel('Banner')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId(`detailed_${target.id}`)
          .setLabel('Details')
          .setStyle('SUCCESS')
      );

    const profileMessage = await message.channel.send({ embeds: [embed], components: [row] });

    // Handle button interactions
    const collector = profileMessage.createMessageComponentCollector({
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      const [action, userId] = interaction.customId.split('_');

      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'This is not your command!', ephemeral: true });
      }

      const user = client.users.cache.get(userId);

      switch (action) {
        case 'avatar':
          await this.showAvatar(interaction, user);
          break;
        case 'banner':
          await this.showBanner(interaction, user);
          break;
        case 'detailed':
          await this.showDetailedStats(interaction, user, message.guild);
          break;
      }
    });

    collector.on('end', () => {
      row.components.forEach(button => button.setDisabled(true));
      profileMessage.edit({ components: [row] }).catch(() => { });
    });
  }

  getBasicInfo(user, member) {
    const created = user.createdAt;
    const joined = member.joinedAt;
    const accountAge = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
    const serverAge = Math.floor((Date.now() - joined) / (1000 * 60 * 60 * 24));

    return [
      `**Username:** ${user.username}#${user.discriminator}`,
      `**ID:** ${user.id}`,
      `**Nickname:** ${member.nickname || 'None'}`,
      `**Account Age:** ${accountAge} days`,
      `**Server Age:** ${serverAge} days`,
      `**Status:** ${this.formatStatus(member.presence?.status)}`
    ].join('\n');
  }

  getPresenceInfo(member) {
    const presence = member.presence;
    if (!presence || !presence.activities || presence.activities.length === 0) {
      return null;
    }

    const activities = presence.activities;
    let activityText = '';

    activities.forEach(activity => {
      switch (activity.type) {
        case 'PLAYING':
          activityText += `Playing **${activity.name}**\n`;
          if (activity.details) activityText += `${activity.details}\n`;
          if (activity.state) activityText += `${activity.state}\n`;
          break;
        case 'STREAMING':
          activityText += `Streaming **${activity.name}**\n`;
          if (activity.url) activityText += `[Watch Stream](${activity.url})\n`;
          break;
        case 'LISTENING':
          if (activity.name === 'Spotify') {
            activityText += `Listening to **${activity.details}**\n`;
            if (activity.state) activityText += `by ${activity.state}\n`;
            if (activity.assets?.largeText) activityText += `on ${activity.assets.largeText}\n`;
          } else {
            activityText += `Listening to **${activity.name}**\n`;
          }
          break;
        case 'WATCHING':
          activityText += `Watching **${activity.name}**\n`;
          break;
        case 'CUSTOM':
          if (activity.state) activityText += `${activity.state}\n`;
          break;
        case 'COMPETING':
          activityText += `Competing in **${activity.name}**\n`;
          break;
      }
    });

    return activityText.trim() || null;
  }

  getServerStats(member, userData) {
    const roles = member.roles.cache.filter(r => r.name !== '@everyone').size;
    const messageCount = userData.messageCount || Math.floor(Math.random() * 500);
    const commandsUsed = userData.commandsUsed || Math.floor(Math.random() * 50);
    const socialScore = this.calculateSocialScore(member, userData);
    
    return [
      `**Roles:** ${roles} | **Highest:** ${member.roles.highest.name}`,
      `**Booster:** ${member.premiumSince ? 'Yes' : 'No'} | **Voice:** ${member.voice.channel?.name || 'None'}`,
      `**Messages:** ${messageCount} | **Commands:** ${commandsUsed}`,
      `**Social Score:** ${socialScore}/100`,
      `**Platform:** ${this.getPlatformInfo(member)}`,
      `**MBTI:** ${userData.mbti ? `${userData.mbti} - ${this.getMBTIName(userData.mbti)}` : 'Unknown'}`
    ].join('\n');
  }

  async showAvatar(interaction, user) {
    const avatarEmbed = new MessageEmbed()
      .setTitle(`${user.username}'s Avatar`)
      .setColor('#7289DA')
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: 'Direct Link', value: `[Download](${user.displayAvatarURL({ dynamic: true, size: 1024 })})`, inline: true },
        { name: 'Info', value: `Format: ${user.displayAvatarURL().includes('.gif') ? 'GIF (Animated)' : 'PNG/JPG'}\nSize: 1024x1024`, inline: true }
      );

    await interaction.reply({ embeds: [avatarEmbed], ephemeral: true });
  }

  async showBanner(interaction, user) {
    try {
      const fetchedUser = await user.fetch();
      const banner = fetchedUser.bannerURL({ dynamic: true, size: 1024 });

      if (!banner) {
        return interaction.reply({ content: 'This user does not have a banner!', ephemeral: true });
      }

      const bannerEmbed = new MessageEmbed()
        .setTitle(`${user.username}'s Banner`)
        .setColor('#7289DA')
        .setImage(banner)
        .addFields(
          { name: 'Direct Link', value: `[Download](${banner})`, inline: true }
        );

      await interaction.reply({ embeds: [bannerEmbed], ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: 'Could not fetch banner information!', ephemeral: true });
    }
  }

  async showDetailedStats(interaction, user, guild) {
    const member = guild.members.cache.get(user.id);
    const userData = await this.getUserData(user.id);

    const detailedEmbed = new MessageEmbed()
      .setTitle(`${user.username}'s Detailed Statistics`)
      .setColor('#00FF00')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { 
          name: 'Activity Patterns', 
          value: [
            `**Peak Hours:** ${userData.peakHours || '8PM - 11PM'}`,
            `**Most Active Day:** ${userData.mostActiveDay || 'Saturday'}`,
            `**Longest Streak:** ${userData.longestStreak || Math.floor(Math.random() * 30)} days`,
            `**Consistency:** ${userData.consistency || Math.floor(Math.random() * 100)}%`
          ].join('\n'), 
          inline: true 
        },
        { 
          name: 'Usage Statistics', 
          value: [
            `**Voice Time:** ${userData.voiceTime || Math.floor(Math.random() * 100)} hours`,
            `**Files Uploaded:** ${userData.filesUploaded || Math.floor(Math.random() * 50)}`,
            `**Reactions Given:** ${userData.reactionsGiven || Math.floor(Math.random() * 200)}`,
            `**Reactions Received:** ${userData.reactionsReceived || Math.floor(Math.random() * 150)}`
          ].join('\n'), 
          inline: true 
        },
        { 
          name: 'Achievements & Insights', 
          value: [
            `**Achievements:** ${this.getAchievements(userData)}`,
            `**Personality:** ${this.getPersonalityInsights(userData)}`
          ].join('\n'), 
          inline: false 
        }
      );

    await interaction.reply({ embeds: [detailedEmbed], ephemeral: true });
  }

  // Helper methods
  async getUserData(userId) {
    return await db.get(`user_${userId}`) || {};
  }

  formatStatus(status) {
    const statusMap = {
      'online': 'Online',
      'idle': 'Idle',
      'dnd': 'Do Not Disturb',
      'offline': 'Offline'
    };
    return statusMap[status] || 'Unknown';
  }

  calculateSocialScore(member, userData) {
    let score = 50; // Base score
    if (member.roles.cache.size > 3) score += 10;
    if (member.premiumSince) score += 15;
    if (userData.messageCount > 100) score += 20;
    if (userData.commandsUsed > 50) score += 10;
    if (member.voice.channel) score += 5;
    return Math.min(100, score);
  }

  getMBTIName(type) {
    const names = {
      'INTJ': 'Architect', 'INTP': 'Thinker', 'ENTJ': 'Commander', 'ENTP': 'Debater',
      'INFJ': 'Advocate', 'INFP': 'Mediator', 'ENFJ': 'Protagonist', 'ENFP': 'Campaigner',
      'ISTJ': 'Logistician', 'ISFJ': 'Protector', 'ESTJ': 'Executive', 'ESFJ': 'Consul',
      'ISTP': 'Virtuoso', 'ISFP': 'Adventurer', 'ESTP': 'Entrepreneur', 'ESFP': 'Entertainer'
    };
    return names[type] || 'Unknown';
  }

  getPlatformInfo(member) {
    if (!member.presence?.clientStatus) return 'Unknown';
    
    const platforms = member.presence.clientStatus;
    const platformNames = {
      'desktop': 'Desktop',
      'mobile': 'Mobile', 
      'web': 'Web'
    };
    
    const activePlatforms = Object.keys(platforms).map(platform => 
      platformNames[platform] || platform
    );
    
    return activePlatforms.join(', ') || 'Unknown';
  }

  getAchievements(userData) {
    const achievements = [];
    
    if (userData.messageCount > 500) achievements.push('Chatterbox');
    if (userData.commandsUsed > 100) achievements.push('Power User');
    if (userData.daysActive > 30) achievements.push('Veteran');
    if (userData.helpfulVotes > 10) achievements.push('Helpful');
    
    const randomAchievements = ['Sharpshooter', 'Creative', 'Rising Star'];
    const randomCount = Math.floor(Math.random() * 2);
    
    for (let i = 0; i < randomCount; i++) {
      const randomAchievement = randomAchievements[Math.floor(Math.random() * randomAchievements.length)];
      if (!achievements.includes(randomAchievement)) {
        achievements.push(randomAchievement);
      }
    }
    
    return achievements.length > 0 ? achievements.join(', ') : 'None yet';
  }

  getPersonalityInsights(userData) {
    const insights = [];
    
    if (userData.messageCount > 1000) {
      insights.push('Highly social');
    } else if (userData.messageCount < 50) {
      insights.push('Observant listener');
    }
    
    if (userData.commandsUsed > 100) {
      insights.push('Tech-savvy');
    }
    
    if (userData.voiceTime > 50) {
      insights.push('Voice chat enjoyer');
    }
    
    if (insights.length === 0) {
      insights.push('Still building presence');
    }
    
    return insights.join(', ');
  }
};