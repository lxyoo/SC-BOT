const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class TimeCapsuleCommand extends BaseCommand {
  constructor() {
    super('time-capsule', 'fun', ['capsule', 'future']);
  }

  async run(client, message, args) {
    const capsuleMessage = args.join(' ');
    
    if (!capsuleMessage) {
      return message.reply('You need to provide a message for your time capsule! Like "I hope I survive the day without getting mauled by a bear."');
    }

    const deaths = [
      'Your time capsule was buried next to a cemetery. A zombie dug it up, read your message, and died of cringe.',
      'A time traveler from tomorrow came back to tell you that your future self gets eaten by a particularly vindictive dictionary.',
      'Your time capsule message was so boring that it created a black hole of mediocrity.',
      'Future you gets trampled by a stampede of soccer moms fighting over milk. Your time capsule becomes evidence.',
      'A pigeon steals your time capsule and drops it on your head exactly 24 hours later.'
    ];

    const embed = new MessageEmbed()
      .setTitle('📦 Time Capsule Buried!')
      .setDescription(`**Your Message:** "${capsuleMessage}"`)
      .setColor('#8B4513')
      .addField('Will be delivered in:', '24 hours')
      .addField('Probability of survival:', '12%')
      .addField('Likely cause of death:', deaths[Math.floor(Math.random() * deaths.length)])
      .setFooter('Assuming you survive that long...');

    await message.reply({ embeds: [embed] });

    // Schedule delivery for 24 hours
    setTimeout(async () => {
      const deliveryEmbed = new MessageEmbed()
        .setTitle('Time Capsule Delivery!')
        .setDescription(`**From 24 hours ago:** "${capsuleMessage}"`)
        .setColor('#FFD700')
        .addField('Congratulations!', 'You survived! Against all odds!')
        .addField('Plot twist:', 'This message delivery killed you via surprise heart attack.')
        .setFooter('Should have stayed in the past...');

      message.reply({ embeds: [deliveryEmbed] });
    }, 24 * 60 * 60 * 1000); // 24 hours
  }
};