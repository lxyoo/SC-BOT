const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = class MBTICommand extends BaseCommand {
  constructor() {
    super('mbti', 'Fun', ['personality', 'myers', 'briggs']);
  }

  async run(client, message, args) {
    const questions = [
      // Extraversion vs Introversion
      {
        question: "At a party, you usually:",
        options: [
          { text: "Talk to many people, even strangers", type: "E" },
          { text: "Talk to a few people you know well", type: "I" }
        ]
      },
      {
        question: "You feel more energized when:",
        options: [
          { text: "Being around other people", type: "E" },
          { text: "Spending time alone", type: "I" }
        ]
      },
      {
        question: "In group projects, you prefer to:",
        options: [
          { text: "Brainstorm ideas out loud with others", type: "E" },
          { text: "Think through ideas privately first", type: "I" }
        ]
      },
      {
        question: "When making phone calls, you:",
        options: [
          { text: "Don't mind calling people", type: "E" },
          { text: "Prefer texting or emailing", type: "I" }
        ]
      },
      
      // Sensing vs Intuition
      {
        question: "You prefer to focus on:",
        options: [
          { text: "Facts and details", type: "S" },
          { text: "Patterns and possibilities", type: "N" }
        ]
      },
      {
        question: "When learning something new, you:",
        options: [
          { text: "Want clear, step-by-step instructions", type: "S" },
          { text: "Like to understand the big picture first", type: "N" }
        ]
      },
      {
        question: "You're more interested in:",
        options: [
          { text: "What is actually happening", type: "S" },
          { text: "What could be possible", type: "N" }
        ]
      },
      {
        question: "In conversations, you tend to:",
        options: [
          { text: "Focus on concrete topics", type: "S" },
          { text: "Discuss abstract ideas", type: "N" }
        ]
      },
      
      // Thinking vs Feeling
      {
        question: "When making decisions, you rely more on:",
        options: [
          { text: "Logic and objective analysis", type: "T" },
          { text: "Personal values and emotions", type: "F" }
        ]
      },
      {
        question: "You value being:",
        options: [
          { text: "Fair and impartial", type: "T" },
          { text: "Caring and compassionate", type: "F" }
        ]
      },
      {
        question: "When giving feedback, you:",
        options: [
          { text: "Focus on what needs to be improved", type: "T" },
          { text: "Consider how the person might feel", type: "F" }
        ]
      },
      {
        question: "You're more likely to:",
        options: [
          { text: "Question things that don't make sense", type: "T" },
          { text: "Accept things to maintain harmony", type: "F" }
        ]
      },
      
      // Judging vs Perceiving
      {
        question: "You prefer to:",
        options: [
          { text: "Make plans and stick to them", type: "J" },
          { text: "Keep your options open", type: "P" }
        ]
      },
      {
        question: "Your workspace is usually:",
        options: [
          { text: "Organized and structured", type: "J" },
          { text: "Flexible and adaptable", type: "P" }
        ]
      },
      {
        question: "When starting a project, you:",
        options: [
          { text: "Like to have everything planned out", type: "J" },
          { text: "Prefer to figure it out as you go", type: "P" }
        ]
      },
      {
        question: "You feel better when:",
        options: [
          { text: "Decisions are made", type: "J" },
          { text: "Options are still available", type: "P" }
        ]
      }
    ];

    const userAnswers = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    let currentQuestion = 0;

    await this.askQuestion(message, questions, currentQuestion, userAnswers);
  }

  async askQuestion(message, questions, questionIndex, answers) {
    if (questionIndex >= questions.length) {
      return this.showResults(message, answers);
    }

    const question = questions[questionIndex];
    
    const embed = new MessageEmbed()
      .setTitle('MBTI Personality Test')
      .setDescription(`Question ${questionIndex + 1}/${questions.length}`)
      .setColor('#6366F1')
      .addFields(
        { name: 'Question', value: question.question, inline: false }
      )
      .setFooter('Choose the option that describes you better');

    const row = new MessageActionRow();
    question.options.forEach((option, index) => {
      row.addComponents(
        new MessageButton()
          .setCustomId(`mbti_${index}`)
          .setLabel(`${index + 1}. ${option.text}`)
          .setStyle(['PRIMARY', 'SECONDARY'][index])
      );
    });

    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === message.author.id,
      time: 45000,
      max: 1
    });

    collector.on('collect', async (interaction) => {
      const answerIndex = parseInt(interaction.customId.split('_')[1]);
      const selectedOption = question.options[answerIndex];
      
      answers[selectedOption.type]++;
      
      await interaction.update({ 
        embeds: [
          new MessageEmbed()
            .setTitle('MBTI Personality Test')
            .setDescription(`Question ${questionIndex + 1}/${questions.length} - Answered!`)
            .setColor('#10B981')
            .addFields(
              { name: 'Your Answer', value: selectedOption.text, inline: false },
              { name: 'Progress', value: `${questionIndex + 1}/${questions.length} complete`, inline: false }
            )
        ], 
        components: [] 
      });
      
      // Ask next question after a short delay
      setTimeout(() => {
        this.askQuestion(message, questions, questionIndex + 1, answers);
      }, 1500);
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        msg.edit({ 
          embeds: [
            new MessageEmbed()
              .setTitle('Test Timeout')
              .setDescription('You took too long to answer! Test cancelled.')
              .setColor('#EF4444')
          ], 
          components: [] 
        });
      }
    });
  }

  async showResults(message, answers) {
    // Determine MBTI type
    const mbtiType = 
      (answers.E > answers.I ? 'E' : 'I') +
      (answers.S > answers.N ? 'S' : 'N') +
      (answers.T > answers.F ? 'T' : 'F') +
      (answers.J > answers.P ? 'J' : 'P');

    const personalities = {
      'INTJ': {
        name: 'The Architect',
        description: 'Strategic, independent, and driven by ideas. You see the big picture and work systematically toward your goals.',
        strengths: ['Strategic thinking', 'Independence', 'Determination', 'Vision'],
        weaknesses: ['Overly critical', 'Dismissive of emotions', 'Perfectionist'],
        careers: ['Scientist', 'Engineer', 'Developer', 'Strategist'],
        famous: ['Elon Musk', 'Isaac Newton', 'Nikola Tesla'],
        emoji: '🏗️'
      },
      'INTP': {
        name: 'The Thinker',
        description: 'Logical, analytical, and creative. You love exploring ideas and understanding how things work.',
        strengths: ['Logical reasoning', 'Creativity', 'Objectivity', 'Open-mindedness'],
        weaknesses: ['Procrastination', 'Insensitive', 'Absent-minded'],
        careers: ['Researcher', 'Programmer', 'Philosopher', 'Analyst'],
        famous: ['Albert Einstein', 'Bill Gates', 'Marie Curie'],
        emoji: '🧠'
      },
      'ENTJ': {
        name: 'The Commander',
        description: 'Natural leaders who are driven to organize and direct. You excel at seeing inefficiency and creating solutions.',
        strengths: ['Leadership', 'Strategic planning', 'Efficiency', 'Confidence'],
        weaknesses: ['Impatient', 'Stubborn', 'Ruthless'],
        careers: ['CEO', 'Manager', 'Entrepreneur', 'Lawyer'],
        famous: ['Steve Jobs', 'Gordon Ramsay', 'Harrison Ford'],
        emoji: '👑'
      },
      'ENTP': {
        name: 'The Debater',
        description: 'Quick-witted and clever, you love intellectual challenges and exploring new ideas through debate.',
        strengths: ['Quick thinking', 'Charismatic', 'Energetic', 'Original'],
        weaknesses: ['Argumentative', 'Intolerant', 'Unfocused'],
        careers: ['Entrepreneur', 'Lawyer', 'Psychologist', 'Journalist'],
        famous: ['Mark Twain', 'Tom Hanks', 'Sarah Silverman'],
        emoji: '🎭'
      },
      'INFJ': {
        name: 'The Advocate',
        description: 'Rare and insightful, you are driven by strong values and a desire to help others reach their potential.',
        strengths: ['Insightful', 'Principled', 'Passionate', 'Creative'],
        weaknesses: ['Perfectionist', 'Overly sensitive', 'Burnout prone'],
        careers: ['Counselor', 'Writer', 'Teacher', 'Artist'],
        famous: ['Martin Luther King Jr.', 'Nelson Mandela', 'Mother Teresa'],
        emoji: '🌟'
      },
      'INFP': {
        name: 'The Mediator',
        description: 'Idealistic and driven by values. You seek harmony and are passionate about causes close to your heart.',
        strengths: ['Empathetic', 'Creative', 'Passionate', 'Dedicated'],
        weaknesses: ['Overly idealistic', 'Impractical', 'Self-critical'],
        careers: ['Writer', 'Artist', 'Psychologist', 'Social Worker'],
        famous: ['J.R.R. Tolkien', 'Johnny Depp', 'Princess Diana'],
        emoji: '🌈'
      },
      'ENFJ': {
        name: 'The Protagonist',
        description: 'Charismatic and inspiring, you are driven to help others and create positive change in the world.',
        strengths: ['Charismatic', 'Altruistic', 'Natural leader', 'Reliable'],
        weaknesses: ['Overly idealistic', 'Condescending', 'Intense'],
        careers: ['Teacher', 'Counselor', 'Coach', 'Politician'],
        famous: ['Oprah Winfrey', 'Barack Obama', 'Maya Angelou'],
        emoji: '🎯'
      },
      'ENFP': {
        name: 'The Campaigner',
        description: 'Enthusiastic and creative, you see life as full of possibilities and are excited by new ideas and people.',
        strengths: ['Enthusiastic', 'Creative', 'Sociable', 'Energetic'],
        weaknesses: ['Unfocused', 'Disorganized', 'Overly optimistic'],
        careers: ['Journalist', 'Actor', 'Entrepreneur', 'Counselor'],
        famous: ['Robin Williams', 'Will Smith', 'Ellen DeGeneres'],
        emoji: '🎨'
      },
      'ISTJ': {
        name: 'The Logistician',
        description: 'Practical and reliable, you prefer order and structure. You are methodical and responsible.',
        strengths: ['Reliable', 'Practical', 'Methodical', 'Loyal'],
        weaknesses: ['Stubborn', 'Insensitive', 'Inflexible'],
        careers: ['Accountant', 'Manager', 'Lawyer', 'Doctor'],
        famous: ['George Washington', 'Warren Buffett', 'Angela Merkel'],
        emoji: '📊'
      },
      'ISFJ': {
        name: 'The Protector',
        description: 'Warm and conscientious, you are driven to help others and create harmony in your environment.',
        strengths: ['Supportive', 'Reliable', 'Patient', 'Imaginative'],
        weaknesses: ['Overly modest', 'Repressing feelings', 'Reluctant to change'],
        careers: ['Nurse', 'Teacher', 'Social Worker', 'Counselor'],
        famous: ['Mother Teresa', 'Kate Middleton', 'Jimmy Carter'],
        emoji: '🛡️'
      },
      'ESTJ': {
        name: 'The Executive',
        description: 'Organized and decisive, you excel at managing people and processes to achieve concrete results.',
        strengths: ['Organized', 'Practical', 'Reliable', 'Dedicated'],
        weaknesses: ['Inflexible', 'Judgmental', 'Impatient'],
        careers: ['Manager', 'Administrator', 'Judge', 'Teacher'],
        famous: ['Frank Sinatra', 'John D. Rockefeller', 'Michelle Obama'],
        emoji: '⚖️'
      },
      'ESFJ': {
        name: 'The Consul',
        description: 'Caring and sociable, you are driven to help others and create harmony in your community.',
        strengths: ['Caring', 'Sociable', 'Loyal', 'Organized'],
        weaknesses: ['Needy', 'Inflexible', 'Vulnerable to criticism'],
        careers: ['Teacher', 'Nurse', 'Social Worker', 'Event Coordinator'],
        famous: ['Taylor Swift', 'Jennifer Garner', 'Danny Glover'],
        emoji: '🤝'
      },
      'ISTP': {
        name: 'The Virtuoso',
        description: 'Practical and adaptable, you prefer to learn through hands-on experience and solve problems as they arise.',
        strengths: ['Practical', 'Adaptable', 'Loyal', 'Relaxed'],
        weaknesses: ['Stubborn', 'Insensitive', 'Private'],
        careers: ['Mechanic', 'Engineer', 'Pilot', 'Photographer'],
        famous: ['Clint Eastwood', 'Tom Cruise', 'Scarlett Johansson'],
        emoji: '🔧'
      },
      'ISFP': {
        name: 'The Adventurer',
        description: 'Flexible and charming, you live in the moment and are driven by your values and desire for harmony.',
        strengths: ['Charming', 'Sensitive', 'Imaginative', 'Passionate'],
        weaknesses: ['Fiercely independent', 'Unpredictable', 'Easily stressed'],
        careers: ['Artist', 'Musician', 'Designer', 'Photographer'],
        famous: ['Bob Dylan', 'Avril Lavigne', 'Lana Del Rey'],
        emoji: '🎨'
      },
      'ESTP': {
        name: 'The Entrepreneur',
        description: 'Energetic and perceptive, you live in the moment and are driven by action and results.',
        strengths: ['Energetic', 'Perceptive', 'Direct', 'Sociable'],
        weaknesses: ['Impatient', 'Risk-prone', 'Unstructured'],
        careers: ['Sales', 'Marketing', 'Entrepreneur', 'Paramedic'],
        famous: ['Donald Trump', 'Madonna', 'Bruce Willis'],
        emoji: '⚡'
      },
      'ESFP': {
        name: 'The Entertainer',
        description: 'Spontaneous and enthusiastic, you love being around people and bringing joy to others.',
        strengths: ['Bold', 'Original', 'Practical', 'Observant'],
        weaknesses: ['Sensitive', 'Conflict-averse', 'Unfocused'],
        careers: ['Actor', 'Artist', 'Counselor', 'Teacher'],
        famous: ['Marilyn Monroe', 'Elvis Presley', 'Jamie Foxx'],
        emoji: '🎭'
      }
    };

    const personality = personalities[mbtiType];
    
    // Calculate confidence scores
    const confidence = {
      EI: Math.abs(answers.E - answers.I) / 4 * 100,
      SN: Math.abs(answers.S - answers.N) / 4 * 100,
      TF: Math.abs(answers.T - answers.F) / 4 * 100,
      JP: Math.abs(answers.J - answers.P) / 4 * 100
    };

    const embed = new MessageEmbed()
      .setTitle(`${personality.emoji} Your MBTI Type: ${mbtiType}`)
      .setDescription(`**${personality.name}**\n\n${personality.description}`)
      .setColor('#6366F1')
      .addFields(
        { name: '💪 Strengths', value: personality.strengths.join(', '), inline: false },
        { name: '⚠️ Potential Weaknesses', value: personality.weaknesses.join(', '), inline: false },
        { name: '💼 Suitable Careers', value: personality.careers.join(', '), inline: false },
        { name: '🌟 Famous People', value: personality.famous.join(', '), inline: false }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter('MBTI results are for entertainment purposes');

    // Add detailed breakdown
    const breakdownEmbed = new MessageEmbed()
      .setTitle('📊 Detailed Analysis')
      .setDescription('Your personality preferences breakdown:')
      .setColor('#10B981')
      .addFields(
        { 
          name: 'Energy Source', 
          value: `**${answers.E > answers.I ? 'Extraversion' : 'Introversion'}** (${Math.round(Math.max(confidence.EI, 51))}% confidence)\n${answers.E > answers.I ? 'You gain energy from interaction' : 'You gain energy from solitude'}`, 
          inline: false 
        },
        { 
          name: 'Information Processing', 
          value: `**${answers.S > answers.N ? 'Sensing' : 'Intuition'}** (${Math.round(Math.max(confidence.SN, 51))}% confidence)\n${answers.S > answers.N ? 'You focus on concrete details' : 'You focus on patterns and possibilities'}`, 
          inline: false 
        },
        { 
          name: 'Decision Making', 
          value: `**${answers.T > answers.F ? 'Thinking' : 'Feeling'}** (${Math.round(Math.max(confidence.TF, 51))}% confidence)\n${answers.T > answers.F ? 'You prioritize logic and objectivity' : 'You prioritize values and harmony'}`, 
          inline: false 
        },
        { 
          name: 'Lifestyle', 
          value: `**${answers.J > answers.P ? 'Judging' : 'Perceiving'}** (${Math.round(Math.max(confidence.JP, 51))}% confidence)\n${answers.J > answers.P ? 'You prefer structure and closure' : 'You prefer flexibility and openness'}`, 
          inline: false 
        }
      );

    // Compatibility information
    const compatibilityEmbed = new MessageEmbed()
      .setTitle('💕 Relationship Compatibility')
      .setDescription('Types that typically work well with you:')
      .setColor('#EC4899')
      .addFields(
        { name: 'Most Compatible', value: this.getCompatibility(mbtiType, 'high'), inline: true },
        { name: 'Good Match', value: this.getCompatibility(mbtiType, 'medium'), inline: true },
        { name: 'Growth Potential', value: this.getCompatibility(mbtiType, 'challenging'), inline: true }
      )
      .setFooter('Compatibility is just one factor in relationships!');

    await message.channel.send({ embeds: [embed] });
    await message.channel.send({ embeds: [breakdownEmbed] });
    await message.channel.send({ embeds: [compatibilityEmbed] });
  }

  getCompatibility(type, level) {
    const compatibility = {
      'INTJ': {
        high: ['ENFP', 'ENTP', 'INFJ'],
        medium: ['INTJ', 'INFP', 'ENTJ'],
        challenging: ['ESFJ', 'ISFJ', 'ESTJ']
      },
      'INTP': {
        high: ['ENTJ', 'ESTJ', 'INFJ'],
        medium: ['INTP', 'ENTP', 'INTJ'],
        challenging: ['ESFJ', 'ISFJ', 'ESFP']
      },
      'ENTJ': {
        high: ['INTP', 'INFP', 'ENFP'],
        medium: ['ENTJ', 'INTJ', 'ENTP'],
        challenging: ['ISFP', 'ESFP', 'ISFJ']
      },
      'ENTP': {
        high: ['INTJ', 'INFJ', 'ENFJ'],
        medium: ['ENTP', 'INTP', 'ENTJ'],
        challenging: ['ISFJ', 'ISTJ', 'ESFJ']
      },
      'INFJ': {
        high: ['ENFP', 'ENTP', 'INTJ'],
        medium: ['INFJ', 'INFP', 'ENFJ'],
        challenging: ['ESTP', 'ESFP', 'ESTJ']
      },
      'INFP': {
        high: ['ENFJ', 'ENTJ', 'INFJ'],
        medium: ['INFP', 'ENFP', 'ISFP'],
        challenging: ['ESTJ', 'ISTJ', 'ESTP']
      },
      'ENFJ': {
        high: ['INFP', 'ISFP', 'INTP'],
        medium: ['ENFJ', 'INFJ', 'ENFP'],
        challenging: ['ISTP', 'ESTP', 'ISTJ']
      },
      'ENFP': {
        high: ['INTJ', 'INFJ', 'ISFJ'],
        medium: ['ENFP', 'INFP', 'ENFJ'],
        challenging: ['ISTJ', 'ESTJ', 'ISTP']
      },
      'ISTJ': {
        high: ['ESFP', 'ESTP', 'ISFP'],
        medium: ['ISTJ', 'ISFJ', 'ESTJ'],
        challenging: ['ENFP', 'INFP', 'ENTP']
      },
      'ISFJ': {
        high: ['ESFP', 'ESTP', 'ISFP'],
        medium: ['ISFJ', 'ISTJ', 'ESFJ'],
        challenging: ['ENTP', 'INTP', 'ENFP']
      },
      'ESTJ': {
        high: ['ISFP', 'ISTP', 'INTP'],
        medium: ['ESTJ', 'ISTJ', 'ESFJ'],
        challenging: ['INFP', 'ENFP', 'INFJ']
      },
      'ESFJ': {
        high: ['ISFP', 'ISTP', 'INFP'],
        medium: ['ESFJ', 'ISFJ', 'ESTJ'],
        challenging: ['INTP', 'ENTP', 'INTJ']
      },
      'ISTP': {
        high: ['ESTJ', 'ESFJ', 'ENFJ'],
        medium: ['ISTP', 'ISFP', 'ESTP'],
        challenging: ['ENFP', 'INFP', 'ENFJ']
      },
      'ISFP': {
        high: ['ESTJ', 'ESFJ', 'ENFJ'],
        medium: ['ISFP', 'ISTP', 'ESFP'],
        challenging: ['ENTJ', 'ENTP', 'INTJ']
      },
      'ESTP': {
        high: ['ISFJ', 'ISTJ', 'INFJ'],
        medium: ['ESTP', 'ISTP', 'ESFP'],
        challenging: ['INFP', 'ENFP', 'INFJ']
      },
      'ESFP': {
        high: ['ISFJ', 'ISTJ', 'INFJ'],
        medium: ['ESFP', 'ISFP', 'ESTP'],
        challenging: ['INTJ', 'INTP', 'ENTJ']
      }
    };

    const typeCompatibility = compatibility[type];
    if (!typeCompatibility) return 'N/A';

    return typeCompatibility[level] ? typeCompatibility[level].join(', ') : 'N/A';
  }
};