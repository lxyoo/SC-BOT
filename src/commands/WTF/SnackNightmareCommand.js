const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class SnackNightmareCommand extends BaseCommand {
  constructor() {
    super('snacknightmare', 'WTF', ['snack', 'food']);
  }

  async run(client, message, args) {
    const snacks1 = ['Pickles', 'Ice cream', 'Cereal', 'Pizza', 'Cookies', 'Chips', 'Chocolate', 'Popcorn'];
    const snacks2 = ['Hot sauce', 'Peanut butter', 'Marshmallows', 'Bacon', 'Cheese', 'Honey', 'Mustard', 'Ketchup'];
    const weird = ['Toothpaste', 'Soap', 'Dirt', 'Paper', 'Glue', 'Chalk', 'Rubber', 'Concrete'];

    const ratings = [
      'Absolutely Disgusting',
      'Questionable Life Choices',
      'Mildly Concerning',
      'Surprisingly Decent',
      'Actually Good',
      'Gourmet Level',
      'Gordon Ramsay Approved',
      'Instant Death'
    ];

    const deaths = [
      'You die from food poisoning after trying your own creation.',
      'Gordon Ramsay appears and murders you for crimes against cuisine.',
      'The combination is so terrible it opens a portal to hell.',
      'A food critic tastes it and dies, then haunts you as a vengeful spirit.',
      'The snack becomes sentient and eats you instead.',
      'You choke on your own terrible decision-making.'
    ];

    const snack1 = snacks1[Math.floor(Math.random() * snacks1.length)];
    const snack2 = snacks2[Math.floor(Math.random() * snacks2.length)];
    const weirdness = Math.random() < 0.3 ? weird[Math.floor(Math.random() * weird.length)] : '';

    const combo = weirdness ? `${snack1} + ${snack2} + ${weirdness}` : `${snack1} + ${snack2}`;
    const rating = ratings[Math.floor(Math.random() * ratings.length)];
    const deathSnack = deaths[Math.floor(Math.random() * deaths.length)];

    const snackEmbed = new MessageEmbed()
      .setTitle('Snack Attack Generator')
      .setDescription('**Your cursed snack combination:**')
      .setColor('#FFD700')
      .addField('Snack Combo', combo)
      .addField('⭐ Rating', rating)
      .addField('Weirdness Level', `${Math.floor(Math.random() * 10) + 1}/10`)
      .addField('Health Risk', deathSnack)
      .addField('Doctor\'s Note', 'Patient is clearly insane')
      .addField('Warning', 'Do not attempt at home or anywhere')
      .setFooter({ text: 'The Snack Attack Generator is not responsible for any deaths.' })
      .setTimestamp();

    await message.reply({ embeds: [snackEmbed] });
  }
}