const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const db = require('quick.db');

module.exports = class PetCommand extends BaseCommand {
  constructor() {
    super('pet', 'Miscellaneous', ['mypet', 'petcare', 'virtual']);
  }

  async run(client, message, args) {
    const subcommand = args[0];
    const userId = message.author.id;

    switch (subcommand) {
      case 'adopt':
        return this.adoptPet(message, userId);
      case 'feed':
        return this.feedPet(message, userId);
      case 'play':
        return this.playWithPet(message, userId);
      case 'stats':
      case 'status':
        return this.petStats(message, userId);
      case 'abandon':
        return this.abandonPet(message, userId);
      default:
        return this.showPetMenu(message, userId);
    }
  }

  async showPetMenu(message, userId) {
    const pet = await this.getPet(userId);

    if (!pet) {
      const embed = new MessageEmbed()
        .setTitle('🐾 Pet Simulator')
        .setDescription('You don\'t have a pet yet! Adopt one to get started.')
        .setColor('#ff6b6b')
        .addFields(
          { name: '🐕 Available Pets', value: 'Dog, Cat, Bird, Fish, Hamster, Rabbit, Snake, Lizard', inline: false },
          { name: '📝 Commands', value: '`!pet adopt` - Adopt a pet\n`!pet stats` - View pet stats\n`!pet feed` - Feed your pet\n`!pet play` - Play with your pet', inline: false }
        );

      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('adopt-pet')
            .setLabel('Adopt a Pet')
            .setStyle('PRIMARY')
            .setEmoji('🐾')
        );

      const msg = await message.channel.send({ embeds: [embed], components: [row] });

      const collector = msg.createMessageComponentCollector({
        filter: (interaction) => interaction.user.id === userId,
        time: 30000
      });

      collector.on('collect', async (interaction) => {
        if (interaction.customId === 'adopt-pet') {
          await this.adoptPet(message, userId, interaction);
        }
      });

      return;
    }

    // Show pet status
    const petEmoji = this.getPetEmoji(pet.type);
    const moodEmoji = this.getMoodEmoji(pet.happiness);
    const healthEmoji = this.getHealthEmoji(pet.health);

    const embed = new MessageEmbed()
      .setTitle(`${petEmoji} ${pet.name} the ${pet.type}`)
      .setDescription(`Your beloved ${pet.type.toLowerCase()} companion!`)
      .setColor(this.getPetColor(pet.type))
      .addFields(
        { name: '❤️ Health', value: `${healthEmoji} ${pet.health}/100`, inline: true },
        { name: '😊 Happiness', value: `${moodEmoji} ${pet.happiness}/100`, inline: true },
        { name: '🍖 Hunger', value: `${this.getHungerEmoji(pet.hunger)} ${pet.hunger}/100`, inline: true },
        { name: '🎂 Age', value: `${pet.age} days old`, inline: true },
        { name: '⏰ Last Fed', value: this.formatTimeSince(pet.lastFed), inline: true },
        { name: '🎮 Last Played', value: this.formatTimeSince(pet.lastPlayed), inline: true }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter(`Adopted ${this.formatTimeSince(pet.adoptedAt)} ago`);

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('feed-pet')
          .setLabel('Feed')
          .setStyle('PRIMARY')
          .setEmoji('🍖')
          .setDisabled(pet.hunger > 80),
        new MessageButton()
          .setCustomId('play-pet')
          .setLabel('Play')
          .setStyle('SUCCESS')
          .setEmoji('🎾')
          .setDisabled(pet.happiness > 80),
        new MessageButton()
          .setCustomId('pet-stats')
          .setLabel('Detailed Stats')
          .setStyle('SECONDARY')
          .setEmoji('📊'),
        new MessageButton()
          .setCustomId('pet-rename')
          .setLabel('Rename')
          .setStyle('SECONDARY')
          .setEmoji('✏️')
      );

    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === userId,
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      switch (interaction.customId) {
        case 'feed-pet':
          await this.feedPet(message, userId, interaction);
          break;
        case 'play-pet':
          await this.playWithPet(message, userId, interaction);
          break;
        case 'pet-stats':
          await this.petStats(message, userId, interaction);
          break;
        case 'pet-rename':
          await this.renamePet(message, userId, interaction);
          break;
      }
    });
  }

  async adoptPet(message, userId, interaction = null) {
    const existing = await this.getPet(userId);
    if (existing) {
      const embed = new MessageEmbed()
        .setTitle('🐾 Already Have a Pet!')
        .setDescription(`You already have ${existing.name} the ${existing.type}!`)
        .setColor('#ff6b6b');

      if (interaction) {
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return message.channel.send({ embeds: [embed] });
    }

    const petTypes = ['Dog', 'Cat', 'Bird', 'Fish', 'Hamster', 'Rabbit', 'Snake', 'Lizard'];
    const selectedType = petTypes[Math.floor(Math.random() * petTypes.length)];
    const petNames = this.generatePetNames(selectedType);
    const selectedName = petNames[Math.floor(Math.random() * petNames.length)];

    const pet = {
      name: selectedName,
      type: selectedType,
      health: 100,
      happiness: 100,
      hunger: 50,
      age: 0,
      adoptedAt: Date.now(),
      lastFed: Date.now(),
      lastPlayed: Date.now(),
      level: 1,
      experience: 0
    };

    await db.set(`pet_${userId}`, pet);

    const embed = new MessageEmbed()
      .setTitle('🎉 Pet Adopted!')
      .setDescription(`Congratulations! You've adopted **${selectedName}** the ${selectedType}!`)
      .setColor('#00ff00')
      .addFields(
        { name: '🐾 Pet Info', value: `**Name:** ${selectedName}\n**Type:** ${selectedType}\n**Level:** 1`, inline: false },
        { name: '💡 Getting Started', value: 'Use `!pet` to check on your pet\nFeed and play with them regularly!', inline: false }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

    if (interaction) {
      await interaction.update({ embeds: [embed], components: [] });
    } else {
      await message.channel.send({ embeds: [embed] });
    }
  }

  async feedPet(message, userId, interaction = null) {
    const pet = await this.getPet(userId);
    if (!pet) {
      return this.noPetError(message, interaction);
    }

    const now = Date.now();
    const timeSinceLastFed = now - pet.lastFed;
    const cooldown = 30 * 60 * 1000; // 30 minutes

    if (timeSinceLastFed < cooldown) {
      const remaining = cooldown - timeSinceLastFed;
      const embed = new MessageEmbed()
        .setTitle('🍖 Pet Not Hungry')
        .setDescription(`${pet.name} is still full! Wait ${this.formatTime(remaining)} before feeding again.`)
        .setColor('#ff6b6b');

      if (interaction) {
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return message.channel.send({ embeds: [embed] });
    }

    // Feed the pet
    pet.hunger = Math.min(100, pet.hunger + Math.floor(Math.random() * 30) + 20);
    pet.health = Math.min(100, pet.health + 5);
    pet.happiness = Math.min(100, pet.happiness + 10);
    pet.lastFed = now;
    pet.experience += 10;

    // Level up check
    const levelUp = this.checkLevelUp(pet);

    await db.set(`pet_${userId}`, pet);

    const foods = ['kibble', 'treats', 'fish', 'seeds', 'carrots', 'lettuce'];
    const selectedFood = foods[Math.floor(Math.random() * foods.length)];

    const embed = new MessageEmbed()
      .setTitle('🍖 Pet Fed!')
      .setDescription(`${pet.name} happily munches on ${selectedFood}!`)
      .setColor('#00ff00')
      .addFields(
        { name: '📈 Stats Updated', value: `Hunger: ${pet.hunger}/100\nHealth: +5\nHappiness: +10\nXP: +10`, inline: false }
      );

    if (levelUp) {
      embed.addFields(
        { name: '🎉 Level Up!', value: `${pet.name} is now level ${pet.level}!`, inline: false }
      );
    }

    if (interaction) {
      await interaction.update({ embeds: [embed], components: [] });
    } else {
      await message.channel.send({ embeds: [embed] });
    }
  }

  async playWithPet(message, userId, interaction = null) {
    const pet = await this.getPet(userId);
    if (!pet) {
      return this.noPetError(message, interaction);
    }

    const now = Date.now();
    const timeSinceLastPlayed = now - pet.lastPlayed;
    const cooldown = 20 * 60 * 1000; // 20 minutes

    if (timeSinceLastPlayed < cooldown) {
      const remaining = cooldown - timeSinceLastPlayed;
      const embed = new MessageEmbed()
        .setTitle('🎾 Pet Tired')
        .setDescription(`${pet.name} is tired! Wait ${this.formatTime(remaining)} before playing again.`)
        .setColor('#ff6b6b');

      if (interaction) {
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return message.channel.send({ embeds: [embed] });
    }

    // Play with pet
    pet.happiness = Math.min(100, pet.happiness + Math.floor(Math.random() * 25) + 15);
    pet.health = Math.min(100, pet.health + 3);
    pet.hunger = Math.max(0, pet.hunger - 10);
    pet.lastPlayed = now;
    pet.experience += 15;

    const levelUp = this.checkLevelUp(pet);

    await db.set(`pet_${userId}`, pet);

    const activities = ['fetch', 'tug-of-war', 'hide and seek', 'tricks', 'running', 'swimming'];
    const selectedActivity = activities[Math.floor(Math.random() * activities.length)];

    const embed = new MessageEmbed()
      .setTitle('🎾 Playtime!')
      .setDescription(`You played ${selectedActivity} with ${pet.name}! They loved it!`)
      .setColor('#00ff00')
      .addFields(
        { name: '📈 Stats Updated', value: `Happiness: ${pet.happiness}/100\nHealth: +3\nHunger: -10\nXP: +15`, inline: false }
      );

    if (levelUp) {
      embed.addFields(
        { name: '🎉 Level Up!', value: `${pet.name} is now level ${pet.level}!`, inline: false }
      );
    }

    if (interaction) {
      await interaction.update({ embeds: [embed], components: [] });
    } else {
      await message.channel.send({ embeds: [embed] });
    }
  }

  async petStats(message, userId, interaction = null) {
    const pet = await this.getPet(userId);
    if (!pet) {
      return this.noPetError(message, interaction);
    }

    // Update age
    const daysSinceAdoption = Math.floor((Date.now() - pet.adoptedAt) / (24 * 60 * 60 * 1000));
    pet.age = daysSinceAdoption;
    await db.set(`pet_${userId}`, pet);

    const embed = new MessageEmbed()
      .setTitle(`📊 ${pet.name}'s Detailed Stats`)
      .setDescription(`Complete overview of your ${pet.type.toLowerCase()}`)
      .setColor(this.getPetColor(pet.type))
      .addFields(
        { name: '🏷️ Basic Info', value: `**Name:** ${pet.name}\n**Type:** ${pet.type}\n**Age:** ${pet.age} days\n**Level:** ${pet.level}`, inline: true },
        { name: '📈 Stats', value: `**Health:** ${pet.health}/100\n**Happiness:** ${pet.happiness}/100\n**Hunger:** ${pet.hunger}/100\n**XP:** ${pet.experience}`, inline: true },
        { name: '⏰ Activity', value: `**Last Fed:** ${this.formatTimeSince(pet.lastFed)}\n**Last Played:** ${this.formatTimeSince(pet.lastPlayed)}\n**Adopted:** ${this.formatTimeSince(pet.adoptedAt)} ago`, inline: true },
        { name: '🎯 Next Level', value: `${pet.experience}/100 XP`, inline: false }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter(`Pet ID: ${userId.slice(-6)}`);

    if (interaction) {
      await interaction.update({ embeds: [embed], components: [] });
    } else {
      await message.channel.send({ embeds: [embed] });
    }
  }

  // Helper methods
  async getPet(userId) {
    return await db.get(`pet_${userId}`);
  }

  generatePetNames(type) {
    const names = {
      Dog: ['Buddy', 'Max', 'Bella', 'Charlie', 'Lucy', 'Rocky', 'Daisy', 'Zeus'],
      Cat: ['Whiskers', 'Mittens', 'Shadow', 'Luna', 'Tiger', 'Smokey', 'Princess', 'Felix'],
      Bird: ['Tweety', 'Sunny', 'Rio', 'Kiwi', 'Mango', 'Sky', 'Chirpy', 'Blue'],
      Fish: ['Bubbles', 'Nemo', 'Goldie', 'Splash', 'Finn', 'Aqua', 'Shimmer', 'Coral'],
      Hamster: ['Peanut', 'Nibbles', 'Cheeks', 'Tiny', 'Fuzzy', 'Biscuit', 'Pip', 'Hazel'],
      Rabbit: ['Bunny', 'Snowball', 'Cocoa', 'Thumper', 'Clover', 'Honey', 'Pepper', 'Sage'],
      Snake: ['Slither', 'Viper', 'Coil', 'Emerald', 'Onyx', 'Jade', 'Copper', 'Ivy'],
      Lizard: ['Gecko', 'Spike', 'Iggy', 'Scales', 'Verde', 'Dash', 'Zephyr', 'Blaze']
    };
    return names[type] || ['Pet'];
  }

  getPetEmoji(type) {
    const emojis = {
      Dog: '🐕', Cat: '🐱', Bird: '🐦', Fish: '🐠',
      Hamster: '🐹', Rabbit: '🐰', Snake: '🐍', Lizard: '🦎'
    };
    return emojis[type] || '🐾';
  }

  getPetColor(type) {
    const colors = {
      Dog: '#8B4513', Cat: '#DDA0DD', Bird: '#87CEEB', Fish: '#20B2AA',
      Hamster: '#F4A460', Rabbit: '#FFFACD', Snake: '#9ACD32', Lizard: '#32CD32'
    };
    return colors[type] || '#7289DA';
  }

  getMoodEmoji(happiness) {
    if (happiness >= 80) return '😄';
    if (happiness >= 60) return '😊';
    if (happiness >= 40) return '😐';
    if (happiness >= 20) return '😞';
    return '😢';
  }

  getHealthEmoji(health) {
    if (health >= 80) return '💚';
    if (health >= 60) return '💛';
    if (health >= 40) return '🧡';
    if (health >= 20) return '❤️';
    return '💔';
  }

  getHungerEmoji(hunger) {
    if (hunger >= 80) return '🍽️';
    if (hunger >= 60) return '🍖';
    if (hunger >= 40) return '🥪';
    if (hunger >= 20) return '🍞';
    return '🥺';
  }

  checkLevelUp(pet) {
    const xpNeeded = pet.level * 100;
    if (pet.experience >= xpNeeded) {
      pet.level++;
      pet.experience = 0;
      return true;
    }
    return false;
  }

  formatTimeSince(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  noPetError(message, interaction) {
    const embed = new MessageEmbed()
      .setTitle('🐾 No Pet Found')
      .setDescription('You don\'t have a pet yet! Use `~pet adopt` to get one.')
      .setColor('#ff6b6b');

    if (interaction) {
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    return message.channel.send({ embeds: [embed] });
  }
}