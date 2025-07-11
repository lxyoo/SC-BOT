const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require('discord.js');
const fetch = require('node-fetch');
const { decode } = require('html-entities');
const { createCanvas, loadImage } = require('canvas');
const db = require('quick.db');

module.exports = class QuizCommand extends BaseCommand {
  constructor() {
    super('quiz', 'Trivia', ['trivia', 'question']);
  }

  async run(client, message, args) {
    // Check if user wants leaderboard
    if (args[0] && args[0].toLowerCase() === 'leaderboard') {
      return this.showLeaderboard(message);
    }

    // Start quiz session
    this.startQuizSession(client, message, args);
  }

  async startQuizSession(client, message, args) {
    const category = this.getCategory(args[0]);
    const difficulty = this.getDifficulty(args[1]);

    this.loadQuizQuestion(client, message, category, difficulty);
  }

  async loadQuizQuestion(client, message, category, difficulty, existingMessage = null) {
    const loadingEmbed = new MessageEmbed()
      .setTitle('Quiz Loading')
      .setDescription('```\nFetching question...\nPreparing interface...\nAlmost ready...\n```')
      .setColor('#36393F')
      .addFields([
        {
          name: 'Settings',
          value: `\`\`\`yaml\nCategory: ${category === '' ? 'Random' : this.getCategoryName(category)}\nDifficulty: ${difficulty === '' ? 'Any' : this.getDifficultyName(difficulty)}\nStatus: Loading\n\`\`\``,
          inline: false
        }
      ])
      .setFooter({ text: 'Connecting to trivia database...' });

    let loadingMessage;
    if (existingMessage) {
      loadingMessage = await existingMessage.edit({ embeds: [loadingEmbed], components: [] });
    } else {
      loadingMessage = await message.reply({ embeds: [loadingEmbed] });
    }

    try {
      const fetching = await fetch(`https://opentdb.com/api.php?amount=1&type=multiple${category}${difficulty}`);
      const result = await fetching.json();

      if (result.response_code !== 0) {
        throw new Error('Failed to fetch quiz question');
      }

      const quiz = result.results[0];
      const question = decode(quiz.question);
      const correctAnswer = decode(quiz.correct_answer);
      const incorrectAnswers = quiz.incorrect_answers.map(answer => decode(answer));

      // Combine and shuffle answers
      const allAnswers = [...incorrectAnswers, correctAnswer];
      this.shuffleArray(allAnswers);

      // Get user stats
      const userStats = await this.getUserStats(message.author.id);

      const quizEmbed = new MessageEmbed()
        .setTitle(`Quiz: ${quiz.category}`)
        .setDescription(`\`\`\`\n${question}\n\`\`\``)
        .setColor('#5865F2')
        .addFields([
          { name: 'A', value: `\`${allAnswers[0]}\``, inline: false },
          { name: 'B', value: `\`${allAnswers[1]}\``, inline: false },
          { name: 'C', value: `\`${allAnswers[2]}\``, inline: false },
          { name: 'D', value: `\`${allAnswers[3]}\``, inline: false }
        ])
        .addFields([
          { name: 'Difficulty', value: quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1), inline: true },
          { name: 'Time Limit', value: '15 seconds', inline: true },
          { name: 'Type', value: 'Multiple Choice', inline: true }
        ])
        .setFooter({ text: `Points: ${userStats.points} | Streak: ${userStats.streak} | Correct: ${userStats.correct}/${userStats.total}` });

      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(allAnswers[0])
            .setLabel('A')
            .setStyle('SECONDARY'),
          new MessageButton()
            .setCustomId(allAnswers[1])
            .setLabel('B')
            .setStyle('SECONDARY'),
          new MessageButton()
            .setCustomId(allAnswers[2])
            .setLabel('C')
            .setStyle('SECONDARY'),
          new MessageButton()
            .setCustomId(allAnswers[3])
            .setLabel('D')
            .setStyle('SECONDARY')
        );

      await loadingMessage.edit({ embeds: [quizEmbed], components: [row] });

      const collector = loadingMessage.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        componentType: 'BUTTON',
        time: 15000
      });

      collector.on('collect', async (interaction) => {
        const userAnswer = interaction.customId;
        const isCorrect = userAnswer === correctAnswer;
      
        // Calculate points based on difficulty and streak
        let points = 0;
        if (isCorrect) {
          const difficultyMultiplier = this.getDifficultyMultiplier(quiz.difficulty);
          const streakBonus = Math.floor(userStats.streak / 5) * 2; // +2 points per 5 streak
          points = difficultyMultiplier + streakBonus;
        }
      
        // Update user stats
        const newStats = await this.updateUserStats(message.author.id, isCorrect, points);
      
        // Check for streak milestones
        const streakMilestone = this.getStreakMilestone(newStats.streak);
      
        const resultEmbed = new MessageEmbed()
          .setTitle(isCorrect ? 'Correct!' : 'Incorrect!')
          .setDescription(`\`\`\`\n${question}\n\`\`\``)
          .setColor(isCorrect ? '#57F287' : '#ED4245')
          .addFields([
            { name: 'Your Answer', value: `\`${userAnswer}\``, inline: true },
            { name: 'Correct Answer', value: `\`${correctAnswer}\``, inline: true },
            { name: 'Points Earned', value: `+${points}`, inline: true }
          ]);
      
        if (isCorrect && streakMilestone) {
          resultEmbed.addFields([
            { name: 'Streak Milestone!', value: streakMilestone, inline: false }
          ]);
        }
      
        resultEmbed.setFooter({ 
          text: `Points: ${newStats.points} | Streak: ${newStats.streak} | Correct: ${newStats.correct}/${newStats.total}` 
        });
      
        // Continue playing buttons
        const continueRow = new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId('continue_quiz')
              .setLabel('Next Question')
              .setStyle('SUCCESS'),
            new MessageButton()
              .setCustomId('change_category')
              .setLabel('Change Category')
              .setStyle('PRIMARY'),
            new MessageButton()
              .setCustomId('same_category')
              .setLabel('Same Category')
              .setStyle('SECONDARY'),
            new MessageButton()
              .setCustomId('view_leaderboard')
              .setLabel('Leaderboard')
              .setStyle('SECONDARY'),
            new MessageButton()
              .setCustomId('quit_quiz')
              .setLabel('Quit')
              .setStyle('DANGER')
          );
      
        await interaction.update({ embeds: [resultEmbed], components: [continueRow] });
      
        // Set up continue collector - THIS IS WHERE IT SHOULD BE DEFINED
        const continueCollector = loadingMessage.createMessageComponentCollector({
          filter: (i) => i.user.id === message.author.id,
          componentType: 'BUTTON',
          time: 60000
        });
      
        continueCollector.on('collect', async (continueInteraction) => {
          await continueInteraction.deferUpdate();
          
          switch (continueInteraction.customId) {
            case 'continue_quiz':
              continueCollector.stop();
              this.loadQuizQuestion(client, message, '', '', loadingMessage);
              break;
            case 'change_category':
              continueCollector.stop();
              this.showCategorySelector(message, loadingMessage);
              break;
            case 'same_category':
              continueCollector.stop();
              this.loadQuizQuestion(client, message, category, difficulty, loadingMessage);
              break;
            case 'view_leaderboard':
              continueCollector.stop();
              this.showLeaderboard(message);
              break;
            case 'quit_quiz':
              continueCollector.stop();
              const quitEmbed = new MessageEmbed()
                .setTitle('Quiz Session Ended')
                .setDescription('Thanks for playing!')
                .setColor('#36393F')
                .setFooter({ 
                  text: `Final Stats - Points: ${newStats.points} | Streak: ${newStats.streak} | Correct: ${newStats.correct}/${newStats.total}` 
                });
              await loadingMessage.edit({ embeds: [quitEmbed], components: [] });
              break;
          }
        });
      
        continueCollector.on('end', (collected) => {
          if (collected.size === 0) {
            const timeoutEmbed = new MessageEmbed()
              .setTitle('Quiz Session Timeout')
              .setDescription('Session ended due to inactivity.')
              .setColor('#F1C40F')
              .setFooter({ 
                text: `Final Stats - Points: ${newStats.points} | Streak: ${newStats.streak} | Correct: ${newStats.correct}/${newStats.total}` 
              });
            loadingMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
          }
        });
      
        collector.stop(); // Stop the original answer collector
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          // Update stats for timeout (counts as incorrect)
          const newStats = await this.updateUserStats(message.author.id, false, 0);

          const timeoutEmbed = new MessageEmbed()
            .setTitle('Time\'s Up!')
            .setDescription(`\`\`\`\n${question}\n\`\`\``)
            .setColor('#F1C40F')
            .addFields([
              { name: 'Correct Answer', value: `\`${correctAnswer}\``, inline: true },
              { name: 'Result', value: 'You ran out of time!', inline: true },
              { name: 'Points Earned', value: '+0', inline: true }
            ])
            .setFooter({
              text: `Points: ${newStats.points} | Streak: ${newStats.streak} | Correct: ${newStats.correct}/${newStats.total}`
            });

          const continueRow = new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId('continue_quiz')
                .setLabel('Next Question')
                .setStyle('SUCCESS'),
              new MessageButton()
                .setCustomId('quit_quiz')
                .setLabel('Quit')
                .setStyle('DANGER')
            );

          await loadingMessage.edit({ embeds: [timeoutEmbed], components: [continueRow] });

          // Set up continue collector for timeout
          const continueCollector = loadingMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            componentType: 'BUTTON',
            time: 60000
          });

          continueCollector.on('collect', async (continueInteraction) => {
            await continueInteraction.deferUpdate();

            if (continueInteraction.customId === 'continue_quiz') {
              continueCollector.stop();
              this.loadQuizQuestion(client, message, category, difficulty, loadingMessage);
            } else if (continueInteraction.customId === 'quit_quiz') {
              continueCollector.stop();
              const quitEmbed = new MessageEmbed()
                .setTitle('Quiz Session Ended')
                .setDescription('Thanks for playing!')
                .setColor('#36393F')
                .setFooter({
                  text: `Final Stats - Points: ${newStats.points} | Streak: ${newStats.streak} | Correct: ${newStats.correct}/${newStats.total}`
                });
              await loadingMessage.edit({ embeds: [quitEmbed], components: [] });
            }
          });

          continueCollector.on('end', (collected) => {
            if (collected.size === 0) {
              const finalEmbed = new MessageEmbed()
                .setTitle('Quiz Session Ended')
                .setDescription('Session ended due to inactivity.')
                .setColor('#36393F')
                .setFooter({
                  text: `Final Stats - Points: ${newStats.points} | Streak: ${newStats.streak} | Correct: ${newStats.correct}/${newStats.total}`
                });
              loadingMessage.edit({ embeds: [finalEmbed], components: [] }).catch(() => { });
            }
          });
        }
      });

    } catch (error) {
      console.error('Quiz error:', error);

      const errorEmbed = new MessageEmbed()
        .setTitle('Quiz Error')
        .setDescription('Failed to load quiz question')
        .setColor('#ED4245')
        .addFields([
          { name: 'Error', value: error.message || 'Unknown error', inline: false },
          { name: 'Try Again', value: 'Use the command again to retry', inline: false }
        ])
        .setFooter({ text: 'Error occurred while fetching question' });

      await loadingMessage.edit({ embeds: [errorEmbed], components: [] });
    }
  }

  async showLeaderboard(message) {
    try {
      // Get all user stats
      const allUsers = await db.all();
      const quizUsers = allUsers
        .filter(entry => entry.ID.startsWith('quiz_'))
        .map(entry => ({
          userId: entry.ID.replace('quiz_', ''),
          ...entry.data
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);

      if (quizUsers.length === 0) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setTitle('Quiz Leaderboard')
              .setDescription('No quiz data found. Play some quizzes to see the leaderboard!')
              .setColor('#36393F')
          ]
        });
      }

      // Create canvas leaderboard
      const canvas = await this.createLeaderboardCanvas(quizUsers, message);
      const attachment = new MessageAttachment(canvas.toBuffer(), 'leaderboard.png');

      const embed = new MessageEmbed()
        .setTitle('Quiz Leaderboard')
        .setDescription('Top 10 Quiz Champions')
        .setColor('#FFD700')
        .setImage('attachment://leaderboard.png')
        .addFields([
          { name: 'How to Play', value: 'Use `quiz` to answer questions and earn points', inline: true },
          { name: 'Point System', value: 'Easy: 1pt, Medium: 2pts, Hard: 3pts + streak bonus', inline: true },
          { name: 'Streak Bonus', value: '+2 points per 5 correct answers in a row', inline: true }
        ]);

      // Get user's rank if they have stats
      const userStats = await this.getUserStats(message.author.id);
      if (userStats.total > 0) {
        const userRank = quizUsers.findIndex(u => u.userId === message.author.id) + 1;
        embed.setFooter({
          text: `Your Stats: Rank #${userRank || 'Unranked'} | Points: ${userStats.points} | Streak: ${userStats.streak}`
        });
      }

      await message.reply({ embeds: [embed], files: [attachment] });

    } catch (error) {
      console.error('Leaderboard error:', error);
      await message.reply({
        embeds: [
          new MessageEmbed()
            .setTitle('Leaderboard Error')
            .setDescription('Failed to generate leaderboard')
            .setColor('#ED4245')
            .addFields([
              { name: 'Error', value: error.message || 'Unknown error', inline: false }
            ])
        ]
      });
    }
  }

  async createLeaderboardCanvas(users, message) {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#2C2F33');
    gradient.addColorStop(1, '#23272A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Header
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Quiz Leaderboard', 400, 50);

    // Header line
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 70);
    ctx.lineTo(700, 70);
    ctx.stroke();

    // Column headers
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Rank', 50, 110);
    ctx.fillText('Player', 120, 110);
    ctx.fillText('Points', 420, 110);
    ctx.fillText('Streak', 520, 110);
    ctx.fillText('Accuracy', 620, 110);

    // User rows
    for (let i = 0; i < Math.min(users.length, 10); i++) {
      const user = users[i];
      const y = 150 + (i * 40);

      // Ensure all user properties exist with defaults
      const userPoints = user.points || 0;
      const userStreak = user.streak || 0;
      const userCorrect = user.correct || 0;
      const userTotal = user.total || 0;

      // Rank colors
      let rankColor = '#FFFFFF';
      if (i === 0) rankColor = '#FFD700'; // Gold
      else if (i === 1) rankColor = '#C0C0C0'; // Silver
      else if (i === 2) rankColor = '#CD7F32'; // Bronze

      // Rank
      ctx.fillStyle = rankColor;
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`#${i + 1}`, 65, y);

      // Username
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      let username = 'Unknown User';
      try {
        const discordUser = await message.client.users.fetch(user.userId);
        username = discordUser.username || 'Unknown User';
      } catch (e) {
        username = 'Unknown User';
      }

      // Truncate long usernames
      if (username.length > 18) {
        username = username.substring(0, 15) + '...';
      }
      ctx.fillText(username, 120, y);

      // Points
      ctx.fillStyle = '#57F287';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(userPoints.toString(), 420, y);

      // Current Streak
      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(userStreak.toString(), 520, y);

      // Accuracy
      ctx.fillStyle = '#5865F2';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      const accuracy = userTotal > 0 ? Math.round((userCorrect / userTotal) * 100) : 0;
      ctx.fillText(`${accuracy}%`, 620, y);

      // Row separator
      ctx.strokeStyle = '#36393F';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, y + 15);
      ctx.lineTo(750, y + 15);
      ctx.stroke();
    }

    // Footer
    ctx.fillStyle = '#99AAB5';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Use "quiz" to play and earn points | Streak bonus: +2 points per 5 correct answers', 400, 580);

    return canvas;
  }

  async getUserStats(userId) {
    const stats = await db.get(`quiz_${userId}`) || {
      points: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      total: 0,
      lastAnswered: null
    };
    return stats;
  }

  // Add this method to your QuizCommand class
  async showCategorySelector(message, loadingMessage) {
    const categories = [
      { name: 'General Knowledge', value: '&category=9' },
      { name: 'Books', value: '&category=10' },
      { name: 'Films', value: '&category=11' },
      { name: 'Music', value: '&category=12' },
      { name: 'Television', value: '&category=14' },
      { name: 'Video Games', value: '&category=15' },
      { name: 'Science & Nature', value: '&category=20' },
      { name: 'Computers', value: '&category=21' },
      { name: 'Mathematics', value: '&category=22' },
      { name: 'Sports', value: '&category=25' },
      { name: 'Geography', value: '&category=26' },
      { name: 'History', value: '&category=27' },
      { name: 'Animals', value: '&category=31' }
    ];

    const categoryEmbed = new MessageEmbed()
      .setTitle('Select Quiz Category')
      .setDescription('Choose a category for your next questions:')
      .setColor('#5865F2')
      .addFields(
        categories.map((cat, index) => ({
          name: `${index + 1}. ${cat.name}`,
          value: '\u200b',
          inline: true
        }))
      )
      .addFields([
        { name: 'Options', value: '**R** - Random Category\n**D** - Difficulty Selection\n**B** - Back to Quiz', inline: false }
      ])
      .setFooter({ text: 'Click a number to select category or use the buttons below' });

    // Create rows of buttons (5 per row due to Discord limit)
    const rows = [];
    for (let i = 0; i < categories.length; i += 5) {
      const row = new MessageActionRow();
      for (let j = i; j < Math.min(i + 5, categories.length); j++) {
        row.addComponents(
          new MessageButton()
            .setCustomId(`category_${categories[j].value}`)
            .setLabel((j + 1).toString())
            .setStyle('PRIMARY')
        );
      }
      rows.push(row);
    }

    // Add control buttons
    const controlRow = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('category_random')
          .setLabel('Random')
          .setStyle('SUCCESS'),
        new MessageButton()
          .setCustomId('difficulty_select')
          .setLabel('Difficulty')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('back_to_quiz')
          .setLabel('Back')
          .setStyle('DANGER')
      );

    rows.push(controlRow);

    await loadingMessage.edit({ embeds: [categoryEmbed], components: rows });

    const collector = loadingMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      componentType: 'BUTTON',
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      if (interaction.customId.startsWith('category_')) {
        const selectedCategory = interaction.customId.replace('category_', '');
        collector.stop();

        if (selectedCategory === 'random') {
          this.loadQuizQuestion(message.client, message, '', '', loadingMessage);
        } else {
          this.loadQuizQuestion(message.client, message, selectedCategory, '', loadingMessage);
        }
      } else if (interaction.customId === 'difficulty_select') {
        collector.stop();
        this.showDifficultySelector(message, loadingMessage);
      } else if (interaction.customId === 'back_to_quiz') {
        collector.stop();
        this.loadQuizQuestion(message.client, message, '', '', loadingMessage);
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = new MessageEmbed()
          .setTitle('Selection Timeout')
          .setDescription('No category selected. Returning to random questions.')
          .setColor('#F1C40F');

        loadingMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => { });
        setTimeout(() => {
          this.loadQuizQuestion(message.client, message, '', '', loadingMessage);
        }, 2000);
      }
    });
  }

  // Add this method for difficulty selection
  async showDifficultySelector(message, loadingMessage) {
    const difficultyEmbed = new MessageEmbed()
      .setTitle('Select Quiz Difficulty')
      .setDescription('Choose your challenge level:')
      .setColor('#5865F2')
      .addFields([
        { name: 'Easy', value: '1 point per correct answer\nBasic questions', inline: true },
        { name: 'Medium', value: '2 points per correct answer\nModerate challenge', inline: true },
        { name: 'Hard', value: '3 points per correct answer\nExpert level', inline: true }
      ])
      .setFooter({ text: 'Select difficulty level or go back to categories' });

    const difficultyRow = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('diff_easy')
          .setLabel('Easy')
          .setStyle('SUCCESS'),
        new MessageButton()
          .setCustomId('diff_medium')
          .setLabel('Medium')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('diff_hard')
          .setLabel('Hard')
          .setStyle('DANGER'),
        new MessageButton()
          .setCustomId('diff_random')
          .setLabel('Any')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('back_categories')
          .setLabel('Back')
          .setStyle('SECONDARY')
      );

    await loadingMessage.edit({ embeds: [difficultyEmbed], components: [difficultyRow] });

    const collector = loadingMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      componentType: 'BUTTON',
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      if (interaction.customId.startsWith('diff_')) {
        const selectedDifficulty = interaction.customId.replace('diff_', '');
        collector.stop();

        let difficulty = '';
        if (selectedDifficulty === 'easy') difficulty = '&difficulty=easy';
        else if (selectedDifficulty === 'medium') difficulty = '&difficulty=medium';
        else if (selectedDifficulty === 'hard') difficulty = '&difficulty=hard';

        this.loadQuizQuestion(message.client, message, '', difficulty, loadingMessage);
      } else if (interaction.customId === 'back_categories') {
        collector.stop();
        this.showCategorySelector(message, loadingMessage);
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = new MessageEmbed()
          .setTitle('Selection Timeout')
          .setDescription('No difficulty selected. Using random difficulty.')
          .setColor('#F1C40F');

        loadingMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => { });
        setTimeout(() => {
          this.loadQuizQuestion(message.client, message, '', '', loadingMessage);
        }, 2000);
      }
    });
  }

  async updateUserStats(userId, isCorrect, points) {
    const stats = await this.getUserStats(userId);

    // Update basic stats
    stats.total += 1;
    stats.points += points;

    if (isCorrect) {
      stats.correct += 1;
      stats.streak += 1;
      if (stats.streak > stats.bestStreak) {
        stats.bestStreak = stats.streak;
      }
    } else {
      stats.streak = 0; // Reset streak on incorrect answer
    }

    stats.lastAnswered = Date.now();

    // Save to database
    await db.set(`quiz_${userId}`, stats);

    return stats;
  }

  getDifficultyMultiplier(difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 1;
    }
  }

  getStreakMilestone(streak) {
    const milestones = {
      5: 'Hot Streak! 5 in a row!',
      10: 'On Fire! 10 correct answers!',
      15: 'Unstoppable! 15 streak milestone!',
      20: 'Quiz Master! 20 answers in a row!',
      25: 'Legendary! 25 streak achieved!',
      30: 'Godlike! 30 perfect answers!',
      50: 'Immortal! 50 streak - absolutely incredible!',
      100: 'Transcendent! 100 streak - you are a quiz deity!'
    };

    return milestones[streak] || null;
  }

  getCategory(categoryArg) {
    const categories = {
      'general': '&category=9',
      'books': '&category=10',
      'films': '&category=11',
      'music': '&category=12',
      'theater': '&category=13',
      'tv': '&category=14',
      'games': '&category=15',
      'board': '&category=16',
      'comics': '&category=17',
      'anime': '&category=18',
      'cartoon': '&category=19',
      'science': '&category=20',
      'computers': '&category=21',
      'math': '&category=22',
      'gadgets': '&category=23',
      'mythology': '&category=24',
      'sports': '&category=25',
      'geography': '&category=26',
      'history': '&category=27',
      'politics': '&category=28',
      'art': '&category=29',
      'celebrities': '&category=30',
      'animals': '&category=31',
      'vehicles': '&category=32'
    };

    return categories[categoryArg?.toLowerCase()] || '';
  }

  getDifficulty(difficultyArg) {
    const difficulties = {
      'easy': '&difficulty=easy',
      'medium': '&difficulty=medium',
      'hard': '&difficulty=hard'
    };

    return difficulties[difficultyArg?.toLowerCase()] || '';
  }

  getCategoryName(category) {
    const categoryNames = {
      '&category=9': 'General Knowledge',
      '&category=10': 'Books',
      '&category=11': 'Films',
      '&category=12': 'Music',
      '&category=13': 'Theater',
      '&category=14': 'Television',
      '&category=15': 'Video Games',
      '&category=16': 'Board Games',
      '&category=17': 'Comics',
      '&category=18': 'Anime & Manga',
      '&category=19': 'Cartoons',
      '&category=20': 'Science & Nature',
      '&category=21': 'Computers',
      '&category=22': 'Mathematics',
      '&category=23': 'Gadgets',
      '&category=24': 'Mythology',
      '&category=25': 'Sports',
      '&category=26': 'Geography',
      '&category=27': 'History',
      '&category=28': 'Politics',
      '&category=29': 'Art',
      '&category=30': 'Celebrities',
      '&category=31': 'Animals',
      '&category=32': 'Vehicles'
    };

    return categoryNames[category] || 'Any Category';
  }

  getDifficultyName(difficulty) {
    const difficultyNames = {
      '&difficulty=easy': 'Easy',
      '&difficulty=medium': 'Medium',
      '&difficulty=hard': 'Hard'
    };

    return difficultyNames[difficulty] || 'Any Difficulty';
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
};