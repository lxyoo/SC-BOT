const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class GayCommand extends BaseCommand {
  constructor() {
    super('gay', 'Fun', []);
    this.aliases = ['howgayami', 'amigay', 'howgay']; // Define aliases here
  }

  async run(client, message, args) {
    // Check if a user is mentioned or an ID is provided
    let targetUser = message.mentions.users.first() || message.author;

    // If a valid ID is provided but no mention
    if (!targetUser && args[0] && args[0].length === 18) {
      try {
        targetUser = await client.users.fetch(args[0]);
      } catch (e) {
        return message.channel.send({ content: 'Could not find that user!' });
      }
    }

    // Get a random percentage between 0 and 100
    const percentage = Math.floor(Math.random() * 101); // Generates a number between 0 and 100

    // Create a bar with 10 parts (filled and empty)
    const totalBars = 10;
    const filledBars = Math.round((percentage / 100) * totalBars); // Determines how many bars are filled
    const emptyBars = totalBars - filledBars;

    // Create the visual bar with filled and empty parts
    const bar = '🏳️‍🌈'.repeat(filledBars) + '⬛'.repeat(emptyBars);

    // Create an embed to show the percentage and bar
    const embed = new MessageEmbed()
      .setDescription(`**🌈 How Gay Are You? 🌈**\n\nYo.. ${targetUser}, I think you\'re like, **${percentage}%** gay.\n**Gay Meter:**\n${bar}`)
      .setColor("RANDOM"); // Use a random color for fun
    // Send the embed message
    message.channel.send({ embeds: [embed] });
  }
};