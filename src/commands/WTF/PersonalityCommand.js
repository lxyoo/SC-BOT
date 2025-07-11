const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = class PersonalityCommand extends BaseCommand {
  constructor() {
    super('personality', 'WTF', ['test', 'quiz', 'persona']);
  }

  async run(client, message, args) {
    const questions = [
      {
        question: "How do you prefer to spend your free time?",
        options: [
          { text: "Gaming with friends", type: "social" },
          { text: "Reading or learning", type: "analytical" },
          { text: "Creating art or music", type: "creative" },
          { text: "Exercising or outdoors", type: "active" }
        ]
      },
      {
        question: "In a Discord server, you usually:",
        options: [
          { text: "Start conversations", type: "social" },
          { text: "Lurk and observe", type: "analytical" },
          { text: "Share memes and jokes", type: "creative" },
          { text: "Organize events", type: "active" }
        ]
      },
      {
        question: "When facing a problem, you:",
        options: [
          { text: "Ask friends for help", type: "social" },
          { text: "Research thoroughly", type: "analytical" },
          { text: "Think outside the box", type: "creative" },
          { text: "Take immediate action", type: "active" }
        ]
      },
      {
        question: "Your ideal Discord role would be:",
        options: [
          { text: "Community Manager", type: "social" },
          { text: "Moderator", type: "analytical" },
          { text: "Meme Lord", type: "creative" },
          { text: "Event Coordinator", type: "active" }
        ]
      },
      {
        question: "Your favorite type of content:",
        options: [
          { text: "Live streams and chats", type: "social" },
          { text: "Tutorials and guides", type: "analytical" },
          { text: "Art and entertainment", type: "creative" },
          { text: "News and updates", type: "active" }
        ]
      }
    ];

    const userAnswers = { social: 0, analytical: 0, creative: 0, active: 0 };
    let currentQuestion = 0;

    await this.askQuestion(message, questions, currentQuestion, userAnswers);
  }

  async askQuestion(message, questions, questionIndex, answers) {
    if (questionIndex >= questions.length) {
      return this.showResults(message, answers);
    }

    const question = questions[questionIndex];
    
    const embed = new MessageEmbed()
      .setTitle('Personality Test')
      .setDescription(`Question ${questionIndex + 1}/${questions.length}`)
      .setColor('#9D4EDD')
      .addFields(
        { name: 'Question', value: question.question, inline: false }
      )
      .setFooter('Choose your answer below');

    const row = new MessageActionRow();
    question.options.forEach((option, index) => {
      row.addComponents(
        new MessageButton()
          .setCustomId(`answer_${index}`)
          .setLabel(`${index + 1}. ${option.text}`)
          .setStyle('SECONDARY')
      );
    });

    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === message.author.id,
      time: 30000,
      max: 1
    });

    collector.on('collect', async (interaction) => {
      const answerIndex = parseInt(interaction.customId.split('_')[1]);
      const selectedOption = question.options[answerIndex];
      
      answers[selectedOption.type]++;
      
      await interaction.update({ components: [] });
      
      // Ask next question
      setTimeout(() => {
        this.askQuestion(message, questions, questionIndex + 1, answers);
      }, 1000);
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        msg.edit({ 
          embeds: [
            new MessageEmbed()
              .setTitle('Test Timeout')
              .setDescription('You took too long to answer! Test cancelled.')
              .setColor('#FF6B6B')
          ], 
          components: [] 
        });
      }
    });
  }

  async showResults(message, answers) {
    const personalities = {
      social: {
        name: "The Social Butterfly",
        description: "You thrive on interaction and building connections. You're the heart of any Discord community!",
        traits: ["Friendly", "Outgoing", "Supportive", "Communicative"],
        emoji: "🦋"
      },
      analytical: {
        name: "The Wise Observer",
        description: "You prefer to think before you act. You're the voice of reason in chaotic Discord channels!",
        traits: ["Thoughtful", "Logical", "Reliable", "Insightful"],
        emoji: "🧠"
      },
      creative: {
        name: "The Creative Spark",
        description: "You bring originality and humor to every conversation. Discord needs more people like you!",
        traits: ["Imaginative", "Funny", "Artistic", "Unique"],
        emoji: "🎨"
      },
      active: {
        name: "The Go-Getter",
        description: "You make things happen! You're the driving force behind Discord events and activities.",
        traits: ["Motivated", "Organized", "Leader", "Energetic"],
        emoji: "⚡"
      }
    };

    // Find dominant personality
    const dominantType = Object.keys(answers).reduce((a, b) => answers[a] > answers[b] ? a : b);
    const personality = personalities[dominantType];

    const embed = new MessageEmbed()
      .setTitle(`${personality.emoji} Your Discord Personality`)
      .setDescription(`**${personality.name}**`)
      .setColor('#00FF00')
      .addFields(
        { name: 'Description', value: personality.description, inline: false },
        { name: 'Your Traits', value: personality.traits.join(', '), inline: false },
        { name: 'Score Breakdown', value: this.formatScores(answers), inline: false },
        { name: 'Perfect For', value: this.getRecommendations(dominantType), inline: false }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter('Share your results with friends!');

    await message.channel.send({ embeds: [embed] });
  }

  formatScores(answers) {
    return Object.entries(answers)
      .map(([type, score]) => `${type.charAt(0).toUpperCase() + type.slice(1)}: ${score}`)
      .join('\n');
  }

  getRecommendations(type) {
    const recommendations = {
      social: "Voice channels, community events, welcoming new members",
      analytical: "Moderation, technical support, rule enforcement",
      creative: "Meme channels, art sharing, creative contests",
      active: "Event planning, server growth, activity coordination"
    };
    return recommendations[type];
  }
};