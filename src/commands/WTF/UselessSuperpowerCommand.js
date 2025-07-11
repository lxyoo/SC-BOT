const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class UselessSuperpower extends BaseCommand {
  constructor() {
    super('uselessuperpower', 'fun', ['uselesssuperpower', 'powers']);
  }

  async run(client, message, args) {
    const adjectives = ['Mighty', 'Invisible', 'Flying', 'Telepathic', 'Elastic', 'Flaming', 'Frozen', 'Quantum'];
    const nouns = ['Banana', 'Toaster', 'Shoelace', 'Rubber Duck', 'Coffee Cup', 'Stapler', 'Doorknob', 'Spatula'];
    const uselessPowers = [
      'Can make toast slightly warm',
      'Speaks fluent pigeon',
      'Can untie any shoelace with mind',
      'Turns invisible only when no one is looking',
      'Can fly but only downwards',
      'Super strength but only when lifting feathers',
      'Can read minds but only knows what people had for breakfast',
      'Can time travel but only to last Tuesday'
    ];

    const weaknesses = [
      'Allergic to their own cape',
      'Powers only work on weekdays',
      'Defeated by strongly worded letters',
      'Kryptonite is actually just glitter',
      'Can only save people who say "please"',
      'Powers shut down during commercials',
      'Weakness: seeing their own reflection',
      'Defeated by anyone who doesn\'t believe in them'
    ];

    const deaths = [
      'Dies trying to save a cat that turns out to be a very patient lion.',
      'Gets defeated by a toddler who questions their logic.',
      'Dies from their own cape getting caught in a revolving door.',
      'Gets assassinated by the International Doorknob Conspiracy.',
      'Dies from embarrassment when their weakness is revealed on live TV.'
    ];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const power = uselessPowers[Math.floor(Math.random() * uselessPowers.length)];
    const weakness = weaknesses[Math.floor(Math.random() * weaknesses.length)];
    const death = deaths[Math.floor(Math.random() * deaths.length)];

    const embed = new MessageEmbed()
      .setTitle('🦸‍♂️ Your Superhero Identity!')
      .setDescription(`**Meet your new alter ego!**`)
      .setColor('#FF4500')
      .addField('🦸‍♀️ Hero Name:', `The ${adj} ${noun}`)
      .addField('💪 Superpower:', power)
      .addField('😰 Fatal Weakness:', weakness)
      .addField('🌟 Usefulness Rating:', `${Math.floor(Math.random() * 3) + 1}/10`)
      .addField('💀 Inevitable Demise:', death)
      .addField('🎭 Secret Identity:', `${message.author.username} (not very secret)`)
      .setFooter('With great power comes great responsibility... and apparently great stupidity.')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};