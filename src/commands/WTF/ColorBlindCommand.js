const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = class ColorBlindCommand extends BaseCommand {
  constructor() {
    super('colorblind', 'WTF', ['color', 'blind', 'test']);
  }

  async run(client, message, args) {
    const fakeColors = [
      { name: 'Existential Beige', hex: '#F5F5DC', description: 'The color of giving up on life' },
      { name: 'Aggressive Chartreuse', hex: '#7FFF00', description: 'This color wants to fight you' },
      { name: 'Depressed Blue', hex: '#0000FF', description: 'Like regular blue but sadder' },
      { name: 'Anxiety Orange', hex: '#FFA500', description: 'Makes you worry about everything' },
      { name: 'Murderous Magenta', hex: '#FF00FF', description: 'Has killed before and will kill again' },
      { name: 'Suicidal Salmon', hex: '#FA8072', description: 'Wants to throw itself upstream' },
      { name: 'Homicidal Honey', hex: '#FFD700', description: 'Sweet but deadly' },
      { name: 'Pessimistic Purple', hex: '#800080', description: 'Expects the worst from everyone' }
    ];

    const deaths = [
      'You die from the shock of learning colors have emotions.',
      'The fake color names are so stupid your brain shuts down.',
      'You become colorblind from staring at the screen too long.',
      'A serial killer uses your confusion to eliminate you with UK zombie knives.',
      'The colors become sentient and murder you for mocking them.',
      'You die from embarrassment at falling for such an obvious fake test.'
    ];

    const selectedColor = fakeColors[Math.floor(Math.random() * fakeColors.length)];
    const wrongColors = fakeColors.filter(c => c !== selectedColor).slice(0, 3);
    const allOptions = [selectedColor, ...wrongColors].sort(() => Math.random() - 0.5);

    const embed = new MessageEmbed()
      .setTitle('Color Blind Test')
      .setDescription('**What color do you see?**')
      .setColor(selectedColor.hex)
      .addField('Instructions:', 'Look at this color and select what you see below')
      .addField('Warning:', 'This test is 100% scientifically accurate')
      .addField('Side Effects:', deaths[Math.floor(Math.random() * deaths.length)])
      .setFooter('Color Vision Institute (Totally Legitimate)')
      .setTimestamp();

    const row = new MessageActionRow()
      .addComponents(
        allOptions.map((color, index) =>
          new MessageButton()
            .setCustomId(`color_${index}`)
            .setLabel(color.name)
            .setStyle('PRIMARY')
        )
      );

    const testMessage = await message.reply({ embeds: [embed], components: [row] });

    const collector = testMessage.createMessageComponentCollector({
      time: 30000,
      max: 1
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'This isn\'t your color test!', ephemeral: true });
      }

      const selectedOption = allOptions[parseInt(interaction.customId.split('_')[1])];
      const isCorrect = selectedOption.name === selectedColor.name;

      const resultEmbed = new MessageEmbed()
        .setTitle(isCorrect ? 'Test Passed!' : 'Test Failed!')
        .setDescription(isCorrect ?
          `Correct! You saw **${selectedColor.name}**\n\n${selectedColor.description}` :
          `Wrong! You saw **${selectedOption.name}** but it was actually **${selectedColor.name}**\n\n${selectedColor.description}`)
        .setColor(isCorrect ? '#00FF00' : '#FF0000')
        .addField('Your Color Vision:', isCorrect ? 'Perfect (surprisingly)' : 'Completely broken')
        .addField('Medical Recommendation:', isCorrect ? 'See a therapist for other issues' : 'Avoid driving, art, and life')
        .addField('Survival Chances:', isCorrect ? '12%' : '0%')
        .setFooter('This test is not medically accurate. Please consult a real doctor.')
        .setTimestamp();

      await interaction.update({ embeds: [resultEmbed], components: [] });
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = new MessageEmbed()
          .setTitle('Test Timeout!')
          .setDescription('You took too long to identify the color!')
          .setColor('#FF0000')
          .addField('Diagnosis:', 'Severe procrastination-induced color blindness')
          .addField('Treatment:', 'Learn to make decisions faster')
          .setFooter('Speed is essential for survival!');

        testMessage.edit({ embeds: [timeoutEmbed], components: [] });
      }
    });
  }
};