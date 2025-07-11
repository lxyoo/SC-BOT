const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js'); // Import MessageEmbed for Discord.js v13

module.exports = class PurgeCommand extends BaseCommand {
  constructor() {
    super('purge', 'Moderation', []);
  }

  async run(client, message, args) {
    // Check if the user has permission to manage messages
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
      let requiredPermission = ('MANAGE_MESSAGES')
      const boz2o = new MessageEmbed()
        .setDescription(`\`❌\` | Hey, buddy. You __don't__ have this shiny permission: \n\`${requiredPermission}\`.`)
        .setColor("RED")
        .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
      return message.channel.send({ embeds: [boz2o] });
    }
    else if (!args[0] || isNaN(args[0])) {
      {
        const boz2o = new MessageEmbed()
          .setDescription(`\`❌\` | Hey, buddy. Maybe try saying something.`)
          .setColor("RED")
          .setImage("https://c.tenor.com/MIm_scG8anoAAAAd/tenor.gif");
        return message.channel.send({ embeds: [boz2o] });
      }
    }

    const amount = parseInt(args[0]);

    // Check if the amount is within the valid range (1-100)
    if (amount < 1 || amount > 100) {
      const umm = new MessageEmbed()
        .setDescription("<:nyaboom:1292657981111926930> You need to put here a number between 1 and 100.")
        .setColor("#ffe4e3");
      return message.channel.send({ embeds: [umm] });
    }

    try {
      const deletedMessages = await message.channel.bulkDelete(amount, true);

      if (deletedMessages.size === 0) {
        const noMessages = new MessageEmbed()
          .setDescription("`⚠️` | No messages were deleted. They might be older than 14 days.")
          .setColor("YELLOW");
        return message.channel.send({ embeds: [noMessages] });
      }

      const successEmbed = new MessageEmbed()
        .setDescription(`\`✅\` | Successfully deleted ${deletedMessages.size} messages!`)
        .setColor("GREEN");

      const successMessage = await message.channel.send({ embeds: [successEmbed] });

      setTimeout(() => {
        successMessage.delete().catch(() => { });
      }, 5000);

    } catch (error) {
      console.error(error);
      if (error.code === 50034) {
        let denied = new MessageEmbed()
          .setDescription("`❌` | I can only delete messages that are less than 14 days old.")
          .setColor("RED");
        return message.channel.send({ embeds: [denied] });
      }

      let errorify = new MessageEmbed()
        .setDescription("`❌` | I ran into an error trying to purge messages.")
        .setColor("RED");
      return message.channel.send({ embeds: [errorify] });
    }
  }
}

