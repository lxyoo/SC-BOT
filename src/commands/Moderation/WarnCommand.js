const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class WarnCommand extends BaseCommand {
  constructor() {
    super('warn', 'Moderation', ['warning', 'w']);
  }

  async run(client, message, args) {
    // Check if user has permission
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` Hey, buddy. You __don't__ have this shiny permission: \n\`MANAGE_MESSAGES\`.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const subcommand = args[0]?.toLowerCase();

    if (!subcommand) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` Hey, buddy. Maybe try saying something.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    switch (subcommand) {
      case 'add':
        return this.addWarning(client, message, args);
      case 'remove':
        return this.removeWarning(client, message, args);
      case 'list':
        return this.listWarnings(client, message, args);
      case 'clear':
        return this.clearWarnings(client, message, args);
      case 'info':
        return this.warnInfo(client, message, args);
      default:
        return this.showHelp(message);
    }
  }

  async addWarning(client, message, args) {
    const user = message.mentions.users.first() || await message.guild.members.fetch(args[1]).catch(() => null);
    const reason = args.slice(2).join(' ') || 'No reason provided';

    if (!user) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` Mention someone to warn, genius.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const targetUser = user.user || user;

    if (targetUser.id === message.author.id) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` You can't warn yourself, smarty pants.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    if (targetUser.id === client.user.id) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` Nice try, but I'm untouchable.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    // Check role hierarchy
    const targetMember = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (targetMember && targetMember.roles.highest.position >= message.member.roles.highest.position) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` That person outranks you, chief.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    // Initialize warnings
    if (!client.userWarnings) {
      client.userWarnings = new Map();
    }

    const userId = targetUser.id;
    const userWarnings = client.userWarnings.get(userId) || [];

    // Create warning
    const warning = {
      id: Date.now().toString(),
      reason: reason,
      moderator: message.author.tag,
      moderatorId: message.author.id,
      timestamp: new Date(),
      guildId: message.guild.id,
      channelId: message.channel.id
    };

    userWarnings.push(warning);
    client.userWarnings.set(userId, userWarnings);

    // Save to database
    await this.saveWarningsToDatabase(client);

    const embed = new MessageEmbed()
      .setDescription(`\`✅\` **${targetUser.tag}** has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${userWarnings.length}\n**Warning ID:** ${warning.id}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setColor("GREEN");

    message.channel.send({ embeds: [embed] });

    // Auto-moderation
    await this.handleAutoMod(message.guild, targetMember, userWarnings.length);

    // Try to DM the user
    try {
      const dmEmbed = new MessageEmbed()
        .setDescription(`\`⚠️\` You've been warned in **${message.guild.name}**\n**Reason:** ${reason}\n**Total Warnings:** ${userWarnings.length}`)
        .setColor("YELLOW");
      await targetUser.send({ embeds: [dmEmbed] });
    } catch (error) {
      console.log(`Could not DM ${targetUser.tag}`);
    }
  }

  async removeWarning(client, message, args) {
    const user = message.mentions.users.first() || await message.guild.members.fetch(args[1]).catch(() => null);
    const warningId = args[2];

    if (!user || !warningId) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` Need a user and warning ID, buddy.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const targetUser = user.user || user;
    const userWarnings = client.userWarnings?.get(targetUser.id) || [];

    const warningIndex = userWarnings.findIndex(w => w.id === warningId);
    if (warningIndex === -1) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` That warning doesn't exist, sherlock.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const removedWarning = userWarnings.splice(warningIndex, 1)[0];
    client.userWarnings.set(targetUser.id, userWarnings);

    await this.saveWarningsToDatabase(client);

    const embed = new MessageEmbed()
      .setDescription(`\`✅\` **${targetUser.tag}**'s warning removed.\n**Removed Reason:** ${removedWarning.reason}\n**Remaining Warnings:** ${userWarnings.length}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setColor("GREEN");

    message.channel.send({ embeds: [embed] });
  }

  async listWarnings(client, message, args) {
    const user = message.mentions.users.first() || await message.guild.members.fetch(args[1]).catch(() => null);

    if (!user) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | Mention someone to check, genius.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const targetUser = user.user || user;
    const userWarnings = client.userWarnings?.get(targetUser.id) || [];

    if (userWarnings.length === 0) {
      const embed = new MessageEmbed()
        .setDescription(`\`⚠️\` **${targetUser.tag}** is not warned.`)
        .setColor("YELLOW");
      return message.channel.send({ embeds: [embed] });
    }

    let warningList = '';
    userWarnings.forEach((warning, index) => {
      const date = warning.timestamp.toLocaleDateString();
      warningList += `**${index + 1}.** ${warning.reason} (${date})\n`;
    });

    const embed = new MessageEmbed()
      .setDescription(`\`⚠️\` **${userWarnings.length}** warnings for **${targetUser.tag}**:\n${warningList}`)
      .setColor("ORANGE");

    message.channel.send({ embeds: [embed] });
  }

  async clearWarnings(client, message, args) {
    const user = message.mentions.users.first() || await message.guild.members.fetch(args[1]).catch(() => null);

    if (!user) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` Mention someone to clear, genius.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const targetUser = user.user || user;
    const userWarnings = client.userWarnings?.get(targetUser.id) || [];

    if (userWarnings.length === 0) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` **${targetUser.tag}** has no warnings to clear.`)
        .setColor("RED")
      return message.channel.send({ embeds: [embed] });
    }

    const clearedCount = userWarnings.length;
    client.userWarnings.set(targetUser.id, []);

    await this.saveWarningsToDatabase(client);

    const embed = new MessageEmbed()
      .setDescription(`\`✅\` **${targetUser.tag}** warnings cleared.\n**Cleared Count:** ${clearedCount}`)
      .setColor("GREEN");

    message.channel.send({ embeds: [embed] });
  }

  async warnInfo(client, message, args) {
    const user = message.mentions.users.first() || await message.guild.members.fetch(args[1]).catch(() => null);
    const warningId = args[2];

    if (!user) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | Mention someone to check, genius.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const targetUser = user.user || user;
    const userWarnings = client.userWarnings?.get(targetUser.id) || [];

    if (userWarnings.length === 0) {
      const embed = new MessageEmbed()
        .setDescription(`\`✅\` **${targetUser.tag}** has no warnings.`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setColor("GREEN");
      return message.channel.send({ embeds: [embed] });
    }

    // If specific warning ID provided
    if (warningId) {
      const warning = userWarnings.find(w => w.id === warningId);
      if (!warning) {
        const embed = new MessageEmbed()
          .setDescription(`\`❌\` Warning ID not found for **${targetUser.tag}**.`)
          .setColor("RED")
        return message.channel.send({ embeds: [embed] });
      }

      const embed = new MessageEmbed()
        .setDescription(`\`ℹ️\` **Warning Details:**\n**User:** ${targetUser.tag}\n**Reason:** ${warning.reason}\n**Moderator:** ${warning.moderator}\n**Date:** ${warning.timestamp.toLocaleDateString()}\n**Time:** ${warning.timestamp.toLocaleTimeString()}\n**Warning ID:** ${warning.id}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setColor("BLUE");

      return message.channel.send({ embeds: [embed] });
    }

    // General warning info
    const latestWarning = userWarnings[userWarnings.length - 1];
    const firstWarning = userWarnings[0];
    const totalWarnings = userWarnings.length;

    let status = 'Clean';
    if (totalWarnings >= 5) status = 'Banned';
    else if (totalWarnings >= 3) status = 'Critical';
    else if (totalWarnings >= 1) status = 'Warned';

    const embed = new MessageEmbed()
      .setDescription(`\`ℹ️\` **Warning Info for ${targetUser.tag}:**\n**Total Warnings:** ${totalWarnings}\n**Status:** ${status}\n**First Warning:** ${firstWarning.timestamp.toLocaleDateString()}\n**Latest Warning:** ${latestWarning.timestamp.toLocaleDateString()}\n**Latest Reason:** ${latestWarning.reason}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setColor("BLUE");

    message.channel.send({ embeds: [embed] });
  }

  async handleAutoMod(guild, member, warningCount) {
    try {
      if (warningCount >= 5) {
        await member.ban({ reason: 'Auto-ban: 5 warnings reached' });
        console.log(`[AUTO-MOD] ${member.user.tag} auto-banned for 5 warnings`);
      } else if (warningCount >= 3) {
        await member.timeout(24 * 60 * 60 * 1000, 'Auto-timeout: 3 warnings reached');
        console.log(`[AUTO-MOD] ${member.user.tag} auto-timed out for 3 warnings`);
      }
    } catch (error) {
      console.error('Auto-moderation error:', error);
    }
  }

  async saveWarningsToDatabase(client) {
    try {
      const db = require('quick.db');
      const warningsObj = Object.fromEntries(client.userWarnings || new Map());
      await db.set('userWarnings', warningsObj);
    } catch (error) {
      console.error('Error saving warnings:', error);
    }
  }

  showHelp(message) {
    const embed = new MessageEmbed()
      .setDescription(`\`⚠️\` **Warning Commands:**\n\`~warn add @user [reason]\`\n\`~warn remove @user <id>\`\n\`~warn list @user\`\n\`~warn clear @user\`\n\`~warn info @user [id]\``)
      .setColor("YELLOW");

    message.channel.send({ embeds: [embed] });
  }
};