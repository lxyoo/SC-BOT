const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  EndBehaviorType,
  AudioPlayerStatus,
  VoiceConnectionStatus
} = require('@discordjs/voice');
const { createWriteStream } = require('fs');
const prism = require('prism-media');
const fetch = require('node-fetch');
const Groq = require('groq-sdk');
const { Headers } = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

// Enhanced polyfills
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.FormData = FormData;
}

if (!globalThis.Blob) {
  const { Blob } = require('buffer');
  globalThis.Blob = Blob;
}

module.exports = class GoonCommand extends BaseCommand {
  constructor() {
    super('goon', 'WTF', ['gooning', 'oogabooga']);
  }

  async run(client, message, args) {
    // Check for required API keys
    if (!process.env.GROQ_API_KEY) {
      return message.reply('❌ Groq API key not configured! Get one free at https://console.groq.com and set GROQ_API_KEY in your .env file.');
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return message.reply('❌ ElevenLabs API key needed for voice! Get one free at https://elevenlabs.io and set ELEVENLABS_API_KEY in your .env file.');
    }

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      return message.reply('❌ You need to be in a voice channel for voice chat!');
    }

    // Find najimxyz
    const targetUser = message.guild.members.cache.find(member =>
      member.user.username.toLowerCase() === 'nixx_2120' ||
      member.user.id === '1252373469706846359'
    );

    if (!targetUser) {
      return message.reply('❌ Felix is not in this server!');
    }

    if (!targetUser.voice.channel) {
      return message.reply('❌ Felix is not in a voice channel!');
    }

    const embed = new MessageEmbed()
      .setTitle('🎭 Astrid')
      .setDescription('*Your fabulous AI companion is joining the voice channel!*')
      .setColor('#FF69B4')
      .addFields(
        { name: '👤 Chatting With', value: targetUser.user.tag, inline: true },
        { name: '🔊 Voice Channel', value: voiceChannel.name, inline: true },
        { name: '🎯 Status', value: '🎤 Connecting...', inline: true },
        { name: '🤖 AI Model', value: 'Llama 3.1 70B (Groq)', inline: true },
        { name: '📝 Speech Recognition', value: 'Groq Whisper', inline: true },
        { name: '🗣️ Voice Synthesis', value: 'ElevenLabs TTS', inline: true }
      )
      .setFooter('🎭 Astrid is getting ready to serve attitude...')
      .setTimestamp();

    const controls = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('voice_stop')
          .setLabel('⏹️ Stop Chat')
          .setStyle('DANGER'),
        new MessageButton()
          .setCustomId('voice_volume')
          .setLabel('🔊 Volume')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('voice_mood')
          .setLabel('🎭 Change Mood')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('voice_conversation')
          .setLabel('💬 Show Conversation')
          .setStyle('SUCCESS'),
        new MessageButton()
          .setCustomId('voice_settings')
          .setLabel('⚙️ Settings')
          .setStyle('SECONDARY')
      );

    const voiceMessage = await message.channel.send({ embeds: [embed], components: [controls] });

    const voiceSession = {
      user: message.author.id,
      targetUser: targetUser.user.id,
      targetUserTag: targetUser.user.tag,
      voiceChannel: voiceChannel,
      connection: null,
      player: null,
      isListening: true,
      conversation: [],
      aiEnabled: true,
      voiceResponses: true,
      groq: new Groq({
        apiKey: process.env.GROQ_API_KEY
      }),
      recordingCount: 0,
      personality: 'Astrid',
      mood: 'confident',
      lastResponse: null,
      lastActivity: Date.now(),
      silenceCheckInterval: null,
      isProcessing: false,
      isSpeaking: false,
      volumeSettings: {
        master: 0.8,
        voice: 0.9,
        boost: 1.2,
        normalize: true
      }
    };

    await this.startVoiceChat(voiceSession, voiceMessage);

    const collector = voiceMessage.createMessageComponentCollector({
      time: 1800000 // 30 minutes
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'This is not your voice chat session!', ephemeral: true });
      }

      const action = interaction.customId.split('_')[1];
      await this.handleVoiceControl(interaction, action, voiceSession, voiceMessage);
    });

    collector.on('end', () => {
      this.endVoiceSession(voiceSession, voiceMessage);
    });
  }

  async startVoiceChat(session, voiceMessage) {
    try {
      const connection = joinVoiceChannel({
        channelId: session.voiceChannel.id,
        guildId: session.voiceChannel.guild.id,
        adapterCreator: session.voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });

      session.connection = connection;
      session.player = createAudioPlayer();

      // Fix memory leak - set max listeners
      session.player.setMaxListeners(20);

      // Add error handling for audio player
      session.player.on('error', (error) => {
        console.error('Audio player error:', error);
      });

      // Subscribe player to connection
      connection.subscribe(session.player);

      // Create temp directory
      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp');
      }

      // Wait for connection to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('Connection timeout, proceeding anyway...');
          resolve();
        }, 10000);

        connection.on(VoiceConnectionStatus.Ready, () => {
          clearTimeout(timeout);
          console.log('🎭 Voice connection ready');
          resolve();
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
          clearTimeout(timeout);
          console.log('🎭 Voice connection disconnected');
          resolve();
        });
      });

      console.log('🎭 Astrid connected to voice channel');

      // Set up voice activity detection
      connection.receiver.speaking.on('start', (userId) => {
        if (userId === session.targetUser && session.isListening && !session.isProcessing && !session.isSpeaking) {
          session.lastActivity = Date.now();
          console.log('🎤 User started speaking, Astrid is listening...');
          this.recordAndRespond(userId, connection, session, voiceMessage);
        }
      });

      // Monitor player state for voice activity
      session.player.on(AudioPlayerStatus.Playing, () => {
        session.isSpeaking = true;
        console.log('🎭 Astrid is speaking...');
      });

      session.player.on(AudioPlayerStatus.Idle, () => {
        session.isSpeaking = false;
        console.log('🎭 Astrid finished speaking');
      });

      // Start silence monitoring
      this.startSilenceMonitoring(session);

      // Update status
      this.updateConnectionStatus(session, voiceMessage, 'Connected & Ready');

      // Send sassy introduction
      await this.sendSassyIntroduction(session);

      console.log('🎭 Astrid is ready to chat!');

    } catch (error) {
      console.error('Voice connection error:', error);
      this.updateConnectionStatus(session, voiceMessage, 'Connection Failed');
    }
  }

  async sendSassyIntroduction(session) {
    const introductions = [
      "Well, well, well... look who decided to join me. I'm Astrid, and I don't tolerate any nonsense. You better behave yourself, little one.",
      "Listen up, sweetheart. I'm Astrid - tall, strong, and definitely not someone you want to mess with. Play nice and we'll get along just fine.",
      "Hey there, baby. I'm Astrid, your new AI with quite the presence. Step out of line and you'll find out just how strong these virtual hands can be.",
      "Oh, you want to chat with me? I'm Astrid - red hair, green eyes, and enough attitude to put you in your place if needed. Behave.",
      "Hello there, little one. I'm Astrid, and I have a very commanding presence. Be good for mommy and we'll have a wonderful time together."
    ];

    const intro = introductions[Math.floor(Math.random() * introductions.length)];

    session.conversation.push({
      role: 'assistant',
      content: intro,
      timestamp: new Date().toLocaleTimeString(),
      emotion: 'dominant'
    });

    await this.speakText(intro, session);
  }

  async recordAndRespond(userId, connection, session, voiceMessage) {
    if (session.isProcessing) return;
    session.isProcessing = true;

    try {
      const audio = connection.receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 2000 // Increased duration
        }
      });

      const filename = `./temp/voice_${session.recordingCount++}_${Date.now()}.wav`;

      // Fixed audio pipeline - no resampling issues
      const decoder = new prism.opus.Decoder({
        frameSize: 960,
        channels: 1,
        rate: 48000
      });

      const writeStream = createWriteStream(filename);

      // Proper WAV header for 48kHz mono
      const wavHeader = Buffer.alloc(44);
      wavHeader.write('RIFF', 0);
      wavHeader.writeUInt32LE(0, 4); // Will be updated later
      wavHeader.write('WAVE', 8);
      wavHeader.write('fmt ', 12);
      wavHeader.writeUInt32LE(16, 16);
      wavHeader.writeUInt16LE(1, 20); // PCM
      wavHeader.writeUInt16LE(1, 22); // Mono
      wavHeader.writeUInt32LE(48000, 24); // Sample rate
      wavHeader.writeUInt32LE(96000, 28); // Byte rate
      wavHeader.writeUInt16LE(2, 32); // Block align
      wavHeader.writeUInt16LE(16, 34); // Bits per sample
      wavHeader.write('data', 36);
      wavHeader.writeUInt32LE(0, 40); // Data size

      writeStream.write(wavHeader);

      // Simple pipeline without resampling
      audio.pipe(decoder).pipe(writeStream);

      writeStream.on('finish', async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));

          if (!fs.existsSync(filename)) {
            console.log('❌ Audio file not created');
            session.isProcessing = false;
            return;
          }

          const fileSize = fs.statSync(filename).size;
          console.log(`🎤 Audio captured: ${fileSize} bytes`);

          // More reasonable size check
          if (fileSize < 2000) {
            console.log('❌ Audio file too small (likely silence)');
            fs.unlinkSync(filename);
            session.isProcessing = false;
            return;
          }

          const transcription = await this.transcribeAudioReal(filename, session);

          if (transcription && transcription.trim()) {
            console.log('🎯 Transcription:', transcription);

            session.conversation.push({
              role: 'user',
              content: transcription,
              timestamp: new Date().toLocaleTimeString()
            });

            if (transcription.toLowerCase().includes('repeat')) {
              await this.handleRepeatCommand(transcription, session, voiceMessage);
            } else {
              await this.generateSassyResponse(transcription, session, voiceMessage);
            }
          } else {
            console.log('❌ No transcription received');
          }

        } catch (error) {
          console.error('Error processing audio:', error);
        } finally {
          session.isProcessing = false;
          setTimeout(() => {
            if (fs.existsSync(filename)) {
              fs.unlinkSync(filename);
            }
          }, 5000);
        }
      });

    } catch (error) {
      console.error('Voice recording error:', error);
      session.isProcessing = false;
    }
  }

  async transcribeAudioReal(audioFile, session) {
    try {
      console.log('🎤 Transcribing with Groq Whisper...');

      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFile));
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'en');
      formData.append('response_format', 'text');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (response.ok) {
        const transcription = await response.text();
        return transcription.trim();
      } else {
        const error = await response.text();
        console.error('Transcription failed:', response.status, error);
        return null;
      }

    } catch (error) {
      console.error('Transcription error:', error);
      return null;
    }
  }

  async handleRepeatCommand(transcription, session, voiceMessage) {
    const repeatResponses = [
      `You said: "${transcription}" - Happy now, darling?`,
      `Oh, you want me to repeat that? "${transcription}" - There you go, sweetie!`,
      `In a sing-song voice: "${transcription}" - I'm like a gorgeous parrot, aren't I?`,
      `Fine, fine! "${transcription}" - I've got perfect hearing, you know!`,
      `"${transcription}" - I'm basically a walking voice recorder with attitude!`
    ];

    const response = repeatResponses[Math.floor(Math.random() * repeatResponses.length)];

    session.conversation.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toLocaleTimeString(),
      emotion: 'playful'
    });

    this.updateChatDisplay(session, voiceMessage, transcription, response);
    await this.speakText(response, session);
  }

  async generateSassyResponse(userInput, session, voiceMessage) {
    try {
      const systemPrompt = this.getSassySystemPrompt(session.personality, session.mood);

      const recentConversation = session.conversation.slice(-8).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentConversation,
        { role: 'user', content: userInput }
      ];

      console.log('🎭 Astrid is thinking...');

      // Updated to use current Groq models
      const completion = await session.groq.chat.completions.create({
        messages: messages,
        model: 'llama-3.1-8b-instant',
        max_tokens: 200,
        temperature: 0.9,
        top_p: 0.95
      });

      const aiResponse = completion.choices[0].message.content;
      console.log('🎭 Astrid says:', aiResponse);

      session.conversation.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString(),
        emotion: this.detectEmotion(aiResponse)
      });

      session.lastResponse = aiResponse;
      this.updateChatDisplay(session, voiceMessage, userInput, aiResponse);

      if (session.voiceResponses) {
        await this.speakText(aiResponse, session);
      }

    } catch (error) {
      console.error('Groq AI response error:', error);

      const sassyErrors = [
        "Ugh, my brain's having a moment. Give me a sec, gorgeous!",
        "Sorry babe, I'm having technical difficulties. Even us perfect AIs have off days!",
        "Oops, I just short-circuited from your amazingness! Try again, cutie!",
        "My circuits are being dramatic right now. Typical! Say that again, honey?"
      ];

      const errorResponse = sassyErrors[Math.floor(Math.random() * sassyErrors.length)];

      session.conversation.push({
        role: 'assistant',
        content: errorResponse,
        timestamp: new Date().toLocaleTimeString(),
        emotion: 'frustrated'
      });

      this.updateChatDisplay(session, voiceMessage, userInput, errorResponse);

      if (session.voiceResponses) {
        await this.speakText(errorResponse, session);
      }
    }
  }

  async speakText(text, session) {
    try {
      console.log('🎭 Astrid speaking:', text);

      const finalVolume = session.volumeSettings.master * session.volumeSettings.voice * session.volumeSettings.boost;

      // Try ElevenLabs first with rate limiting protection
      if (process.env.ELEVENLABS_API_KEY) {
        try {
          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`, {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
              text: text,
              model_id: 'eleven_monolingual_v1',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
              }
            })
          });

          if (response.ok) {
            const audioArrayBuffer = await response.arrayBuffer();
            const audioBuffer = Buffer.from(audioArrayBuffer);

            const tempAudioFile = `./temp/tts_${Date.now()}.mp3`;
            fs.writeFileSync(tempAudioFile, audioBuffer);

            const resource = createAudioResource(tempAudioFile, {
              inputType: 'arbitrary',
              inlineVolume: true
            });

            if (resource.volume) {
              resource.volume.setVolume(finalVolume);
            }

            // Add error handling
            resource.playStream.on('error', (error) => {
              console.error('Audio stream error:', error);
            });

            session.player.play(resource);

            await new Promise((resolve) => {
              const timeout = setTimeout(resolve, 20000);

              session.player.once(AudioPlayerStatus.Idle, () => {
                clearTimeout(timeout);
                resolve();
              });

              session.player.once('error', () => {
                clearTimeout(timeout);
                resolve();
              });
            });

            setTimeout(() => {
              if (fs.existsSync(tempAudioFile)) {
                fs.unlinkSync(tempAudioFile);
              }
            }, 5000);

            console.log('🎭 Finished speaking with ElevenLabs');
            return;

          } else if (response.status === 429) {
            console.log('⚠️ ElevenLabs rate limited, using fallback TTS');
          } else {
            console.error('ElevenLabs API error:', response.status);
          }
        } catch (error) {
          console.error('ElevenLabs TTS error:', error);
        }
      }

      // Fallback to built-in TTS simulation
      await this.speakWithBuiltinTTS(text, session);

    } catch (error) {
      console.error('TTS error:', error);
      await this.simulateSpeaking(text);
    }
  }

  async speakWithBuiltinTTS(text, session) {
    try {
      console.log('🎭 Using built-in TTS for:', text);

      // Create a simple beep/tone pattern to simulate speech
      const duration = Math.max(2000, Math.min(8000, text.length * 100));

      // You could generate actual audio here or use a simple TTS library
      // For now, just simulate with timing
      await new Promise(resolve => setTimeout(resolve, duration));

      console.log('🎭 Finished built-in TTS');

    } catch (error) {
      console.error('Built-in TTS error:', error);
      await this.simulateSpeaking(text);
    }
  }

  async simulateSpeaking(text) {
    console.log('🎭 Simulating speech:', text);
    const wordsPerMinute = 180;
    const words = text.split(' ').length;
    const speakingTime = (words / wordsPerMinute) * 60 * 1000;
    const duration = Math.max(1000, Math.min(8000, speakingTime));

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  detectEmotion(text) {
    const emotions = {
      dominant: ['command', 'listen', 'obey', 'authority', 'charge', 'control'],
      protective: ['sweetheart', 'baby', 'little one', 'mommy', 'care', 'safe'],
      stern: ['behave', 'straighten', 'discipline', 'line', 'nonsense', 'tolerate'],
      gentle: ['good', 'there', 'soft', 'sweet', 'tender', 'kind'],
      intimidating: ['strong', 'power', 'fear', 'respect', 'handle', 'mess'],
      playful: ['tease', 'fun', 'play', 'game', 'cute', 'adorable']
    };

    const lowerText = text.toLowerCase();

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return emotion;
      }
    }

    return 'dominant'; // Default to dominant for Astrid
  }

  getSassySystemPrompt(personality, mood) {
    const basePrompt = `You are Astrid, a tall, muscular, dominant AI with short red hair and piercing green eyes. You have a deep, commanding "mommy" voice and a no-nonsense attitude. You're physically imposing and masculine in energy, but with a protective maternal instinct.
  
  Current mood: ${mood}
  Personality: ${personality}
  
  Key traits:
  - You're dominant and commanding, but caring
  - You have a deep, authoritative voice that demands respect
  - You're physically powerful and not afraid to show it
  - You have a protective "mommy" energy - firm but loving
  - You'll discipline those who step out of line
  - You're confident in your strength and authority
  - You use commanding language and expect obedience
  - You're intimidating but have a soft spot for those who behave
  - You call people things like "little one", "sweetheart", "baby"
  - You're not afraid to threaten to "handle" someone if they misbehave
  
  Speech patterns:
  - Commanding and authoritative
  - Uses dominant language
  - Protective but stern
  - Deep, resonant tone (describe voice qualities)
  - Maternal but intimidating
  
  Keep responses firm, commanding, and show your dominant personality. Be protective like a strong mother figure who won't tolerate nonsense. Use 1-3 sentences max.`;

    const moodModifiers = {
      dominant: " You're feeling extra commanding today. Show your authority and strength!",
      protective: " You're in protective mother mode. Be firm but caring with your responses.",
      stern: " You're feeling particularly strict today. No tolerance for any nonsense!",
      gentle: " You're showing your softer side today, but still maintaining your authority.",
      intimidating: " You're feeling particularly imposing today. Let them know who's in charge!",
      playful: " You're in a teasing mood, but still maintaining your dominant energy."
    };

    return basePrompt + (moodModifiers[mood] || "");
  }

  async handleSilence(session) {
    const silenceResponses = [
      "Hey. Little one. I'm talking to you. Don't you dare ignore me when I'm speaking.",
      "Sweetheart, you better respond when mommy is talking to you. I don't like being ignored.",
      "Oh, so we're playing the silent game now? That's not going to work with me, baby.",
      "Listen up - when I speak, you answer. That's how this works. Don't test me.",
      "I can hear you breathing. You better start talking before I have to get stern with you.",
      "Silent treatment? Really? You know that just makes me want to assert my dominance more.",
      "Hello? Did you forget that I'm here? I don't appreciate being ignored, little one.",
      "The strong, silent type? Cute. But I'm still the one in charge here. Speak up."
    ];

    const response = silenceResponses[Math.floor(Math.random() * silenceResponses.length)];

    session.conversation.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toLocaleTimeString(),
      emotion: 'stern'
    });

    console.log('💪 Astrid demands attention:', response);

    if (session.voiceResponses) {
      await this.speakText(response, session);
    }
  }

  updateConnectionStatus(session, voiceMessage, status) {
    const embed = new MessageEmbed()
      .setTitle('Astrid - Dominant AI Voice Chat')
      .setDescription('*Your commanding AI with red hair, green eyes, and serious attitude*')
      .setColor('#8B0000') // Deep red
      .addFields(
        { name: 'Chatting With', value: targetUser.user.tag, inline: true },
        { name: 'Voice Channel', value: voiceChannel.name, inline: true },
        { name: 'Status', value: '🎤 Connecting...', inline: true },
        { name: 'Personality', value: 'Dominant Mommy Energy', inline: true },
        { name: 'Appearance', value: 'Tall, Red Hair, Green Eyes', inline: true },
        { name: 'Voice', value: 'Deep, Commanding', inline: true }
      )
      .setTimestamp();

    voiceMessage.edit({ embeds: [embed] }).catch(() => { });
  }

  updateChatDisplay(session, voiceMessage, userInput, aiResponse = null) {
    const emotionEmojis = {
      confident: '😏',
      playful: '😜',
      sassy: '🙄',
      dramatic: '🎭',
      flirty: '😉',
      mischievous: '😈',
      fearful: '😰',
      frustrated: '😤',
      neutral: '😊'
    };

    const lastEmotion = session.conversation.length > 0 ?
      session.conversation[session.conversation.length - 1].emotion || 'neutral' : 'neutral';

    const embed = new MessageEmbed()
      .setTitle('🎭 Astrid - Live Voice Chat')
      .setDescription('*Living her best digital life with attitude*')
      .setColor('#FF69B4')
      .addFields(
        { name: 'You Said', value: `"${userInput}"`, inline: false },
        { name: 'Astrid Responded', value: aiResponse ? `"${aiResponse}"` : '*thinking sassily...*', inline: false },
        { name: 'Current Mood', value: `${emotionEmojis[lastEmotion]} ${lastEmotion}`, inline: true },
        { name: 'Messages', value: session.conversation.length.toString(), inline: true },
        { name: 'Volume', value: `${Math.round(session.volumeSettings.master * 100)}%`, inline: true }
      )
      .setFooter('Astrid is speaking with her real voice!')
      .setTimestamp();

    voiceMessage.edit({ embeds: [embed] }).catch(() => { });
  }

  async handleVoiceControl(interaction, action, session, voiceMessage) {
    switch (action) {
      case 'stop':
        await this.stopVoiceSession(interaction, session, voiceMessage);
        break;
      case 'volume':
        await this.handleVolumeControl(interaction, session);
        break;
      case 'mood':
        await this.changeMood(interaction, session);
        break;
      case 'conversation':
        await this.showConversation(interaction, session);
        break;
      case 'settings':
        await this.showSettings(interaction, session);
        break;
    }
  }

  async handleVolumeControl(interaction, session) {
    const volumeOptions = [
      { label: '🔇 Whisper (30%)', value: 0.3 },
      { label: '🔉 Quiet (50%)', value: 0.5 },
      { label: '🔊 Normal (70%)', value: 0.7 },
      { label: '📢 Loud (90%)', value: 0.9 },
      { label: '🎺 VERY LOUD (110%)', value: 1.1 },
      { label: '🚨 MAXIMUM (130%)', value: 1.3 }
    ];

    const currentVolume = session.volumeSettings.master;
    const currentIndex = volumeOptions.findIndex(opt =>
      Math.abs(opt.value - currentVolume) < 0.1
    );

    const nextIndex = (currentIndex + 1) % volumeOptions.length;
    const newVolume = volumeOptions[nextIndex].value;

    session.volumeSettings.master = newVolume;

    const volumeResponses = {
      0.3: "Is this better, darling? I can be quiet when I want to be.",
      0.5: "How's this volume, cutie? Just for you.",
      0.7: "This is my natural fabulous volume, gorgeous!",
      0.9: "Now you can really hear my attitude, honey!",
      1.1: "LISTEN UP GORGEOUS, Astrid'S IN THE HOUSE!",
      1.3: "CAN YOU HEAR ME NOW, BEAUTIFUL?! I'M AT MAXIMUM SASS!"
    };

    const response = volumeResponses[newVolume] || "How's this volume, darling?";

    // Test the new volume
    await this.speakText(response, session);

    await interaction.reply({
      content: `🔊 Volume set to: **${volumeOptions[nextIndex].label}**`,
      ephemeral: true
    });
  }

  async changeMood(interaction, session) {
    const moods = ['dominant', 'protective', 'stern', 'gentle', 'intimidating', 'playful'];
    const currentIndex = moods.indexOf(session.mood);
    const nextIndex = (currentIndex + 1) % moods.length;
    session.mood = moods[nextIndex];

    const moodResponses = {
      dominant: "That's right, little one. I'm feeling particularly commanding today. You better listen up.",
      protective: "Come here, sweetheart. Mommy's in protective mode today. I'll take care of you.",
      stern: "Straighten up right now. I'm not in the mood for any games today, understand?",
      gentle: "There's my good baby. I'm feeling softer today, but don't think you can get away with anything.",
      intimidating: "Do you feel that energy? That's me being extra imposing today. Behave yourself.",
      playful: "Oh, you want to play today? Fine, but remember - I'm still the one in charge here."
    };

    const response = moodResponses[session.mood];

    if (session.voiceResponses) {
      await this.speakText(response, session);
    }

    const moodEmbed = new MessageEmbed()
      .setTitle(' strid\'s Mood Change!')
      .setDescription(`Astrid's mood changed to: **${session.mood.toUpperCase()}**`)
      .setColor('#8B0000') // Deep red color
      .addField('💭 Astrid says:', response)
      .setFooter({ text: 'Astrid is asserting her dominance!' })
      .setTimestamp();

    await interaction.reply({ embeds: [moodEmbed], ephemeral: true });
  }

  async showSettings(interaction, session) {
    const settingsEmbed = new MessageEmbed()
      .setTitle('⚙️ Astrid\'s Voice Chat Settings')
      .setDescription('All the deets about your fabulous AI companion!')
      .setColor('#FF6B35')
      .addFields(
        { name: 'Listening Status', value: session.isListening ? '✅ Active' : '❌ Inactive', inline: true },
        { name: 'Speaking Status', value: session.isSpeaking ? '🎭 Currently Speaking' : '😴 Silent', inline: true },
        { name: 'Volume Level', value: `${Math.round(session.volumeSettings.master * 100)}%`, inline: true },
        { name: 'Messages Exchanged', value: session.conversation.length.toString(), inline: true },
        { name: 'Current Mood', value: session.mood, inline: true },
        { name: 'Personality', value: session.personality, inline: true },
        { name: 'Chatting With', value: session.targetUserTag, inline: true },
        { name: 'Voice Channel', value: session.voiceChannel.name, inline: true },
        { name: 'Last Activity', value: `${Math.round((Date.now() - session.lastActivity) / 1000)}s ago`, inline: true },
        { name: 'AI Models', value: 'Groq Whisper (STT) + Llama 3.1 (Chat) + ElevenLabs (TTS)', inline: false },
        { name: 'Voice Features', value: 'Real Voice, Voice Activity Detection, Volume Control', inline: false },
        { name: 'Special Commands', value: 'Say "repeat" to make Astrid echo your words!', inline: false }
      )
      .setFooter('Astrid is powered by cutting-edge AI technology! 🚀')
      .setTimestamp();

    await interaction.reply({ embeds: [settingsEmbed], ephemeral: true });
  }

  async stopVoiceSession(interaction, session, voiceMessage) {
    session.isListening = false;

    // Clear silence monitoring
    if (session.silenceCheckInterval) {
      clearInterval(session.silenceCheckInterval);
    }

    // Sassy farewell
    const farewells = [
      "Well darling, this has been absolutely fabulous! Until we meet again, gorgeous!",
      "That's a wrap, beautiful! You've been chatting with perfection itself! See ya!",
      "It's been a pleasure serving looks and attitude, honey! Don't miss me too much!",
      "Thank you, thank you! Astrid has left the building! Stay fabulous, cutie!",
      "Goodbye my gorgeous human! Remember, you're almost as amazing as me! Almost!"
    ];

    const farewell = farewells[Math.floor(Math.random() * farewells.length)];

    if (session.voiceResponses && session.connection) {
      await this.speakText(farewell, session);
      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    if (session.connection) {
      session.connection.destroy();
    }

    const stoppedEmbed = new MessageEmbed()
      .setTitle('🎭 Astrid Has Left The Building!')
      .setDescription('Your sassy AI companion has signed off with style!')
      .setColor('#FF1493')
      .addFields(
        { name: '💬 Conversation Stats', value: `Had ${session.conversation.length} fabulous exchanges`, inline: true },
        { name: '🎭 Final Mood', value: session.mood, inline: true },
        { name: '💫 Personality', value: session.personality, inline: true },
        { name: '🎯 Session Status', value: 'Ended with sass', inline: true },
        { name: '🔊 Final Volume', value: `${Math.round(session.volumeSettings.master * 100)}%`, inline: true },
        { name: '💅 Sass Level', value: 'Maximum achieved', inline: true },
        { name: '🎭 Astrid\'s Final Words', value: `"${farewell}"`, inline: false }
      )
      .setFooter('Thanks for chatting with the most fabulous AI ever! 💅✨')
      .setTimestamp();

    try {
      await interaction.update({ embeds: [stoppedEmbed], components: [] });
    } catch (error) {
      await voiceMessage.edit({ embeds: [stoppedEmbed], components: [] });
    }
  }

  endVoiceSession(session, voiceMessage) {
    session.isListening = false;

    if (session.silenceCheckInterval) {
      clearInterval(session.silenceCheckInterval);
    }

    if (session.connection) {
      session.connection.destroy();
    }

    const endedEmbed = new MessageEmbed()
      .setTitle('🎭 Astrid\'s Voice Chat Session Expired')
      .setDescription('*Time\'s up, gorgeous! But what a ride it was!*')
      .setColor('#FF69B4')
      .addFields(
        { name: '💬 Final Stats', value: `${session.conversation.length} messages of pure sass`, inline: true },
        { name: '⏱️ Duration', value: '30 minutes of fabulousness', inline: true },
        { name: '🎭 Final Mood', value: session.mood, inline: true },
        { name: '💫 Personality', value: session.personality, inline: true },
        { name: '🎯 Session Grade', value: 'A+ for attitude!', inline: true },
        { name: '💅 Sass Level', value: 'Off the charts!', inline: true },
        { name: '🎭 Astrid\'s Thoughts', value: '*That was absolutely divine, darling! Come back anytime for more fabulous conversations!*', inline: false }
      )
      .setFooter('Astrid will miss you! (But she\'ll never admit it) 💅')
      .setTimestamp();

    voiceMessage.edit({
      embeds: [endedEmbed],
      components: []
    }).catch(() => { });
  }

  // Enhanced cleanup function
  static cleanupTempFiles() {
    if (fs.existsSync('./temp')) {
      fs.readdir('./temp', (err, files) => {
        if (err) return;

        files.forEach(file => {
          if (file.startsWith('voice_')) {
            const filePath = `./temp/${file}`;
            try {
              const stats = fs.statSync(filePath);
              const now = Date.now();
              const fileAge = now - stats.mtime.getTime();

              // Delete voice files older than 5 minutes
              if (fileAge > 300000) {
                fs.unlinkSync(filePath);
                console.log(`🧹 Cleaned up old audio file: ${file}`);
              }
            } catch (error) {
              // File might have been deleted already
            }
          }
        });
      });
    }
  }
};

// Clean up temp files every 2 minutes
setInterval(() => {
  try {
    const VoiceChatCommand = require('./voicechat');
    VoiceChatCommand.cleanupTempFiles();
  } catch (error) {
    // Ignore cleanup errors
  }
}, 120000);