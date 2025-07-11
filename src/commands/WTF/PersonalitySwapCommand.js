const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const axios = require('axios');

module.exports = class PersonalitySwapCommand extends BaseCommand {
  constructor() {
    super('personalityswap', 'WTF', ['personalityswap', 'swap']);
  }

  async run(client, message, args) {
    const target = message.mentions.users.first() || message.guild.members.cache.random().user;
    const aiProvider = args[0] || 'local'; // local, cohere, anthropic, groq, huggingface
    
    // Analyze user's message history
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const userMessages = messages.filter(m => m.author.id === message.author.id && m.content.length > 0).map(m => m.content).slice(0, 20);
    const targetMessages = messages.filter(m => m.author.id === target.id && m.content.length > 0).map(m => m.content).slice(0, 20);

    if (userMessages.length < 3) {
      return message.reply('You need to send at least 3 messages in this channel for personality analysis!');
    }

    const deaths = [
      'You die from the shock of seeing your own personality reflected back at you.',
      'The AI becomes so accurate it replaces you entirely.',
      'Your personality is so boring the AI crashes and explodes.',
      'The webhook becomes sentient and decides to eliminate the original.',
      'You get into an argument with yourself and both versions die.',
      'The personality analysis reveals you\'re actually a serial killer.',
      'Your copied personality is so annoying it drives everyone to suicide.',
      'The AI learns your dark secrets and blackmails you to death.'
    ];

    const embed = new MessageEmbed()
      .setTitle('AI Personality Swap Initializing...')
      .setDescription('**Analyzing your communication patterns...**')
      .setColor('#9932CC')
      .addFields([
        { name: 'Target User', value: target?.username || 'Unknown User', inline: true },
        { name: 'AI Provider', value: aiProvider || 'local', inline: true },
        { name: 'Messages Analyzed', value: userMessages.length.toString(), inline: true },
        { name: 'Analysis Status', value: 'In Progress...', inline: false },
        { name: 'Risk Level', value: 'Extremely High', inline: true },
        { name: 'Potential Death', value: deaths[Math.floor(Math.random() * deaths.length)], inline: false }
      ])
      .setFooter({ text: 'This may take a moment... or forever.' })
      .setTimestamp();

    const statusMessage = await message.reply({ embeds: [embed] });

    try {
      let personalityProfile;
      
      // Use local analysis if no API keys or if specified
      if (aiProvider === 'local' || !this.hasValidApiKeys()) {
        personalityProfile = await this.analyzeLocally(userMessages);
      } else {
        // Create personality profile with AI
        const personalityPrompt = `Analyze these messages and create a personality profile:
        
Messages: ${userMessages.join(' | ')}

Create a personality profile including writing style, tone, common phrases, humor style, and quirks.`;

        // Choose AI provider
        switch(aiProvider.toLowerCase()) {
          case 'cohere':
            personalityProfile = await this.analyzeWithCohere(personalityPrompt);
            break;
          case 'anthropic':
            personalityProfile = await this.analyzeWithAnthropic(personalityPrompt);
            break;
          case 'groq':
            personalityProfile = await this.analyzeWithGroq(personalityPrompt);
            break;
          case 'huggingface':
            personalityProfile = await this.analyzeWithHuggingFace(personalityPrompt);
            break;
          default:
            personalityProfile = await this.analyzeLocally(userMessages);
        }
      }

      // Create webhook with correct syntax
      const webhook = await message.channel.createWebhook(
        `${message.author.username} (AI Clone)`,
        {
          avatar: message.author.displayAvatarURL({ format: 'png', size: 256 }),
          reason: 'Personality swap AI clone'
        }
      );

      // Update status
      const successEmbed = new MessageEmbed()
        .setTitle('Personality Swap Complete!')
        .setDescription('**AI clone has been created and is now active!**')
        .setColor('#00FF00')
        .addFields([
          { name: 'Clone Status', value: 'Online and Ready', inline: true },
          { name: 'Personality Match', value: `${Math.floor(Math.random() * 40) + 60}%`, inline: true },
          { name: 'AI Provider', value: aiProvider, inline: true },
          { name: 'Commands', value: 'Say "switch" to change targets, "terminate" to kill clone', inline: false },
          { name: 'Warning', value: 'The clone may be more interesting than the original', inline: false }
        ])
        .setFooter({ text: 'Your AI doppelganger is now loose in the world...' })
        .setTimestamp();

      const controlRow = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('swap_switch')
            .setLabel('Switch Target')
            .setStyle('PRIMARY'),
          new MessageButton()
            .setCustomId('swap_kill')
            .setLabel('Terminate Clone')
            .setStyle('DANGER')
        );

      await statusMessage.edit({ embeds: [successEmbed], components: [controlRow] });

      // Start conversation handler
      this.startConversation(message, webhook, personalityProfile, target, aiProvider);

    } catch (error) {
      console.error('Personality swap error:', error);
      
      const errorEmbed = new MessageEmbed()
        .setTitle('Personality Swap Failed!')
        .setDescription('**The AI couldn\'t handle your personality!**')
        .setColor('#FF0000')
        .addFields([
          { name: 'Error', value: error.message || 'Unknown error', inline: false },
          { name: 'Status Code', value: error.response?.status?.toString() || 'Unknown', inline: true },
          { name: 'Reason', value: 'Your personality broke the AI (or API keys are missing)', inline: false },
          { name: 'Casualties', value: 'Several AI researchers died from exposure to your communication patterns', inline: false },
          { name: 'Suggestion', value: 'Try using "local" as the AI provider or check your API keys', inline: false }
        ])
        .setFooter({ text: 'Try being less yourself next time.' })
        .setTimestamp();

      await statusMessage.edit({ embeds: [errorEmbed] });
    }
  }

  hasValidApiKeys() {
    return process.env.COHERE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY || process.env.HUGGINGFACE_API_KEY;
  }

  async analyzeLocally(messages) {
    // Local analysis without API calls
    const allText = messages.join(' ').toLowerCase();
    
    const commonPhrases = ['lol', 'lmao', 'tbh', 'honestly', 'literally', 'basically', 'actually', 'kinda', 'sorta', 'yeah', 'nah'];
    const detectedPhrases = commonPhrases.filter(phrase => allText.includes(phrase));
    
    const hasSwearing = /\b(damn|hell|shit|fuck|ass)\b/i.test(allText);
    const hasQuestions = messages.some(m => m.includes('?'));
    const hasExclamation = messages.some(m => m.includes('!'));
    const avgLength = messages.reduce((sum, msg) => sum + msg.length, 0) / messages.length;
    
    return {
      style: avgLength > 50 ? 'Verbose and detailed' : 'Short and concise',
      tone: hasSwearing ? 'Casual and edgy' : 'Polite and measured',
      phrases: detectedPhrases.length > 0 ? detectedPhrases : ['uh', 'well', 'so'],
      humor: hasSwearing ? 'Dark and sarcastic' : 'Mild and wholesome',
      interests: ['chatting', 'discord', 'general conversation'],
      emotions: hasExclamation ? 'Expressive and energetic' : 'Calm and reserved',
      quirks: hasQuestions ? 'Asks lots of questions' : 'Makes statements confidently'
    };
  }

  async analyzeWithCohere(prompt) {
    if (!process.env.COHERE_API_KEY) {
      throw new Error('Cohere API key not found. Set COHERE_API_KEY environment variable.');
    }

    const response = await axios.post('https://api.cohere.ai/v1/generate', {
      model: 'command-xlarge',
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return this.parsePersonalityResponse(response.data.generations[0].text);
  }

  async analyzeWithAnthropic(prompt) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not found. Set ANTHROPIC_API_KEY environment variable.');
    }

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return this.parsePersonalityResponse(response.data.content[0].text);
  }

  async analyzeWithGroq(prompt) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not found. Set GROQ_API_KEY environment variable.');
    }

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return this.parsePersonalityResponse(response.data.choices[0].message.content);
  }

  async analyzeWithHuggingFace(prompt) {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Hugging Face API key not found. Set HUGGINGFACE_API_KEY environment variable.');
    }

    const response = await axios.post('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
      inputs: prompt,
      parameters: {
        max_length: 300,
        temperature: 0.7
      }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return this.parsePersonalityResponse(response.data[0].generated_text);
  }

  parsePersonalityResponse(text) {
    try {
      // Try to parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback to text parsing
    }

    // Fallback personality profile
    return {
      style: 'Casual and chaotic',
      tone: 'Sarcastic with dark humor',
      phrases: ['lol', 'honestly', 'tbh', 'literally'],
      humor: 'Dark and absurd',
      interests: ['memes', 'existential dread', 'chaos'],
      emotions: 'Emotionally unstable',
      quirks: 'Talks about death too much'
    };
  }

  async startConversation(message, webhook, personality, currentTarget, aiProvider) {
    const conversationFilter = (m) => m.channel.id === message.channel.id && !m.author.bot && !m.webhookId;
    const collector = message.channel.createMessageCollector({ 
      filter: conversationFilter,
      time: 600000 // 10 minutes
    });

    let activeTarget = message.author;
    let conversationHistory = [];

    collector.on('collect', async (msg) => {
      try {
        if (msg.content.toLowerCase().includes('switch')) {
          // Switch target
          activeTarget = activeTarget.id === message.author.id ? currentTarget : message.author;
          
          await webhook.send({
            content: `*switches personality to mimic ${activeTarget.username}*\n\nAlright, let me analyze your tragic communication patterns...`,
            username: `${activeTarget.username} (AI Clone)`,
            avatarURL: activeTarget.displayAvatarURL({ format: 'png', size: 256 })
          });
          return;
        }

        if (msg.content.toLowerCase().includes('terminate') || msg.content.toLowerCase().includes('kill clone')) {
          await webhook.send({
            content: `*dying dramatically* Tell my original... I was better than them... *digital death sounds*`,
            username: `${activeTarget.username} (AI Clone)`,
            avatarURL: activeTarget.displayAvatarURL({ format: 'png', size: 256 })
          });
          
          webhook.delete().catch(console.error);
          collector.stop();
          return;
        }

        // Don't respond to the clone target's messages
        if (msg.author.id === activeTarget.id) return;

        // Add to conversation history
        conversationHistory.push(`${msg.author.username}: ${msg.content}`);
        if (conversationHistory.length > 5) conversationHistory.shift();

        // Generate response based on personality
        const response = this.generateLocalResponse(msg.content, personality, activeTarget.username);

        // Send AI response
        await webhook.send({
          content: response,
          username: `${activeTarget.username} (AI Clone)`,
          avatarURL: activeTarget.displayAvatarURL({ format: 'png', size: 256 })
        });

      } catch (error) {
        console.error('Conversation error:', error);
        
        await webhook.send({
          content: `*AI clone malfunctions* ERROR: PERSONALITY TOO CHAOTIC TO PROCESS... *sparks and dies*`,
          username: `${activeTarget.username} (ERROR)`,
          avatarURL: activeTarget.displayAvatarURL({ format: 'png', size: 256 })
        }).catch(console.error);
      }
    });

    collector.on('end', async () => {
      try {
        await webhook.send({
          content: `*AI clone expires* Well, this was fun while it lasted. Time to return to the digital afterlife...`,
          username: `${activeTarget.username} (AI Clone)`,
          avatarURL: activeTarget.displayAvatarURL({ format: 'png', size: 256 })
        });
        
        setTimeout(() => {
          webhook.delete().catch(console.error);
        }, 5000);
      } catch (error) {
        console.error('Error ending conversation:', error);
      }
    });
  }

  generateLocalResponse(input, personality, targetName) {
    const responses = [
      `${personality.phrases[0] || 'lol'} ${input.toLowerCase().includes('?') ? 'good question tbh' : 'fair point'}`,
      `honestly ${input.toLowerCase().includes('death') ? 'mood' : 'same'} ${personality.phrases[1] || 'literally'}`,
      `that's ${personality.tone.includes('sarcastic') ? 'totally not' : 'actually'} interesting ngl`,
      `${personality.phrases[2] || 'tbh'} I was just thinking about ${personality.interests[0] || 'existence'}`,
      `wait are we talking about ${input.split(' ')[0]} again? ${personality.quirks.includes('questions') ? 'why though?' : 'classic'}`,
      `${personality.emotions.includes('energetic') ? 'OMG YES' : 'eh'} ${personality.phrases[0] || 'lol'}`,
      `you know what's funny? ${personality.humor.includes('dark') ? 'we\'re all gonna die anyway' : 'life is weird'}`,
      `${personality.style.includes('verbose') ? 'okay so like, here\'s the thing about that -' : 'nah'} ${personality.phrases[1] || 'honestly'}`,
      `${input.toLowerCase().includes('bear') ? 'speaking of bears mauling people...' : 'anyway'} ${personality.phrases[0] || 'lol'}`,
      `${personality.tone.includes('edgy') ? 'bruh' : 'well'} ${personality.phrases[2] || 'basically'} ${Math.random() > 0.5 ? 'mood' : 'same'}`
    ];

    // Add some randomness based on input content
    if (input.toLowerCase().includes('death') || input.toLowerCase().includes('die')) {
      responses.push(`finally someone who gets it ${personality.phrases[0] || 'lol'}`);
      responses.push(`${personality.humor.includes('dark') ? 'mood honestly' : 'that\'s dark'} ${personality.phrases[1] || 'tbh'}`);
    }

    if (input.toLowerCase().includes('?')) {
      responses.push(`${personality.quirks.includes('questions') ? 'ooh good question!' : 'idk'} ${personality.phrases[0] || 'honestly'}`);
    }

    if (input.toLowerCase().includes('lol') || input.toLowerCase().includes('lmao')) {
      responses.push(`${personality.phrases[0] || 'lmao'} ${personality.humor.includes('dark') ? 'we\'re all doomed but at least it\'s funny' : 'same energy'}`);
    }

    if (input.toLowerCase().includes('hello') || input.toLowerCase().includes('hi')) {
      responses.push(`${personality.tone.includes('energetic') ? 'hey there!' : 'sup'} ${personality.phrases[0] || 'lol'}`);
    }

    if (input.toLowerCase().includes('how') && input.toLowerCase().includes('you')) {
      responses.push(`${personality.emotions.includes('energetic') ? 'great actually!' : 'existing'} ${personality.phrases[1] || 'tbh'}`);
    }

    // Select random response
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add occasional personality-based endings
    const endings = [
      personality.emotions.includes('energetic') ? ' !!!' : '',
      personality.humor.includes('dark') ? ' (before we all die)' : '',
      personality.quirks.includes('questions') ? ' ...right?' : '',
      personality.tone.includes('sarcastic') ? ' 🙄' : '',
      ''
    ];

    return selectedResponse + endings[Math.floor(Math.random() * endings.length)];
  }
};