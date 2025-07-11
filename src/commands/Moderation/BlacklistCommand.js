const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class BlacklistCommand extends BaseCommand {
  constructor() {
    super('blacklist', 'Admin', ['bl', 'ban']);
  }

  async run(client, message, args) {
    // Check if user has permission
    if (!message.member.permissions.has('ADMINISTRATOR') && message.author.id !== 'YOUR_USER_ID') {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | Hey, buddy. You __don't__ have this shiny permission: \n\`ADMINISTRATOR\`.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const subcommand = args[0]?.toLowerCase();

    if (!subcommand) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | Hey, buddy. Maybe try saying something.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    switch (subcommand) {
      case 'add':
        return this.addToBlacklist(client, message, args);
      case 'remove':
        return this.removeFromBlacklist(client, message, args);
      case 'list':
        return this.listBlacklisted(client, message);
      case 'check':
        return this.checkUser(client, message, args);
    }
  }

  async addToBlacklist(client, message, args) {
    const user = message.mentions.users.first() || await message.guild.members.fetch(args[1]).catch(() => null);
    const reason = args.slice(2).join(' ') || 'No reason provided';

    if (!user) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | Mention someone to blacklist, genius.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const targetUser = user.user || user;

    if (targetUser.id === message.author.id) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | You can't blacklist yourself, smarty pants.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    if (targetUser.id === client.user.id) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | Nice try, but I'm untouchable.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    // Check if user is already blacklisted
    if (client.blacklistedUsers?.has(targetUser.id)) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | **${targetUser.tag}** is already blacklisted, chief.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    // Initialize blacklist if it doesn't exist
    if (!client.blacklistedUsers) {
      client.blacklistedUsers = new Map();
    }

    // Add to blacklist
    client.blacklistedUsers.set(targetUser.id, {
      username: targetUser.tag,
      reason: reason,
      blacklistedBy: message.author.id,
      blacklistedAt: new Date(),
      guildId: message.guild.id
    });

    await client.saveBlacklist();

    const embed = new MessageEmbed()
      .setDescription(`\`✅\` | **${targetUser.tag}** has been blacklisted.\n**Reason:** ${reason}`)
      .setColor("GREEN");

    message.channel.send({ embeds: [embed] });

    console.log(`[BLACKLIST] ${targetUser.tag} (${targetUser.id}) blacklisted by ${message.author.tag} - Reason: ${reason}`);
  }

  async removeFromBlacklist(client, message, args) {
    const user = message.mentions.users.first() || await message.guild.members.fetch(args[1]).catch(() => null);

    if (!user) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | Mention someone to remove, genius.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const targetUser = user.user || user;

    // Check if user is blacklisted
    if (!client.blacklistedUsers?.has(targetUser.id)) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | **${targetUser.tag}** isn't blacklisted, sherlock.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    // Remove from blacklist
    const blacklistData = client.blacklistedUsers.get(targetUser.id);
    client.blacklistedUsers.delete(targetUser.id);

    await client.saveBlacklist();

    const embed = new MessageEmbed()
      .setDescription(`\`✅\` | **${targetUser.tag}** has been removed from blacklist.`)
      .setColor("GREEN");

    message.channel.send({ embeds: [embed] });

    console.log(`[BLACKLIST] ${targetUser.tag} (${targetUser.id}) removed from blacklist by ${message.author.tag}`);
  }

  async listBlacklisted(client, message) {
    if (!client.blacklistedUsers || client.blacklistedUsers.size === 0) {
      const embed = new MessageEmbed()
        .setDescription(`\`✅\` | No users are currently blacklisted!`)
        .setColor("GREEN");
      return message.channel.send({ embeds: [embed] });
    }

    const blacklistedUsers = Array.from(client.blacklistedUsers.entries());
    let userList = '';

    blacklistedUsers.forEach(([userId, data], index) => {
      userList += `**${index + 1}.** ${data.username} - ${data.reason}\n`;
    });

    const embed = new MessageEmbed()
      .setDescription(`\`📋\` | **${blacklistedUsers.length}** blacklisted users:\n${userList}`)
      .setColor("ORANGE");

    message.channel.send({ embeds: [embed] });
  }

  async checkUser(client, message, args) {
    const user = message.mentions.users.first() || await message.guild.members.fetch(args[1]).catch(() => null);

    if (!user) {
      const embed = new MessageEmbed()
        .setDescription(`\`❌\` | Mention someone to check, genius.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [embed] });
    }

    const targetUser = user.user || user;
    const blacklistData = client.blacklistedUsers?.get(targetUser.id);

    if (!blacklistData) {
      const embed = new MessageEmbed()
        .setDescription(`\`✅\` | **${targetUser.tag}** is not blacklisted.`)
        .setColor("GREEN");
      return message.channel.send({ embeds: [embed] });
    }

    const embed = new MessageEmbed()
      .setDescription(`\`❌\` | **${targetUser.tag}** is blacklisted.\n**Reason:** ${blacklistData.reason}\n**Date:** ${blacklistData.blacklistedAt.toLocaleDateString()}`)
      .setColor("RED");

    message.channel.send({ embeds: [embed] });
  }

  showHelp(message) {
    const embed = new MessageEmbed()
      .setDescription(`\`📋\` | **Blacklist Commands:**\n\`!blacklist add @user [reason]\`\n\`!blacklist remove @user\`\n\`!blacklist list\`\n\`!blacklist check @user\``)
      .setColor("BLUE");

    message.channel.send({ embeds: [embed] });
  }
};