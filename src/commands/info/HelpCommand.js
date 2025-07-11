const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = class HelpCommand extends BaseCommand {
  constructor() {
    super('help', 'Miscellaneous', ['h', 'commands', 'cmd']);
  }

  async run(client, message, args) {
    // If specific command requested
    if (args.length > 0) {
      return this.showCommandHelp(client, message, args[0]);
    }

    // Get all command categories dynamically
    const categories = this.getCommandCategories();
    
    // Create main help embed
    const helpEmbed = new MessageEmbed()
      .setTitle('🤖 Bot Help Center')
      .setDescription('Choose a category below to see commands, or use `!help <command>` for specific help!')
      .setColor('#7289DA')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setFooter(`${client.user.username} • Prefix: ${client.prefix}`)
      .setTimestamp();

    // Add category overview
    let categoryList = '';
    for (const [category, commands] of Object.entries(categories)) {
      const emoji = this.getCategoryEmoji(category);
      categoryList += `${emoji} **${category}** - ${commands.length} commands\n`;
    }
    
    helpEmbed.addFields(
      { name: '📚 Categories', value: categoryList, inline: false },
      { name: '💡 Quick Start', value: '`!help <category>` - View category commands\n`!help <command>` - Detailed command info', inline: false }
    );

    // Create select menu for categories
    const selectMenu = new MessageSelectMenu()
      .setCustomId('help-category')
      .setPlaceholder('🗂️ Select a category to explore...')
      .addOptions(
        Object.keys(categories).map(category => ({
          label: category,
          description: `${categories[category].length} commands available`,
          value: category.toLowerCase(),
          emoji: this.getCategoryEmoji(category)
        }))
      );

    const row = new MessageActionRow().addComponents(selectMenu);

    const helpMessage = await message.channel.send({ 
      embeds: [helpEmbed], 
      components: [row] 
    });

    // Handle select menu interactions
    const collector = helpMessage.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === message.author.id,
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'help-category') {
        const category = interaction.values[0];
        await this.showCategoryHelp(client, interaction, category);
      }
    });

    collector.on('end', () => {
      // Disable the select menu after timeout
      selectMenu.setDisabled(true);
      helpMessage.edit({ components: [row] }).catch(() => {});
    });
  }

  getCommandCategories() {
    const categories = {};
    const commandsPath = path.join(__dirname, '..');
    
    try {
      // Read all folders in commands directory
      const folders = fs.readdirSync(commandsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const folder of folders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath)
          .filter(file => file.endsWith('.js'));

        if (commandFiles.length > 0) {
          categories[this.capitalizeFirst(folder)] = [];
          
          for (const file of commandFiles) {
            try {
              const CommandClass = require(path.join(folderPath, file));
              const command = new CommandClass();
              categories[this.capitalizeFirst(folder)].push(command);
            } catch (error) {
              console.error(`Error loading command ${file}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading command directories:', error);
    }

    return categories;
  }

  async showCategoryHelp(client, interaction, categoryName) {
    const categories = this.getCommandCategories();
    const category = Object.keys(categories).find(c => c.toLowerCase() === categoryName.toLowerCase());
    
    if (!category) {
      return interaction.reply({ content: '❌ Category not found!', ephemeral: true });
    }

    const commands = categories[category];
    const emoji = this.getCategoryEmoji(category);

    const categoryEmbed = new MessageEmbed()
      .setTitle(`${emoji} ${category} Commands`)
      .setDescription(`Here are all the commands in the **${category}** category:`)
      .setColor('#7289DA')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))

    // Group commands for better display
    let commandList = '';
    for (const command of commands) {
      const aliases = command.aliases && command.aliases.length > 0 
        ? ` (${command.aliases.join(', ')})` 
        : '';
      commandList += `**${client.prefix}${command.name}**${aliases}\n`;
    }

    categoryEmbed.addFields(
      { name: '📋 Commands', value: commandList || 'No commands found', inline: false },
      { name: '💡 Usage', value: `Type \`${client.prefix}help <command>\` for detailed information about a specific command.`, inline: false }
    );

    await interaction.update({ embeds: [categoryEmbed] });
  }

  async showCommandHelp(client, message, commandName) {
    const command = client.commands.get(commandName.toLowerCase());
    
    if (!command) {
      return message.channel.send({
        embeds: [
          new MessageEmbed()
            .setTitle('❌ Command Not Found')
            .setDescription(`Command \`${commandName}\` doesn't exist!`)
            .setColor('#ff6b6b')
            .addFields(
              { name: '💡 Suggestion', value: `Use \`${client.prefix}help\` to see all available commands.`, inline: false }
            )
        ]
      });
    }

    const commandEmbed = new MessageEmbed()
      .setTitle(`📖 Command: ${command.name}`)
      .setDescription(command.description || 'No description available')
      .setColor('#00ff00')
      .addFields(
        { name: '📂 Category', value: command.category || 'Unknown', inline: true },
        { name: '🔧 Usage', value: `\`${client.prefix}${command.name}\``, inline: true },
        { name: '⏱️ Cooldown', value: command.cooldown ? `${command.cooldown}s` : 'None', inline: true }
      )
      .setFooter(`Command help for ${command.name}`)
      .setTimestamp();

    // Add aliases if they exist
    if (command.aliases && command.aliases.length > 0) {
      commandEmbed.addFields(
        { name: '🔗 Aliases', value: command.aliases.map(alias => `\`${client.prefix}${alias}\``).join(', '), inline: false }
      );
    }

    // Add examples if available
    if (command.examples) {
      commandEmbed.addFields(
        { name: '💡 Examples', value: command.examples.join('\n'), inline: false }
      );
    }

    await message.channel.send({ embeds: [commandEmbed] });
  }

  getCategoryEmoji(category) {
    const emojis = {
      'Music': '🎵',
      'Currency': '💰',
      'Miscellaneous': '🔧',
      'Moderation': '🛡️',
      'Fun': '🎮',
      'Utility': '🛠️',
      'Admin': '⚙️',
      'Economy': '💸',
      'Games': '🎯',
      'Social': '👥',
      'Information': 'ℹ️',
      'Settings': '⚙️',
      'Najim': '👑'
    };
    return emojis[category] || '📁';
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};