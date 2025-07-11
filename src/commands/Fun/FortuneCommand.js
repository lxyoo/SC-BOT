const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class FortuneCommand extends BaseCommand {
  constructor() {
    super('fortune', 'Fun', ['predict', 'future', 'oracle']);
  }

  async run(client, message, args) {
    const fortunes = [
      "You will find exactly 47 bananas in your future, but beware of the 48th one.",
      "A mysterious stranger will offer you a sandwich made of dreams and regret.",
      "Your left sock will achieve enlightenment before you do.",
      "You will discover that your pet goldfish has been plotting world domination.",
      "A rubber duck will change your life in ways you never imagined.",
      "You will become famous for inventing a new way to eat cereal.",
      "Your future holds 3.7 unicorns, 2 dragons, and a very confused penguin.",
      "You will have a profound conversation with a vending machine next Tuesday.",
      "A pizza slice will reveal the meaning of life to you, but only if it has pineapple.",
      "You will time travel to last week and forget to bring yourself back.",
      "Your destiny involves becoming best friends with a sentient houseplant.",
      "You will win a staring contest against a mirror and question reality.",
      "A toaster will become your spiritual advisor and guide you to enlightenment.",
      "You will discover that your shadow has been living a double life.",
      "Your future contains exactly 2,847 cups of coffee and one very important donut.",
      "You will accidentally become the ruler of a small island nation of penguins.",
      "A squirrel will teach you the ancient art of nut collection meditation.",
      "You will invent a new emotion that will be named after a type of pasta.",
      "Your life will be changed forever by a fortune cookie that contains another fortune cookie.",
      "You will discover that your reflection has been charging you rent for using mirrors.",
      "A magical elevator will take you to the 13th floor of a 12-story building.",
      "You will have a deep philosophical discussion with a confused GPS system.",
      "Your future holds a dance battle with a traffic cone and you will surprisingly lose.",
      "You will find the lost city of Atlantis in your neighbor's swimming pool.",
      "A wise old owl will give you stock tips that only work on Wednesdays.",
      "You will become fluent in the language of automatic doors.",
      "Your destiny involves teaching a cat how to file taxes.",
      "You will discover that your microwave has been writing poetry about leftovers.",
      "A fortune teller will predict that you will visit a fortune teller (it's me, hi).",
      "You will find true love in aisle 7 of a grocery store, next to the pickles.",
      "Your future contains a quest to find the world's most comfortable chair.",
      "You will accidentally solve world hunger by inventing edible packaging.",
      "A magical coffee mug will grant you three wishes, but they all involve coffee.",
      "You will discover that your car has been taking scenic routes to make you late.",
      "Your life will be forever changed by a motivational poster featuring a demotivated cat.",
      "You will become the world's first professional cloud namer.",
      "A wise fortune cookie will tell you to stop eating so many fortune cookies.",
      "You will find a portal to another dimension behind your washing machine.",
      "Your future involves becoming a translator for confused emojis.",
      "You will discover that your house plants have been gossiping about you.",
      "A mysterious package will arrive containing nothing but smaller packages.",
      "You will achieve world peace by inventing a more comfortable office chair.",
      "Your destiny is to become the world's most confused time traveler.",
      "You will find the secret to happiness in a box of discontinued cereal.",
      "A talking calculator will become your life coach and math tutor.",
      "You will discover that your reflection has been taking selfies without you.",
      "Your future contains a heated debate with a smart refrigerator about healthy eating.",
      "You will accidentally become famous for your unique way of walking up stairs.",
      "A magical pen will write your destiny, but it keeps running out of ink.",
      "You will find inner peace by arguing with a GPS that insists you're in the ocean."
    ];

    const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    const confidence = Math.floor(Math.random() * 40) + 60; // 60-100% confidence
    const timeline = this.generateTimeline();

    const embed = new MessageEmbed()
      .setTitle('🔮 Fortune Teller')
      .setDescription(`**${message.author.username}**, I am not looking into your future, and I\'m a liar...`)
      .setColor('#9932CC')
      .addFields(
        { name: 'Your Fortune', value: randomFortune, inline: false },
        { name: 'Confidence Level', value: `${confidence}%`, inline: true },
        { name: 'Timeline', value: timeline, inline: true },
        { name: 'Lucky Numbers', value: this.generateLuckyNumbers(), inline: true }
      )
      .setThumbnail('https://i.imgur.com/crystal-ball.png')
      .setFooter('Fortunes are 99.9999998% accurate. (Results may vary)')

    // Add mystical effects
    const mysticalEmojis = ['🌟', '✨', '🔮', '🌙', '⭐', '🎭', '🎪'];
    const randomEmoji = mysticalEmojis[Math.floor(Math.random() * mysticalEmojis.length)];

    // Special fortunes for certain users
    if (message.author.username.toLowerCase().includes('najim')) {
      embed.addFields(
        { name: '👑 Special Vision', value: 'I see... legendary status in your future. You are destined for greatness!', inline: false }
      );
    }

    await message.channel.send({ embeds: [embed] });
  }

  generateTimeline() {
    const timelines = [
      'Within the next 3.7 days',
      'Before you finish reading this',
      'On a Tuesday that falls on a Wednesday',
      'After you find your matching sock',
      'When the moon is in the seventh house',
      'Before your next existential crisis',
      'During the great donut shortage of 2024',
      'After you learn to speak fluent cat',
      'When pigs fly (check your local weather)',
      'Before the next solar eclipse',
      'When you least expect it (so... now?)',
      'After you master the art of not stepping on LEGO'
    ];
    
    return timelines[Math.floor(Math.random() * timelines.length)];
  }

  generateLuckyNumbers() {
    const numbers = [];
    for (let i = 0; i < 3; i++) {
      numbers.push(Math.floor(Math.random() * 100) + 1);
    }
    return numbers.join(', ');
  }
};