const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');
const currency = require('../../utils/currency');

module.exports = class WorkCommand extends BaseCommand {
  constructor() {
    super('work', 'Currency', ['job', 'grind']);
  }

  async run(client, message, args) {
    const userId = message.author.id;

    // Check cooldown
    if (!(await currency.canWork(userId))) {
      const lastWork = await currency.getWorkCooldown(userId);
      const remainingTime = currency.workCooldown - (Date.now() - lastWork);
      
      const embed = new MessageEmbed()
        .setDescription(`You need to wait **${currency.formatTime(remainingTime)}** before working again!`)
        .setColor('#ff6b6b')
        .addFields(
          { name: 'Cooldown', value: '5 minutes', inline: true },
          { name: 'Tip:', value: 'Try playing slots while waiting!', inline: true }
        )
        .setFooter('Work smarter, not harder!');

      return message.channel.send({ embeds: [embed] });
    }

    // Work scenarios with different pay rates
    const workScenarios = [
      { job: 'Freelance Developer', min: 800, max: 1500, emoji: '💻' },
      { job: 'Pizza Delivery Driver', min: 300, max: 800, emoji: '🍕' },
      { job: 'Uber Driver', min: 400, max: 900, emoji: '🚗' },
      { job: 'Twitch Streamer', min: 200, max: 2000, emoji: '🎮' },
      { job: 'Dog Walker', min: 150, max: 500, emoji: '🐕' },
      { job: 'Coffee Shop Barista', min: 250, max: 600, emoji: '☕' },
      { job: 'YouTube Content Creator', min: 100, max: 1800, emoji: '📹' },
      { job: 'Meme Lord', min: 50, max: 1200, emoji: '😂' },
      { job: 'Discord Moderator', min: 0, max: 100, emoji: '🔨' },
      { job: 'Professional Gamer', min: 500, max: 1600, emoji: '🎯' },
      { job: 'Social Media Manager', min: 300, max: 1000, emoji: '📱' },
      { job: 'Cryptocurrency Trader', min: 0, max: 2500, emoji: '📊' },
      { job: 'Bug Bounty Hunter', min: 400, max: 1800, emoji: '🐛' },
      { job: 'Online Tutor', min: 350, max: 900, emoji: '📚' },
      { job: 'Graphic Designer', min: 450, max: 1200, emoji: '🎨' }
    ];

    const scenario = workScenarios[Math.floor(Math.random() * workScenarios.length)];
    const earnings = Math.floor(Math.random() * (scenario.max - scenario.min + 1)) + scenario.min;

    // Add bonus for consecutive work days
    const bonus = Math.random() < 0.1 ? Math.floor(earnings * 0.5) : 0;
    const totalEarnings = earnings + bonus;

    // Update balance and cooldown
    await currency.addBalance(userId, totalEarnings);
    await currency.setWorkCooldown(userId, Date.now());

    const newBalance = await currency.getBalance(userId);

    const embed = new MessageEmbed()
      .setTitle(`${scenario.emoji} Work Complete!`)
      .setDescription(`You worked as a **${scenario.job}** and earned **${currency.formatCurrency(totalEarnings)}**!`)
      .setColor('#00ff00')
      .addFields(
        { name: 'Base Earnings', value: currency.formatCurrency(earnings), inline: true },
        { name: 'Bonus', value: bonus > 0 ? currency.formatCurrency(bonus) : 'None', inline: true },
        { name: 'New Balance', value: currency.formatCurrency(newBalance), inline: true }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter('Come back in 5 minutes for more work!')
      .setTimestamp();

    // Special messages for certain jobs
    if (scenario.job === 'Discord Moderator' && earnings === 0) {
      embed.setDescription(`You worked as a **${scenario.job}** for free! ${scenario.emoji}\n\n*Just like real life!*`);
    } else if (scenario.job === 'Cryptocurrency Trader' && earnings === 0) {
      embed.setDescription(`You worked as a **${scenario.job}** and lost money! ${scenario.emoji}\n\n*The market is rough today...*`);
    }

    if (bonus > 0) {
      embed.addFields(
        { name: 'Lucky Day!', value: 'You got a bonus for great work!', inline: false }
      );
    }

    await message.channel.send({ embeds: [embed] });
  }
};