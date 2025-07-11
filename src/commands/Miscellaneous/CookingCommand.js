const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');
const currency = require('../../utils/currency');

module.exports = class CookingCommand extends BaseCommand {
  constructor() {
    super('cooking', 'Miscellaneous', ['cook', 'recipe', 'chef']);
  }

  async run(client, message, args) {
    const ingredients = [
      'chocolate', 'vanilla', 'strawberry', 'banana', 'apple', 'orange', 'lemon', 'lime',
      'chicken', 'beef', 'pork', 'fish', 'shrimp', 'lobster', 'crab', 'salmon',
      'rice', 'pasta', 'bread', 'flour', 'sugar', 'salt', 'pepper', 'garlic',
      'onion', 'tomato', 'potato', 'carrot', 'broccoli', 'spinach', 'mushroom',
      'cheese', 'milk', 'butter', 'cream', 'yogurt', 'egg', 'honey', 'syrup',
      'hot sauce', 'ketchup', 'mustard', 'mayo', 'vinegar', 'oil', 'wine',
      'pickles', 'olives', 'bacon', 'sausage', 'ham', 'turkey', 'lettuce',
      'cucumber', 'avocado', 'bell pepper', 'corn', 'beans', 'nuts', 'seeds',
      'cinnamon', 'nutmeg', 'ginger', 'basil', 'oregano', 'thyme', 'rosemary',
      'expired milk', 'rubber bands', 'old socks', 'glue', 'soap', 'toothpaste'
    ];

    const cookingMethods = [
      'boil', 'fry', 'bake', 'grill', 'steam', 'roast', 'sauté', 'stir-fry',
      'microwave', 'deep-fry', 'poach', 'braise', 'stew', 'smoke', 'char',
      'freeze', 'blend', 'whisk', 'mash', 'dice', 'slice', 'chop', 'puree',
      'ferment', 'pickle', 'marinate', 'season', 'glaze', 'caramelize',
      'throw at the wall', 'pray over', 'sing to', 'dance with', 'threaten'
    ];

    const randomIngredients = [];
    for (let i = 0; i < 5; i++) {
      const ingredient = ingredients[Math.floor(Math.random() * ingredients.length)];
      if (!randomIngredients.includes(ingredient)) {
        randomIngredients.push(ingredient);
      }
    }

    const cookingMethod = cookingMethods[Math.floor(Math.random() * cookingMethods.length)];
    const difficulty = Math.floor(Math.random() * 5) + 1;

    const embed = new MessageEmbed()
      .setTitle('Cooking Challenge')
      .setDescription(`Create a recipe using these ingredients!`)
      .setColor('#FF6B35')
      .addFields(
        { name: 'Required Ingredients', value: randomIngredients.join(', '), inline: false },
        { name: 'Cooking Method', value: cookingMethod, inline: true },
        { name: 'Difficulty', value: `${difficulty}/5 stars`, inline: true },
        { name: 'Instructions', value: 'Reply with your creative recipe! Most creative wins 300 Yen!', inline: false }
      )
      .setThumbnail('https://i.imgur.com/chef-hat.png')
      .setFooter('You have 3 minutes to create your masterpiece!');

    const challengeMessage = await message.channel.send({ embeds: [embed] });

    const recipes = [];
    const collector = message.channel.createMessageCollector({
      time: 180000, // 3 minutes
      filter: (msg) => !msg.author.bot && msg.content.length > 20
    });

    collector.on('collect', (msg) => {
      recipes.push({
        user: msg.author,
        recipe: msg.content,
        creativity: this.calculateCreativity(msg.content, randomIngredients)
      });
    });

    collector.on('end', async () => {
      if (recipes.length === 0) {
        const noRecipesEmbed = new MessageEmbed()
          .setTitle('No Recipes Submitted')
          .setDescription('No one submitted a recipe! The ingredients remain unused.')
          .setColor('#FF6B6B');
        
        return message.channel.send({ embeds: [noRecipesEmbed] });
      }

      // Find the most creative recipe
      const winner = recipes.reduce((prev, current) => {
        return (prev.creativity > current.creativity) ? prev : current;
      });

      // Award Yen to winner
      await currency.addBalance(winner.user.id, 300);

      const resultsEmbed = new MessageEmbed()
        .setTitle('Cooking Challenge Results')
        .setDescription(`We have a winner!`)
        .setColor('#00FF00')
        .addFields(
          { name: 'Winning Chef', value: winner.user.username, inline: true },
          { name: 'Creativity Score', value: `${winner.creativity}/10`, inline: true },
          { name: 'Prize', value: '300 Yen', inline: true },
          { name: 'Winning Recipe', value: winner.recipe.slice(0, 500) + (winner.recipe.length > 500 ? '...' : ''), inline: false }
        )
        .setThumbnail(winner.user.displayAvatarURL({ dynamic: true }))
        .setFooter(`${recipes.length} recipes submitted`);

      // Show runner-ups if there are any
      if (recipes.length > 1) {
        const runnerUps = recipes
          .filter(r => r.user.id !== winner.user.id)
          .sort((a, b) => b.creativity - a.creativity)
          .slice(0, 2);

        if (runnerUps.length > 0) {
          const runnerUpText = runnerUps.map((r, i) => `${i + 2}. ${r.user.username} (${r.creativity}/10)`).join('\n');
          resultsEmbed.addFields(
            { name: 'Runner-ups', value: runnerUpText, inline: false }
          );
        }
      }

      await message.channel.send({ embeds: [resultsEmbed] });
    });
  }

  calculateCreativity(recipe, ingredients) {
    let score = 0;
    
    // Points for using required ingredients
    ingredients.forEach(ingredient => {
      if (recipe.toLowerCase().includes(ingredient.toLowerCase())) {
        score += 2;
      }
    });

    // Points for length and effort
    if (recipe.length > 100) score += 1;
    if (recipe.length > 200) score += 1;
    if (recipe.length > 300) score += 1;

    // Points for creativity keywords
    const creativeWords = ['unique', 'special', 'secret', 'magical', 'amazing', 'incredible', 'fusion', 'twist'];
    creativeWords.forEach(word => {
      if (recipe.toLowerCase().includes(word)) {
        score += 1;
      }
    });

    return Math.min(10, score);
  }
};