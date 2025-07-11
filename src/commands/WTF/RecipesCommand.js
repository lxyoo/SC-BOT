const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class RecipesCommand extends BaseCommand {
  constructor() {
    super('recipes', 'WTF', []);
  }

  async run(client, message, args) {
    const recipes = [
      {
        name: 'Spaghetti Carbonara',
        normal: 'Cook pasta, mix with eggs, cheese, and bacon',
        disaster: 'Cook pasta in battery acid, mix with bear eggs, moldy cheese, and bacon from Quasimodo'
      },
      {
        name: 'Chocolate Cake',
        normal: 'Mix flour, sugar, cocoa, bake at 350°F',
        disaster: 'Mix concrete, salt, dirt, bake at 2000°F until it achieves nuclear fusion'
      },
      {
        name: 'Chicken Soup',
        normal: 'Boil chicken with vegetables and broth',
        disaster: 'Boil a live chicken with poisonous mushrooms and tears of your enemies'
      },
      {
        name: 'Pancakes',
        normal: 'Mix flour, eggs, milk, cook on griddle',
        disaster: 'Mix sawdust, ostrich eggs, spoiled milk, cook on the surface of the sun'
      }
    ];

    const deaths = [
      'You die from food poisoning after following the disaster recipe.',
      'Gordon Ramsay appears and murders you for crimes against cuisine.',
      'The recipe becomes sentient and eats you instead.',
      'You choke on your own terrible cooking decisions.',
      'A food critic tastes your creation and dies, then haunts you forever.',
      'Your kitchen explodes from the sheer absurdity of the recipe.'
    ];

    const selectedRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    const death = deaths[Math.floor(Math.random() * deaths.length)];

    const embed = new MessageEmbed()
      .setTitle(`**Today's Recipe: ${selectedRecipe.name}**`)
      .setColor('#b00b69')
      .addField('Normal Recipe:', selectedRecipe.normal)
      .addField('DISASTER Recipe:', selectedRecipe.disaster)
      .addField('Survival Rate:', `${Math.floor(Math.random() * 5) + 1}%`)
      .addField(`Guess what?`, `${death}`)
      .addField('Gordon Ramsay Says:', 'What the bloody hell is this?!')

    await message.reply({ embeds: [embed] });
  }
};