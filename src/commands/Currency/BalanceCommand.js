const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');
const currency = require('../../utils/currency');

module.exports = class BalanceCommand extends BaseCommand {
  constructor() {
    super('balance', 'Currency', ['bal', 'money', 'yen']);
  }

  async run(client, message, args) {
    const target = message.mentions.users.first() || message.author;
    const balance = await currency.getBalance(target.id);

    const embed = new MessageEmbed()
      .setTitle(`💰 ${target.username}'s Balance`)
      .setDescription(`**${currency.formatCurrency(balance)}**`)
      .setColor('#00ff00')
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '💴 Currency', value: currency.currencyName, inline: true },
        { name: '🏦 Bank Status', value: balance > 0 ? 'Active' : 'Broke', inline: true },
        { name: '📊 Wealth Level', value: this.getWealthLevel(balance), inline: true }
      )
      .setFooter(`${target.tag}`, target.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    // Add funny messages based on balance
    if (balance === 0) {
      embed.setDescription(`**${currency.formatCurrency(balance)}**\n\n *Completely broke! Time to get to work!*`);
    } else if (balance >= 1000000) {
      embed.setDescription(`**${currency.formatCurrency(balance)}**\n\n *Millionaire status achieved!*`);
    } else if (balance >= 100000) {
      embed.setDescription(`**${currency.formatCurrency(balance)}**\n\n *Living the dream!*`);
    } else if (balance >= 10000) {
      embed.setDescription(`**${currency.formatCurrency(balance)}**\n\n *Doing pretty well!*`);
    }

    await message.channel.send({ embeds: [embed] });
  }

  getWealthLevel(balance) {
    if (balance >= 1000000) return 'Millionaire';
    if (balance >= 500000) return 'Rich';
    if (balance >= 100000) return 'Wealthy';
    if (balance >= 50000) return 'Well-off';
    if (balance >= 10000) return 'Comfortable';
    if (balance >= 1000) return 'Stable';
    if (balance >= 100) return 'Getting There';
    return 'Broke Bum';
  }
};