const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const { MessageEmbed } = require("discord.js");

module.exports = class RemoveCommand extends BaseCommand {
  constructor() {
    super('remove', 'ticket', []);
  }

  async run(client, message, args) {
    var prefix = db.fetch(`guildprefix_${message.guild.id}`);
    if (!prefix) {
      prefix = "~";
    }

    // Check for administrator permissions
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      const bozo = new MessageEmbed()
        .setDescription(`\`❌\` Hey, buddy. You __don't__ have this shiny permission: \n\`ADMINISTRATOR\`.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [bozo] });
    }

    // Ensure the command is used in a ticket channel
    if (message.channel.name.includes('ticket-')) {
      let member;

      // Try to fetch the member by user ID
      if (args[0]) {
        try {
          member = await message.guild.members.fetch(args[0]);
        } catch (e) {
          console.error(e); // Log error for debugging
        }
      }

      // Fallback: Try finding the member by mention or username if the ID fetch failed
      if (!member) {
        member = message.mentions.members.first() || 
                 message.guild.members.cache.find(x => x.user.username.toLowerCase() === args.join(' ').toLowerCase());
      }

      // If the member is still not found, send an error message
      if (!member) {
        const embed = new MessageEmbed()
          .setDescription(`\`❌\` Nandemo.. Please specify a valid user!`)
          .setColor("RED");
        return message.channel.send({ embeds: [embed] });
      }

      // Attempt to update the channel permissions for the specified member
      try {
        await message.channel.permissionOverwrites.edit(member.user, {
          VIEW_CHANNEL: false,
          SEND_MESSAGES: false,
          ATTACH_FILES: false,
          READ_MESSAGE_HISTORY: false,
        });

        // Send a success message once the permissions are updated
        const ok = new MessageEmbed()
          .setDescription(`\`✅\` Successfully removed ${member} from ${message.channel}!`)
          .setColor("GREEN");
        message.channel.send({ embeds: [ok] });
      } 
      catch (e) {
        console.error(e); // Log error for debugging

        // Send an error message if something goes wrong
        const embed2 = new MessageEmbed()
          .setDescription('`❌` An error occurred, please try again!')
          .setColor("RED");
        return message.channel.send({ embeds: [embed2] });
      }
    }
  }
};
