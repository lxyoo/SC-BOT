const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class KitchenNightmaresCommand extends BaseCommand {
  constructor() {
    super('kitchennightmares', 'WTF', ['gordon', 'roast', 'cooking']);
  }

  async run(client, message, args) {
    const cookingAttempt = args.join(' ') || 'microwave ramen';
    
    const gordonRoasts = [
      `"${cookingAttempt}"?! ARE YOU KIDDING ME?! I've seen prison food with more creativity! You muppet!`,
      `This ${cookingAttempt} is so bad, it makes hospital food look like fine dining! DISGRACEFUL!`,
      `What is this?! Did you cook this with your FEET?! Even my dog wouldn't eat this ${cookingAttempt}!`,
      `This ${cookingAttempt} is so raw it's still breathing! GET OUT OF MY KITCHEN!`,
      `I've seen car accidents more appealing than this ${cookingAttempt}! You donkey!`,
      `This ${cookingAttempt} is so dry, the Sahara Desert is jealous! TERRIBLE!`,
      `You call this ${cookingAttempt}?! I call it a war crime! SHUT IT DOWN!`,
      `This ${cookingAttempt} is colder than my ex-wife's heart! PATHETIC!`,
      `I wouldn't feed this ${cookingAttempt} to my worst enemy! It's absolutely dreadful!`,
      `This ${cookingAttempt} has killed more people than a serial killer with UK zombie knives!`
    ];

    const deaths = [
      'Gordon Ramsay roasts you so hard you spontaneously combust.',
      'The shame of your cooking kills you instantly.',
      'Your food is so bad it becomes sentient and murders you.',
      'A food critic tastes it and dies, then haunts you to death.',
      'You choke on your own terrible cooking.',
      'The health inspector takes one look and has a heart attack.',
      'Your cooking is so toxic it creates a poisonous gas cloud.',
      'Gordon throws a pan at you and it becomes a lethal weapon.'
    ];

    const roast = gordonRoasts[Math.floor(Math.random() * gordonRoasts.length)];
    const death = deaths[Math.floor(Math.random() * deaths.length)];

    const embed = new MessageEmbed()
      .setTitle('Kitchen Nightmares')
      .setDescription('**Gordon Ramsay reviews your cooking attempt:**')
      .setColor('#FF0000')
      .addField('Your Dish:', cookingAttempt)
      .addField('Gordon\'s Verdict:', roast)
      .addField('Rating:', `${Math.floor(Math.random() * 2)}/10 (Being generous)`)
      .addField('Your Fate:', death)
      .addField('Health Inspector:', 'Currently throwing up')
      .addField('TV Rating:', 'Banned from television')
      .addField('Kitchen Status:', 'SHUT DOWN IMMEDIATELY')
      .setFooter('Gordon Ramsay is not responsible for any deaths caused by terrible cooking.')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};