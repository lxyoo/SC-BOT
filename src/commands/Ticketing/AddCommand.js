const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const { MessageEmbed } = require('discord.js');

module.exports = class AddCommand extends BaseCommand {
  constructor() {
    super('add', 'Ticket', []);
  }

  async run(client, message, args) {
    var prefix = db.fetch(`guildprefix_${message.guild.id}`);
    if (!prefix) {
      prefix = "~";
    }

    // Check for administrator permissions
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      const requiredPermission = 'ADMINISTRATOR';
      const bozo = new MessageEmbed()
        .setDescription(`\`❌\` Hey, buddy. You __don't__ have this shiny permission: \n\`${requiredPermission}\`.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [bozo] });
    }

    // Ensure the command is used in a ticket channel
    if (message.channel.name.includes('ticket-')) {
      // If args[0] is a mention, user ID, or username, find the member
      let member;

      // Try finding the member by mention
      if (message.mentions.members.size > 0) {
        member = message.mentions.members.first();
      } 
      // Try finding the member by ID
      else if (args[0]) {
        try {
          member = await message.guild.members.fetch(args[0]);
        } catch (e) {
          console.error(e); // Log error for debugging
        }
      } 
      // Try finding the member by username
      else if (args.length > 0) {
        member = message.guild.members.cache.find(m => m.user.username.toLowerCase() === args.join(' ').toLowerCase());
      }

      if (!member) {
        const embed = new MessageEmbed()
          .setDescription(`\`❌\` Incorrect usage. Correct usage: ${prefix}add <@member, member ID, or username>`)
          .setColor("#ff0000");
        return message.channel.send({ embeds: [embed] });
      }

      try {
        // Update channel permissions for the mentioned member or user by ID
        await message.channel.permissionOverwrites.edit(member.user, {
          VIEW_CHANNEL: true,
          SEND_MESSAGES: true,
          ATTACH_FILES: true,
          READ_MESSAGE_HISTORY: true,
        });

        // Send success message with member ID and mention
        let added = new MessageEmbed()
        .setDescription(`\`✅\`Successfully added ${member} (${member.user.id}) to ${message.channel}!`)
        .setColor("GREEN")
        message.channel.send({embeds: [added]});
      } catch (e) {
        console.error(e); // Log the error for debugging
        const embed2 = new MessageEmbed()
          .setDescription('`❌` An error occurred, please try again!')
          .setColor("RED");
        return message.channel.send({ embeds: [embed2] });
      }
    } else {
      const embed = new MessageEmbed()
        .setDescription('`❌` This command can only be used inside a ticket channel.')
        .setColor("RED");
      return message.channel.send({ embeds: [embed] });
    }
  }
};
