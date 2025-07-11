const { MessageEmbed } = require('discord.js');
const BaseCommand = require('../../utils/structures/BaseCommand');

module.exports = class EightBallCommand extends BaseCommand {
  constructor() {
    super('8ball', 'Fun', []); // Primary command name and category
    this.aliases = ['eightball', '8', 'magic8ball']; // Define aliases here
  }

  run(client, message, args) {
    // If no question is provided
    if (!args.length) {
      return message.channel.send({ content: 'Please ask a question!' });
    }

    // Array of possible responses
    const responses = [
      'Yes!',
      'Certainly!',
      'No.',
      'Maybe.',
      'Ask again later.',
      'Hide your mother. I\'m coming.',
      'Definitely.',
      'Absolutely not!',
      'I wouldn\'t count on it.',
      'Yes, in due time.',
      'Outlook not so good.'
    ];

    // Combine the arguments into the user input (question)
    let input = args.join(' ');

    // Get a random response
    const response = responses[Math.floor(Math.random() * responses.length)];

    // Create an embed message with the user's input and the 8-ball response
    let embedResponse = new MessageEmbed()
      .setDescription(`You asked: \`${input}\`\n\nI think: ${response}`)
      .setColor("BLACK");

    // Send the random response
    message.channel.send({ embeds: [embedResponse] });
  }
};
