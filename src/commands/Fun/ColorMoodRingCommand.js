const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class ColorMoodRingCommand extends BaseCommand {
  constructor() {
    super('colormoodring', 'fun', ['color', 'mood', 'ring']);
  }

  async run(client, message, args) {
    const moods = {
      '#FF0000': { mood: 'Homicidal Rage', desc: 'You want to murder everyone, especially that one person who chews loudly.' },
      '#00FF00': { mood: 'Toxic Positivity', desc: 'You\'re so positive it\'s concerning. People cross the street to avoid you.' },
      '#0000FF': { mood: 'Existential Dread', desc: 'You\'re questioning the meaning of life and why hot dogs come in packs of 10 but buns in packs of 8.' },
      '#FFFF00': { mood: 'Manic Happiness', desc: 'You\'re so happy it\'s terrifying. Even serial killers are concerned.' },
      '#FF00FF': { mood: 'Chaotic Neutral', desc: 'You might help an old lady cross the street or accidentally start a revolution.' },
      '#800080': { mood: 'Impending Doom', desc: 'You can sense your death approaching. It\'s probably that bear in the forest.' },
      '#FFA500': { mood: 'Aggressively Confused', desc: 'You\'re confused but angry about it. Very angry.' },
      '#000000': { mood: 'Void of Emotion', desc: 'You feel nothing. Even the mime trapped in a box feels bad for you.' }
    };

    const deaths = [
      'Your mood is so intense it attracts every dangerous animal in a 5-mile radius.',
      'You die from your own emotional whiplash.',
      'A therapist takes one look at your mood ring and has a heart attack.',
      'Your mood becomes so toxic it creates a small black hole.',
      'You get so moody that even your pet conspiracy theorist goldfish abandons you.'
    ];

    const colors = Object.keys(moods);
    const selectedColor = colors[Math.floor(Math.random() * colors.length)];
    const moodData = moods[selectedColor];
    const death = deaths[Math.floor(Math.random() * deaths.length)];

    // Try to change user's role color (if bot has permissions)
    try {
      const guild = message.guild;
      const member = guild.members.cache.get(message.author.id);
      
      // Find or create a mood role
      let moodRole = guild.roles.cache.find(role => role.name === `Mood-${moodData.mood}`);
      if (!moodRole) {
        moodRole = await guild.roles.create({
          name: `Mood-${moodData.mood}`,
          color: selectedColor,
          reason: 'Mood ring color change'
        });
      }
      
      // Remove old mood roles
      const oldMoodRoles = member.roles.cache.filter(role => role.name.startsWith('Mood-'));
      await member.roles.remove(oldMoodRoles);
      
      // Add new mood role
      await member.roles.add(moodRole);
    } catch (error) {
      console.log('Could not change role color:', error);
    }

    const embed = new MessageEmbed()
      .setTitle('Mood Ring Analysis')
      .setDescription('**Your current emotional state has been detected!**')
      .setColor(selectedColor)
      .addField('Ring Color:', selectedColor)
      .addField('Current Mood:', moodData.mood)
      .addField('Mood Description:', moodData.desc)
      .addField('Warning Level:', `${Math.floor(Math.random() * 10) + 1}/10`)
      .addField('Mood-Related Death:', death)
      .addField('Recommended Treatment:', 'Touch grass (if you survive that long)')
      .setFooter('Mood ring accuracy: 3%. Results may vary. Side effects include death.')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};