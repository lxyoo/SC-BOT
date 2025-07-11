const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');
const currency = require('../../utils/currency');

module.exports = class SlotsCommand extends BaseCommand {
  constructor() {
    super('slots', 'Currency', ['slot', 'gamble', 'spin']);
  }

  async run(client, message, args) {
    const userId = message.author.id;
    const betAmount = parseInt(args[0]) || 100;

    // Check if user has enough balance
    if (!(await currency.canAfford(userId, betAmount))) {
      const balance = await currency.getBalance(userId);
      const embed = new MessageEmbed()
        .setTitle('💸 Insufficient Funds!')
        .setDescription(`You need **${currency.formatCurrency(betAmount)}** to play but only have **${currency.formatCurrency(balance)}**!`)
        .setColor('#ff6b6b')
        .addFields(
          { name: '💡 Tip', value: 'Use `!work` to earn more Yen!', inline: true },
          { name: '🎯 Minimum Bet', value: currency.formatCurrency(1), inline: true }
        );

      return message.channel.send({ embeds: [embed] });
    }

    // Check cooldown
    if (!(await currency.canPlaySlots(userId))) {
      const lastSlots = await currency.getSlotsCooldown(userId);
      const remainingTime = currency.slotsCooldown - (Date.now() - lastSlots);
      
      const embed = new MessageEmbed()
        .setTitle('🎰 Slots are Cooling Down!')
        .setDescription(`Wait **${currency.formatTime(remainingTime)}** before spinning again!`)
        .setColor('#ff6b6b')
        .setFooter('Good things come to those who wait!');

      return message.channel.send({ embeds: [embed] });
    }

    // Slot symbols and their values
    const symbols = {
      '🍒': { weight: 30, value: 2 },
      '🍋': { weight: 25, value: 2.5 },
      '🍊': { weight: 20, value: 3 },
      '🍇': { weight: 15, value: 4 },
      '🍀': { weight: 8, value: 6 },
      '💎': { weight: 5, value: 10 },
      '👑': { weight: 3, value: 15 },
      '🎯': { weight: 2, value: 20 },
      '💰': { weight: 1, value: 50 }
    };

    // Generate weighted random symbol
    const getRandomSymbol = () => {
      const totalWeight = Object.values(symbols).reduce((sum, s) => sum + s.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const [symbol, data] of Object.entries(symbols)) {
        random -= data.weight;
        if (random <= 0) return symbol;
      }
      return '🍒'; // fallback
    };

    // Spin the slots
    const slot1 = getRandomSymbol();
    const slot2 = getRandomSymbol();
    const slot3 = getRandomSymbol();

    // Calculate winnings
    let winnings = 0;
    let winType = '';

    if (slot1 === slot2 && slot2 === slot3) {
      // Jackpot - all three match
      winnings = Math.floor(betAmount * symbols[slot1].value);
      winType = 'JACKPOT! 🎉';
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      // Two match
      const matchingSymbol = slot1 === slot2 ? slot1 : (slot2 === slot3 ? slot2 : slot1);
      winnings = Math.floor(betAmount * symbols[matchingSymbol].value * 0.5);
      winType = 'Two Match! 🎊';
    } else {
      // No match - lose bet
      winnings = -betAmount;
      winType = 'No Match 😔';
    }

    // Special jackpot bonus for rare symbols
    if (slot1 === slot2 && slot2 === slot3) {
      if (slot1 === '💰') {
        winnings *= 2;
        winType = 'MEGA JACKPOT! 💰✨';
      } else if (slot1 === '🎯') {
        winnings = Math.floor(winnings * 1.5);
        winType = 'SUPER JACKPOT! 🎯🔥';
      }
    }

    // Update balance and cooldown
    await currency.addBalance(userId, winnings);
    await currency.setSlotsCooldown(userId, Date.now());

    const newBalance = await currency.getBalance(userId);

    // Create the slots display
    const slotsDisplay = `
    ╔═══════════════╗
    ║ ${slot1} ║ ${slot2} ║ ${slot3} ║
    ╚═══════════════╝`;

    const embed = new MessageEmbed()
      .setTitle('🎰 Slot Machine Results!')
      .setDescription(`\`\`\`${slotsDisplay}\`\`\``)
      .setColor(winnings > 0 ? '#00ff00' : '#ff6b6b')
      .addFields(
        { name: '🎲 Result', value: winType, inline: true },
        { name: '💰 Bet Amount', value: currency.formatCurrency(betAmount), inline: true },
        { name: winnings > 0 ? '🎉 Winnings' : '💸 Lost', value: currency.formatCurrency(Math.abs(winnings)), inline: true },
        { name: '💳 New Balance', value: currency.formatCurrency(newBalance), inline: false }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter('🎰 Spin again in 1 minute!')
      .setTimestamp();

    // Add special messages
    if (winnings > betAmount * 10) {
      embed.addFields(
        { name: '🌟 Amazing!', value: 'You hit a massive jackpot!', inline: false }
      );
    } else if (winnings > betAmount * 5) {
      embed.addFields(
        { name: '🎊 Nice!', value: 'Great win!', inline: false }
      );
    } else if (winnings === -betAmount) {
      const encouragement = [
        'Better luck next time!',
        'The house always wins... sometimes',
        'Don\'t give up!',
        'Try a different bet amount!',
        'Fortune favors the bold!'
      ];
      embed.addFields(
        { name: '🎲 Keep Playing!', value: encouragement[Math.floor(Math.random() * encouragement.length)], inline: false }
      );
    }

    await message.channel.send({ embeds: [embed] });
  }
};