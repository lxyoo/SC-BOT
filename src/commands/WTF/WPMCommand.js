const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');
const currency = require('../../utils/currency');

module.exports = class TypeTestCommand extends BaseCommand {
  constructor() {
    super('typetest', 'Fun', ['typing', 'wpm', 'speedtest']);
  }

  async run(client, message, args) {
    const testTexts = [
      "The quick brown fox jumps over the lazy dog near the riverbank.",
      "Programming is the art of telling another human being what one wants the computer to do.",
      "Discord is a voice, video and text communication service to talk and hang out with your friends.",
      "Artificial intelligence is transforming the way we interact with technology in our daily lives.",
      "The future belongs to those who learn more skills and combine them in creative ways.",
      "Success is not final, failure is not fatal, it is the courage to continue that counts.",
      "Innovation distinguishes between a leader and a follower in the modern digital world.",
      "The best time to plant a tree was twenty years ago, the second best time is now.",
      "Knowledge is power, but enthusiasm pulls the switch to turn on the lights of wisdom.",
      "Dreams don't work unless you take action and make them reality through hard work."
    ];

    const selectedText = testTexts[Math.floor(Math.random() * testTexts.length)];
    const startTime = Date.now();

    const embed = new MessageEmbed()
      .setTitle('⌨️ Typing Speed Test')
      .setDescription('Type the text below as fast and accurately as possible!')
      .setColor('#00FF00')
      .addFields(
        { name: 'Text to Type', value: `\`\`\`${selectedText}\`\`\``, inline: false },
        { name: 'Instructions', value: 'Type exactly as shown (case sensitive)\nYou have 60 seconds!', inline: false },
        { name: 'Rewards', value: '50+ WPM: 200 Yen\n30+ WPM: 100 Yen\n20+ WPM: 50 Yen', inline: false }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter('Timer starts now!');

    await message.channel.send({ embeds: [embed] });

    const collector = message.channel.createMessageCollector({
      filter: (msg) => msg.author.id === message.author.id,
      time: 60000,
      max: 1
    });

    collector.on('collect', async (msg) => {
      const endTime = Date.now();
      const timeTaken = (endTime - startTime) / 1000; // seconds
      const typedText = msg.content;

      // Calculate accuracy
      const accuracy = this.calculateAccuracy(selectedText, typedText);

      // Calculate WPM
      const wordsTyped = typedText.split(' ').length;
      const wpm = Math.round((wordsTyped / timeTaken) * 60);

      // Determine reward
      let reward = 0;
      if (wpm >= 50 && accuracy >= 90) reward = 200;
      else if (wpm >= 30 && accuracy >= 80) reward = 100;
      else if (wpm >= 20 && accuracy >= 70) reward = 50;

      if (reward > 0) {
        await currency.addBalance(message.author.id, reward);
      }

      const resultEmbed = new MessageEmbed()
        .setTitle('⌨️ Typing Test Results')
        .setDescription(`Results for ${message.author.username}`)
        .setColor(this.getResultColor(wpm))
        .addFields(
          { name: 'Words Per Minute', value: `${wpm} WPM`, inline: true },
          { name: 'Accuracy', value: `${accuracy}%`, inline: true },
          { name: 'Time Taken', value: `${timeTaken.toFixed(1)}s`, inline: true },
          { name: 'Performance', value: this.getPerformanceRating(wpm), inline: true },
          { name: 'Reward', value: reward > 0 ? `${reward} Yen` : 'None', inline: true },
          { name: 'Words Typed', value: `${wordsTyped}`, inline: true }
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter('Keep practicing to improve your speed!');

      await message.channel.send({ embeds: [resultEmbed] });
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = new MessageEmbed()
          .setTitle('⏰ Time\'s Up!')
          .setDescription('You didn\'t complete the typing test in time!')
          .setColor('#FF6B6B')
          .setFooter('Try again with !typetest');

        message.channel.send({ embeds: [timeoutEmbed] });
      }
    });
  }

  calculateAccuracy(original, typed) {
    const originalWords = original.split(' ');
    const typedWords = typed.split(' ');

    let correctWords = 0;
    const maxLength = Math.max(originalWords.length, typedWords.length);

    for (let i = 0; i < maxLength; i++) {
      if (originalWords[i] === typedWords[i]) {
        correctWords++;
      }
    }

    return Math.round((correctWords / originalWords.length) * 100);
  }

  getResultColor(wpm) {
    if (wpm >= 50) return '#00FF00';
    if (wpm >= 30) return '#FFFF00';
    if (wpm >= 20) return '#FF6600';
    return '#FF0000';
  }

  getPerformanceRating(wpm) {
    if (wpm >= 70) return 'Expert';
    if (wpm >= 50) return 'Advanced';
    if (wpm >= 30) return 'Intermediate';
    if (wpm >= 20) return 'Beginner';
    return 'Practice More';
  }
};