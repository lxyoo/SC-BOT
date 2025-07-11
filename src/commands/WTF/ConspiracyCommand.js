const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class ConspiracyGeneratorCommand extends BaseCommand {
  constructor() {
    super('conspiracy-generator', 'fun', ['conspiracy', 'theory']);
  }

  async run(client, message, args) {
    const objects = ['toasters', 'rubber ducks', 'shoelaces', 'coffee cups', 'doorknobs', 'staplers', 'toilet paper', 'banana peels'];
    const actions = ['are plotting world domination', 'are government spy devices', 'are secretly alive', 'are time machines', 'are portals to other dimensions'];
    const consequences = ['to steal your socks', 'to make you stub your toe', 'to count your steps', 'to judge your life choices', 'to report back to aliens'];
    const deaths = [
      'You investigated too deep and got assassinated by a particularly vindictive stapler.',
      'The rubber duck mafia put a hit on you after you discovered their bath-time surveillance network.',
      'Your toaster achieved sentience and decided you were too dangerous to live.',
      'The shoelace illuminati tied you up in their own conspiracy.',
      'You were eliminated by the International Coffee Cup Cartel for knowing too much.'
    ];

    const obj = objects[Math.floor(Math.random() * objects.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const consequence = consequences[Math.floor(Math.random() * consequences.length)];
    const death = deaths[Math.floor(Math.random() * deaths.length)];

    const embed = new MessageEmbed()
      .setTitle('🕵️‍♂️ CONSPIRACY THEORY GENERATOR')
      .setDescription(`**THE TRUTH THEY DON'T WANT YOU TO KNOW:**`)
      .setColor('#800080')
      .addField('🔍 The Theory:', `${obj.toUpperCase()} ${action} ${consequence}!`)
      .addField('📋 Evidence Level:', `${Math.floor(Math.random() * 10) + 1}/10 (Completely Made Up)`)
      .addField('🌍 Global Impact:', 'Moderate to Severe Confusion')
      .addField('💀 Your Fate:', death)
      .addField('🤫 Secrecy Level:', 'Everyone knows but pretends not to')
      .setFooter('Remember: Just because you\'re paranoid doesn\'t mean the toasters aren\'t out to get you.')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};