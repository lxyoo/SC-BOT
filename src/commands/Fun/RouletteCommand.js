const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');
const currency = require('../../utils/currency');

module.exports = class RouletteCommand extends BaseCommand {
  constructor() {
    super('roulette', 'Fun', ['rr', 'russianroulette']);
    this.gameStates = new Map();
  }

  async run(client, message, args) {
    const bet = parseInt(args[0]) || 100;
    const userId = message.author.id;

    // Check if user can afford bet
    if (!(await currency.canAfford(userId, bet))) {
      const balance = await currency.getBalance(userId);
      return message.channel.send({
        embeds: [
          new MessageEmbed()
            .setTitle('💸 Insufficient Funds!')
            .setDescription(`You need ${currency.formatCurrency(bet)} but only have ${currency.formatCurrency(balance)}!`)
            .setColor('#ff6b6b')
        ]
      });
    }

    // Russian Roulette logic
    const chamber = Math.floor(Math.random() * 6) + 1;
    const bullet = Math.floor(Math.random() * 6) + 1;
    const survived = chamber !== bullet;

    await currency.removeBalance(userId, bet);

    if (survived) {
      const winnings = Math.floor(bet * 2.5);
      await currency.addBalance(userId, winnings);
      
      const embed = new MessageEmbed()
        .setTitle('Still Alive')
        .setDescription(`Really bro? Just die at this point..`)
        .setColor('#00ff00')
        .addFields(
          { name: 'Chamber', value: `${chamber}/6`, inline: true },
          { name: 'Bullet', value: `${bullet}/6`, inline: true },
          { name: 'Winnings', value: currency.formatCurrency(winnings - bet), inline: true }
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter('Lucky you.');

      await message.channel.send({ embeds: [embed] });
    } else {
      const embed = new MessageEmbed()
        .setTitle('YOU DIED!')
        .setDescription(`Damn. Ig you dead.`)
        .setColor('#ff0000')
        .addFields(
          { name: 'Chamber', value: `${chamber}/6`, inline: true },
          { name: 'Bullet', value: `${bullet}/6`, inline: true },
          { name: 'Lost', value: currency.formatCurrency(bet), inline: true }
        )
        .setThumbnail('https://i.imgur.com/YmZe9S6.png')
        .setFooter('RIP... Try again if you dare! Oh wait, you can\'t.');

      await message.channel.send({ embeds: [embed] });
    }
  }
};