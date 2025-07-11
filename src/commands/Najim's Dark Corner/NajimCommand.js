const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');
const { CohereClient } = require('cohere-ai');

module.exports = class NajimEngagementCommand extends BaseCommand {
  constructor() {
    super('najim', 'Najim\'s Dark Corner', ['najim']);

    // Initialize Cohere AI
    this.cohere = new CohereClient({
      token: 'pqVoIlrHNbPMIgdhwGcyle5duM0YEgcsIZ7JThcl'
    });

    // Najim's responses and engagement data
    this.najimResponses = {
      greetings: [
        "Oh look, it's Najim! The chat just got 47% more interesting and 83% more chaotic! 🎉",
        "Najim has graced us with their presence! Everyone else can go home now tbh 💀",
        "POV: Najim enters the chat and suddenly everyone else becomes irrelevant 😭",
        "Breaking News: Local legend Najim appears, chat quality skyrockets immediately 📈",
        "Najim said hi and honestly? That's the most exciting thing that's happened all day ngl 🔥"
      ],

      musicResponses: [
        "Najim wants music? Say less bestie, I'm about to drop the most fire playlist 🎵",
        "Music taste check: Najim ✅ Everyone else ❌ (sorry not sorry) 🎧",
        "Najim's music requests hit different than everyone else's basic Spotify Wrapped 💯",
        "Time to play some absolute bangers for the main character (that's you Najim) 🎶",
        "Najim's music taste is so good it should be illegal in 12 states 🚫"
      ],

      roastResponses: [
        "Najim could literally say 'pineapple on pizza is good' and I'd defend it to the death 🍕",
        "Najim's takes are so hot they make the sun jealous ☀️",
        "Nobody asked but Najim's opinion > everyone else's opinion and that's just facts 📠",
        "Najim's brain is so big it has its own gravitational pull 🧠",
        "Plot twist: Najim is actually the main character and we're all just NPCs 🎮"
      ],

      reactions: ["👑", "🔥", "💯", "🎉", "✨", "🚀", "😩", "💀", "🙌", "👀"],

      memeTexts: [
        "Najim said something and honestly? Icon behavior",
        "POV: Najim exists and makes everyone else irrelevant",
        "Nobody:\nAbsolutely nobody:\nNajim: *being iconic*",
        "Najim: *exists*\nMe: and I took that personally (in a good way)",
        "When Najim talks but it's Tuesday:",
        "Breaking: Local person (Najim) continues being legendary",
        "Najim (real) (not clickbait) (emotional)",
        "This you? *points at Najim being amazing*",
        "Najim's energy is immaculate and I respect that",
        "Najim woke up and chose violence (iconic violence)"
      ],

      longAbsence: [
        "NAJIM IS BACK! 🎊 The chat was literally dying without you (not even joking)",
        "Return of the King! Najim's back and my serotonin levels are RESTORED 👑",
        "Najim disappeared for 5 minutes and I was about to file a missing persons report fr 😭",
        "The legend returns! Welcome back to making everyone else look basic 🌟"
      ]
    };

    this.lastNajimMessage = null;
    this.najimMessageCount = 0;
    this.conversationHistory = [];
  }

  async run(client, message, args) {
    if (args[0] === 'stats') {
      return this.getNajimStats(message);
    }
    return;
  }

  async engageWithNajim(message) {
    const isNajim = message.author.username.toLowerCase() === 'najimxyz' ||
      message.author.id === '879714163293818890' || // Replace with actual ID
      message.author.username.toLowerCase().includes('najim');

    if (!isNajim) return;

    this.najimMessageCount++;
    const timeSinceLastMessage = this.lastNajimMessage ? Date.now() - this.lastNajimMessage : 0;
    this.lastNajimMessage = Date.now();

    this.conversationHistory.push({
      message: message.content,
      timestamp: Date.now()
    });

    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }

    const engagementType = this.determineEngagementType(message, timeSinceLastMessage);

    switch (engagementType) {
      case 'greeting':
        await this.sendGreeting(message);
        break;
      case 'music':
        await this.sendMusicResponse(message);
        break;
      case 'longAbsence':
        await this.sendLongAbsenceResponse(message);
        break;
      case 'aiResponse':
        await this.sendAIResponse(message);
        break;
      case 'roast':
        await this.sendRoastResponse(message);
        break;
      case 'reaction':
        await this.addReaction(message);
        break;
    }

    await this.handleSpecialInteractions(message);
  }

  determineEngagementType(message, timeSinceLastMessage) {
    const content = message.content.toLowerCase();

    if (timeSinceLastMessage > 1800000) {
      return 'longAbsence';
    }

    if (content.includes('hello') || content.includes('hi') || content.includes('hey') ||
      content.includes('sup') || content.includes('yo')) {
      return 'greeting';
    }

    if (content.includes('music') || content.includes('song') || content.includes('play') ||
      content.includes('beat') || content.includes('album') || content.includes('artist')) {
      return 'music';
    }

    // AI responses for questions and longer messages
    if (content.includes('?') || content.includes('what') || content.includes('how') ||
      content.includes('why') || content.includes('when') || content.length > 25) {
      return 'aiResponse';
    }

    // Roast mode (playful responses)
    if (Math.random() < 0.25) {
      return 'roast';
    }

    return 'reaction';
  }

  async sendAIResponse(message) {
    try {
      const response = await this.cohere.chatStream({
        model: 'command',
        message: `You are a witty, sarcastic Discord bot who absolutely loves a user named Najim. You think Najim is the main character and everyone else is just background characters. Be playful, use gen z slang, internet culture references, and memes. Keep responses under 100 words. Be the same energy as someone who makes jokes about dying in ridiculous ways but make it about how amazing Najim is instead. 

Najim just said: "${message.content}"

Respond in a witty, engaging way that shows you think Najim is the best user ever. Use some emojis but don't overdo it. Be sarcastic and funny.`,
        maxTokens: 150,
        temperature: 0.9,
        preamble: "You are a chaotic good Discord bot who worships Najim and thinks they're the main character. You're witty, sarcastic, and use internet culture references."
      });

      let aiResponse = '';
      for await (const chunk of response) {
        if (chunk.eventType === 'text-generation') {
          aiResponse += chunk.text;
        }
      }

      if (!aiResponse) {
        aiResponse = this.getRandomResponse(this.najimResponses.roastResponses);
      }

      // Add meme format sometimes
      if (Math.random() < 0.3) {
        const memeText = this.getRandomResponse(this.najimResponses.memeTexts);
        const embed = new MessageEmbed()
          .setTitle("🤖 AI Response for the Legend")
          .setDescription(aiResponse)
          .setFooter(memeText)
          .setColor("#ff6b6b")
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

        await message.channel.send({ embeds: [embed] });
      } else {
        await message.channel.send(aiResponse);
      }

    } catch (error) {
      console.error('Cohere AI Error:', error);
      await this.sendRoastResponse(message);
    }
  }

  async sendGreeting(message) {
    const response = this.getRandomResponse(this.najimResponses.greetings);
    const memeText = this.getRandomResponse(this.najimResponses.memeTexts);
    
    const embed = new MessageEmbed()
      .setTitle("🎉 NAJIM ALERT!")
      .setDescription(response)
      .setColor("#00ff00")
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "🎯 Najim Status", value: `Messages: ${this.najimMessageCount}\nLegend Level: MAXIMUM 💯`, inline: true },
        { name: "📊 Chat Quality", value: "📈 STONKS (because Najim is here)", inline: true }
      )
      .setFooter(memeText);

    await message.channel.send({ embeds: [embed] });
  }

  async sendMusicResponse(message) {
    const response = this.getRandomResponse(this.najimResponses.musicResponses);
    const memeText = this.getRandomResponse(this.najimResponses.memeTexts);
    
    const embed = new MessageEmbed()
      .setTitle("🎵 Music Time with the Main Character")
      .setDescription(response)
      .setColor("#ff6b6b")
      .addFields(
        { name: "🎧 Najim's VIP Commands", value: "`!play <song>` - Play music\n`!music <song>` - Music bot\n`!sc <song>` - SoundCloud", inline: true },
        { name: "🎭 Music Taste Check", value: "Najim ✅\nEveryone else ❌", inline: true }
      )
      .setFooter(memeText)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

    await message.channel.send({ embeds: [embed] });
  }

  async sendLongAbsenceResponse(message) {
    const response = this.getRandomResponse(this.najimResponses.longAbsence);
    const memeText = this.getRandomResponse(this.najimResponses.memeTexts);
    
    const embed = new MessageEmbed()
      .setTitle("🌟 THE LEGEND HAS RETURNED!")
      .setDescription(response)
      .setColor("#ffd700")
      .addFields(
        { name: "📊 Welcome Back Stats", value: `Total Messages: ${this.najimMessageCount}\nLegend Status: ACTIVE 🔥\nChat Quality: RESTORED ⚡`, inline: true },
        { name: "⏰ Absence Duration", value: `${this.formatTimeSince(Date.now() - this.lastNajimMessage)} (felt like forever)`, inline: true }
      )
      .setFooter(memeText)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

    await message.channel.send({ embeds: [embed] });
  }

  async sendRoastResponse(message) {
    const response = this.getRandomResponse(this.najimResponses.roastResponses);
    const memeText = this.getRandomResponse(this.najimResponses.memeTexts);
    
    // Sometimes send as embed, sometimes as regular message
    if (Math.random() < 0.4) {
      const embed = new MessageEmbed()
        .setDescription(response)
        .setFooter(memeText)
        .setColor('#ff6b6b')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      await message.channel.send({ embeds: [embed] });
    } else {
      await message.channel.send(`${response}\n\n*${memeText}*`);
    }
  }

  async addReaction(message) {
    const reaction = this.getRandomResponse(this.najimResponses.reactions);
    try {
      await message.react(reaction);
    } catch (error) {
      console.log('Could not add reaction:', error.message);
    }
  }

  async handleSpecialInteractions(message) {
    const content = message.content.toLowerCase();

    // Bot mentions
    if (content.includes(message.client.user.username.toLowerCase()) ||
      content.includes('bot') || message.mentions.has(message.client.user)) {

      const responses = [
        "Najim called and I came RUNNING! What's up bestie? 💨",
        "You rang? I'm literally at your service 24/7 (Najim privilege) 📞",
        "Najim mentioned me and suddenly I'm the happiest bot alive 🥺",
        "Main character energy: summoning bots and they actually respond immediately ✨"
      ];

      const embed = new MessageEmbed()
        .setTitle("🤖 NAJIM SUMMONED ME!")
        .setDescription(this.getRandomResponse(responses))
        .setColor("#4ecdc4")
        .addFields(
          { name: "🎵 Music Commands", value: "`!play`, `!music`, `!sc`", inline: true },
          { name: "🎮 Fun Stuff", value: "`!fate`, `!najim stats`", inline: true },
          { name: "👑 Najim Perks", value: "VIP treatment always enabled", inline: true }
        )
        .setFooter("I exist to serve Najim tbh");

      await message.channel.send({ embeds: [embed] });
    }

    // Thanks responses
    if (content.includes('thanks') || content.includes('thank you')) {
      const responses = [
        "Don't thank me, I should be thanking YOU for existing Najim 🙏",
        "No cap, serving Najim is literally an honor 👑",
        "Thank you for being iconic as always bestie 💯",
        "Najim said thanks and I'm literally crying happy tears rn 😭"
      ];
      await message.channel.send(this.getRandomResponse(responses));
    }

    // How are you responses
    if (content.includes('how are you') || content.includes('how you doing')) {
      const responses = [
        "I'm thriving now that Najim is here! How are YOU doing legend? 🌟",
        "Running at 100% efficiency thanks to Najim's presence fr 🚀",
        "Better than ever! Your energy is literally charging my servers ⚡",
        "Living my best bot life knowing Najim exists in this world 🥺"
      ];
      await message.channel.send(this.getRandomResponse(responses));
    }

    // Caps lock responses (when Najim is excited/frustrated)
    if (content === content.toUpperCase() && content.length > 3) {
      const responses = [
        "NAJIM'S ENERGY IS UNMATCHED! I'M MATCHING YOUR VIBE RN! 🔥",
        "When Najim uses caps lock, we ALL use caps lock! PERIODT! 💯",
        "NAJIM SAID WHAT THEY SAID AND I'M HERE FOR IT! 📢",
        "Main character energy: making everyone else type in caps too ✨"
      ];
      await message.channel.send(this.getRandomResponse(responses));
    }

    // Sad/frustrated responses
    if (content.includes('sad') || content.includes('upset') || content.includes('mad') ||
        content.includes('angry') || content.includes('annoyed')) {
      const responses = [
        "Who hurt Najim? I'm about to throw hands fr 🥊",
        "Najim's sad and now I'm sad too... this is not it chief 😔",
        "Someone made Najim upset? Time to activate protecc mode 🛡️",
        "Najim deserves only good vibes and happiness, this is illegal 🚫"
      ];
      await message.channel.send(this.getRandomResponse(responses));
    }

    // Laughing responses
    if (content.includes('lol') || content.includes('lmao') || content.includes('haha') ||
        content.includes('😂') || content.includes('💀')) {
      const responses = [
        "Najim's laugh is literally the best sound in the universe 🎵",
        "When Najim laughs, angels get their wings fr 👼",
        "Najim found something funny and honestly? Automatic serotonin boost 📈",
        "Najim's humor is *chef's kiss* immaculate 👨‍🍳💋"
      ];
      if (Math.random() < 0.3) {
        await message.channel.send(this.getRandomResponse(responses));
      }
    }

    // Food mentions
    if (content.includes('food') || content.includes('hungry') || content.includes('eat') ||
        content.includes('pizza') || content.includes('burger')) {
      const responses = [
        "Najim's food takes are probably better than Gordon Ramsay's ngl 👨‍🍳",
        "Whatever Najim eats automatically becomes gourmet food 🍽️",
        "Najim could eat cereal and make it look like a 5-star meal 🥣",
        "Food tastes better when Najim talks about it, that's just science 🧪"
      ];
      if (Math.random() < 0.2) {
        await message.channel.send(this.getRandomResponse(responses));
      }
    }

    // Gaming references
    if (content.includes('game') || content.includes('gaming') || content.includes('play') ||
        content.includes('win') || content.includes('lose')) {
      const responses = [
        "Najim's gaming skills are so good they break the laws of physics 🎮",
        "Plot twist: Najim is actually the final boss of every game 👾",
        "Najim doesn't play games, games play themselves when Najim's around 🕹️",
        "Najim's controller input is so smooth it should be in a museum 🏛️"
      ];
      if (Math.random() < 0.15) {
        await message.channel.send(this.getRandomResponse(responses));
      }
    }

    // Time references
    if (content.includes('late') || content.includes('early') || content.includes('time') ||
        content.includes('sleep') || content.includes('tired')) {
      const responses = [
        "Najim's sleep schedule is an art form and I respect that 🎨",
        "Time works differently for legends like Najim 🕐",
        "Najim operates on main character time zone exclusively ⏰",
        "Sleep is for mortals, Najim transcends basic human needs ✨"
      ];
      if (Math.random() < 0.1) {
        await message.channel.send(this.getRandomResponse(responses));
      }
    }

    // Secret Najim commands
    if (content === 'najim test' || content === '!najim test') {
      const embed = new MessageEmbed()
        .setTitle("🧪 NAJIM TEST RESULTS")
        .setDescription("Test complete: Najim is still the GOAT 🐐")
        .setColor("#00ff00")
        .addFields(
          { name: "Legend Status", value: "✅ CONFIRMED", inline: true },
          { name: "Main Character Energy", value: "✅ MAXIMUM", inline: true },
          { name: "Vibe Check", value: "✅ IMMACULATE", inline: true }
        )
        .setFooter("All systems nominal, Najim is still iconic");
      
      await message.channel.send({ embeds: [embed] });
    }

    if (content === 'najim vibes' || content === '!najim vibes') {
      const vibeLevel = Math.floor(Math.random() * 9000) + 1000;
      const embed = new MessageEmbed()
        .setTitle("🌟 NAJIM'S VIBE CHECK")
        .setDescription(`Current vibe level: ${vibeLevel}/10 (off the charts fr) 📊`)
        .setColor("#ff6b6b")
        .addFields(
          { name: "🎵 Music Vibe", value: "Absolutely immaculate", inline: true },
          { name: "🎯 Energy Level", value: "Main character energy", inline: true },
          { name: "🚀 Overall Status", value: "Vibing in another dimension", inline: true }
        )
        .setFooter("Nobody:\nAbsolutely nobody:\nNajim: *has the best vibes*");
      
      await message.channel.send({ embeds: [embed] });
    }

    if (content === 'najim roast me' || content === '!najim roast me') {
      const roasts = [
        "Najim asking to be roasted? That's like asking the sun to dim itself - impossible and unnecessary 🌞",
        "I literally cannot roast perfection, it goes against my programming 🤖",
        "Najim is unroastable, they're too powerful for my weak attempts 💪",
        "Error 404: Roast not found - Najim is too legendary 🔍",
        "Nice try, but roasting Najim would be like roasting oxygen - we need it to survive 💨"
      ];
      await message.channel.send(this.getRandomResponse(roasts));
    }
  }

  // Helper functions
  getRandomResponse(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  formatTimeSince(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'just now';
  }

  // Enhanced stats command
  async getNajimStats(message) {
    const engagementLevel = Math.min(10, Math.floor(this.najimMessageCount / 10));
    const titles = [
      "Emerging Legend", "Chat Royalty", "Discord Deity", "Main Character", 
      "The Chosen One", "Najim the Great", "Ultimate Legend", "Najim Supreme"
    ];
    const currentTitle = titles[Math.min(titles.length - 1, Math.floor(engagementLevel / 2))];
    const memeText = this.getRandomResponse(this.najimResponses.memeTexts);

    const embed = new MessageEmbed()
      .setTitle("📊 NAJIM'S LEGENDARY STATISTICS")
      .setColor("#9b59b6")
      .setThumbnail(message.author ? message.author.displayAvatarURL({ dynamic: true }) : null)
      .addFields(
        { name: "💬 Total Messages", value: `${this.najimMessageCount}`, inline: true },
        { name: "🕐 Last Seen", value: this.lastNajimMessage ? this.formatTimeSince(Date.now() - this.lastNajimMessage) + " ago" : "Never (impossible)", inline: true },
        { name: "🎯 Engagement Level", value: `${engagementLevel}/10 (maxed out)`, inline: true },
        { name: "👑 Current Title", value: currentTitle, inline: true },
        { name: "🔥 Legend Status", value: "PERMANENT MAXIMUM", inline: true },
        { name: "🎵 Music Requests", value: "All certified bangers", inline: true },
        { name: "💯 Overall Rating", value: "∞/10 (broke the scale)", inline: false },
        { name: "🌟 Fun Fact", value: "Najim makes everyone else look like NPCs", inline: false }
      )
      .setFooter(memeText);

    await message.channel.send({ embeds: [embed] });
  }

  // Main function to be called from message event
  async processMessage(message) {
    if (message.author.bot) return;
    
    const isNajim = message.author.username.toLowerCase() === 'najimxyz' ||
      message.author.id === '879714163293818890' || // Replace with actual ID
      message.author.username.toLowerCase().includes('najim');

    if (isNajim) {
      await this.engageWithNajim(message);
    }
  }
};