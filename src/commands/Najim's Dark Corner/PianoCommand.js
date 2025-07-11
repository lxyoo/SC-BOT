const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus
} = require('@discordjs/voice');
const { createCanvas, registerFont } = require('canvas');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const axios = require('axios');

module.exports = class PianoCommand extends BaseCommand {
  constructor() {
    super('piano', 'Najim\'s Dark Corner', ['keyboard', 'music', 'play']);
  }

  async run(client, message, args) {
    // Check for URL/link in args
    const urlArg = args.find(arg => this.isValidUrl(arg) || ytdl.validateURL(arg));

    // Check if user is in a voice channel
    const voiceChannel = message.member.voice.channel;

    // Create interactive piano canvas
    const pianoCanvas = await this.createPianoCanvas();
    const attachment = new MessageAttachment(pianoCanvas, 'piano.png');

    const embed = new MessageEmbed()
      .setTitle('🎹 Interactive Piano Studio')
      .setDescription([
        '🎵 **Click buttons below to play notes**',
        '🎹 **Computer Keyboard Controls:**',
        '```',
        'White Keys: A S D F G H J K L ; \'',
        'Black Keys: W E   T Y U   O P',
        '```',
        '🎶 **Features:**',
        '• Record & Playback melodies',
        '• Load YouTube/MP3 audio',
        '• Realistic piano sounds',
        '• Full keyboard mapping'
      ].join('\n'))
      .setColor('#8B4513')
      .addFields(
        { name: '🔊 Voice Channel', value: voiceChannel ? `Connected to: ${voiceChannel.name}` : 'Join a voice channel for audio!', inline: true },
        { name: '🎵 External Audio', value: urlArg ? 'Loading external audio...' : 'None loaded', inline: true },
        { name: '📊 Session', value: 'Ready to play!', inline: true }
      )
      .setImage('attachment://piano.png')
      .setFooter('Use keyboard shortcuts or click buttons below!')
      .setTimestamp();

    // Create piano control buttons
    const whiteKeys1 = new MessageActionRow()
      .addComponents(
        new MessageButton().setCustomId('piano_C4').setLabel('C4').setStyle('SECONDARY').setEmoji('🎹'),
        new MessageButton().setCustomId('piano_D4').setLabel('D4').setStyle('SECONDARY').setEmoji('🎹'),
        new MessageButton().setCustomId('piano_E4').setLabel('E4').setStyle('SECONDARY').setEmoji('🎹'),
        new MessageButton().setCustomId('piano_F4').setLabel('F4').setStyle('SECONDARY').setEmoji('🎹'),
        new MessageButton().setCustomId('piano_G4').setLabel('G4').setStyle('SECONDARY').setEmoji('🎹')
      );

    const whiteKeys2 = new MessageActionRow()
      .addComponents(
        new MessageButton().setCustomId('piano_A4').setLabel('A4').setStyle('SECONDARY').setEmoji('🎹'),
        new MessageButton().setCustomId('piano_B4').setLabel('B4').setStyle('SECONDARY').setEmoji('🎹'),
        new MessageButton().setCustomId('piano_C5').setLabel('C5').setStyle('SECONDARY').setEmoji('🎹'),
        new MessageButton().setCustomId('piano_D5').setLabel('D5').setStyle('SECONDARY').setEmoji('🎹'),
        new MessageButton().setCustomId('piano_E5').setLabel('E5').setStyle('SECONDARY').setEmoji('🎹')
      );

    const blackKeys = new MessageActionRow()
      .addComponents(
        new MessageButton().setCustomId('piano_CS4').setLabel('C#4').setStyle('PRIMARY').setEmoji('🎼'),
        new MessageButton().setCustomId('piano_DS4').setLabel('D#4').setStyle('PRIMARY').setEmoji('🎼'),
        new MessageButton().setCustomId('piano_FS4').setLabel('F#4').setStyle('PRIMARY').setEmoji('🎼'),
        new MessageButton().setCustomId('piano_GS4').setLabel('G#4').setStyle('PRIMARY').setEmoji('🎼'),
        new MessageButton().setCustomId('piano_AS4').setLabel('A#4').setStyle('PRIMARY').setEmoji('🎼')
      );

    const controlsRow = new MessageActionRow()
      .addComponents(
        new MessageButton().setCustomId('piano_record').setLabel('🔴 Record').setStyle('DANGER'),
        new MessageButton().setCustomId('piano_stop').setLabel('⏹️ Stop').setStyle('SECONDARY'),
        new MessageButton().setCustomId('piano_play').setLabel('▶️ Playback').setStyle('SUCCESS'),
        new MessageButton().setCustomId('piano_load').setLabel('🔗 Load Audio').setStyle('SUCCESS'),
        new MessageButton().setCustomId('piano_preset').setLabel('🎵 Preset').setStyle('SUCCESS')
      );

    const pianoMessage = await message.channel.send({
      embeds: [embed],
      files: [attachment],
      components: [whiteKeys1, whiteKeys2, blackKeys, controlsRow]
    });

    // Initialize piano session
    const pianoSession = {
      user: message.author.id,
      recording: false,
      melody: [],
      startTime: Date.now(),
      lastNote: null,
      voiceChannel: voiceChannel,
      connection: null,
      player: null,
      externalAudio: urlArg || null,
      keyboardListening: true,
      canvas: pianoCanvas,
      pressedKeys: new Set(),
      keyBindings: this.getKeyBindings()
    };

    // Handle external audio if provided
    if (urlArg) {
      await this.loadExternalAudio(urlArg, pianoSession, pianoMessage);
    }

    // Set up interaction collector
    const collector = pianoMessage.createMessageComponentCollector({
      time: 600000 // 10 minutes
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: '❌ This is not your piano!', ephemeral: true });
      }

      const action = interaction.customId.split('_')[1];

      if (this.isNoteKey(action)) {
        await this.playNote(interaction, action, pianoSession);
      } else {
        await this.handleControl(interaction, action, pianoSession, pianoMessage);
      }
    });

    collector.on('end', () => {
      this.cleanup(pianoSession, pianoMessage);
    });

    // Set up keyboard listening (simulated via message reactions)
    this.setupKeyboardSimulation(message, pianoSession);
  }

  async createPianoCanvas() {
    const canvas = createCanvas(1200, 300);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 300);
    bgGradient.addColorStop(0, '#2C3E50');
    bgGradient.addColorStop(1, '#34495E');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 300);

    // Piano base
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 200, 1200, 100);

    // Draw white keys
    const whiteKeys = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'];
    const whiteKeyWidth = 100;
    const whiteKeyHeight = 180;

    whiteKeys.forEach((key, index) => {
      const x = index * (whiteKeyWidth + 2) + 50;
      const y = 20;

      // Key gradient
      const keyGradient = ctx.createLinearGradient(x, y, x, y + whiteKeyHeight);
      keyGradient.addColorStop(0, '#FFFFFF');
      keyGradient.addColorStop(0.8, '#F8F8F8');
      keyGradient.addColorStop(1, '#E0E0E0');

      ctx.fillStyle = keyGradient;
      ctx.fillRect(x, y, whiteKeyWidth, whiteKeyHeight);

      // Key border
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, whiteKeyWidth, whiteKeyHeight);

      // Key label
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(key, x + whiteKeyWidth / 2, y + whiteKeyHeight - 15);

      // Keyboard shortcut
      const shortcut = this.getKeyboardShortcut(key);
      if (shortcut) {
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.fillText(shortcut.toUpperCase(), x + whiteKeyWidth / 2, y + whiteKeyHeight - 30);
      }
    });

    // Draw black keys
    const blackKeys = [
      { key: 'CS4', pos: 1.5 }, { key: 'DS4', pos: 2.5 },
      { key: 'FS4', pos: 4.5 }, { key: 'GS4', pos: 5.5 }, { key: 'AS4', pos: 6.5 },
      { key: 'CS5', pos: 8.5 }, { key: 'DS5', pos: 9.5 }
    ];

    const blackKeyWidth = 60;
    const blackKeyHeight = 120;

    blackKeys.forEach(({ key, pos }) => {
      const x = pos * (whiteKeyWidth + 2) + 50 - blackKeyWidth / 2;
      const y = 20;

      // Key gradient
      const keyGradient = ctx.createLinearGradient(x, y, x, y + blackKeyHeight);
      keyGradient.addColorStop(0, '#333333');
      keyGradient.addColorStop(0.8, '#222222');
      keyGradient.addColorStop(1, '#111111');

      ctx.fillStyle = keyGradient;
      ctx.fillRect(x, y, blackKeyWidth, blackKeyHeight);

      // Key border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, blackKeyWidth, blackKeyHeight);

      // Key label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(key, x + blackKeyWidth / 2, y + blackKeyHeight - 15);

      // Keyboard shortcut
      const shortcut = this.getKeyboardShortcut(key);
      if (shortcut) {
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '10px Arial';
        ctx.fillText(shortcut.toUpperCase(), x + blackKeyWidth / 2, y + blackKeyHeight - 30);
      }
    });

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎹 Interactive Piano Studio', 600, 250);

    // Instructions
    ctx.fillStyle = '#DDDDDD';
    ctx.font = '16px Arial';
    ctx.fillText('Use keyboard shortcuts or click buttons below to play!', 600, 280);

    return canvas.toBuffer();
  }

  getKeyBindings() {
    return {
      // White keys
      'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4',
      'k': 'C5', 'l': 'D5', ';': 'E5', "'": 'F5',

      // Black keys
      'w': 'CS4', 'e': 'DS4', 't': 'FS4', 'y': 'GS4', 'u': 'AS4',
      'o': 'CS5', 'p': 'DS5',

      // Numbers for octaves
      '1': 'C3', '2': 'D3', '3': 'E3', '4': 'F3', '5': 'G3', '6': 'A3', '7': 'B3',
      '8': 'C6', '9': 'D6', '0': 'E6'
    };
  }

  getKeyboardShortcut(note) {
    const bindings = this.getKeyBindings();
    return Object.keys(bindings).find(key => bindings[key] === note);
  }

  async generateRealisticPianoAudio(note) {
    const noteInfo = this.getNoteInfo(note);
    const frequency = noteInfo.frequency;
    const duration = 3.0; // Piano notes ring longer

    return new Promise((resolve, reject) => {
      const fileName = `./temp/piano_${note}_${Date.now()}.wav`;

      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp');
      }

      // Piano-specific harmonic structure
      const harmonics = [
        { freq: frequency, amp: 1.0, phase: 0 },           // Fundamental
        { freq: frequency * 2, amp: 0.3, phase: 0.2 },     // 2nd harmonic (octave)
        { freq: frequency * 3, amp: 0.15, phase: 0.1 },    // 3rd harmonic
        { freq: frequency * 4, amp: 0.08, phase: 0.3 },    // 4th harmonic
        { freq: frequency * 5, amp: 0.05, phase: 0.15 },   // 5th harmonic
        { freq: frequency * 6, amp: 0.03, phase: 0.25 },   // 6th harmonic
        { freq: frequency * 7, amp: 0.02, phase: 0.05 },   // 7th harmonic
        { freq: frequency * 8, amp: 0.01, phase: 0.35 }    // 8th harmonic
      ];

      // Create piano-like waveform instead of pure sine
      const waveformInputs = harmonics.map((h, i) => {
        // Mix sine and sawtooth for more realistic timbre
        return `sine=frequency=${h.freq}:duration=${duration}:phase=${h.phase}[s${i}]; ` +
          `sawtooth=frequency=${h.freq}:duration=${duration}[saw${i}]; ` +
          `[s${i}][saw${i}]amix=inputs=2:weights=0.7 0.3[wave${i}]; ` +
          `[wave${i}]volume=${h.amp}[h${i}]`;
      }).join('; ');

      // Piano-specific ADSR envelope (Attack, Decay, Sustain, Release)
      const envelope = `afade=t=in:d=0.02:curve=qsin,` +     // Very fast attack
        `afade=t=out:d=1.2:curve=exp,` +        // Long exponential decay
        `acompressor=threshold=0.8:ratio=2:` +   // Slight compression
        `attack=5:release=50,` +                 // Piano-like compression
        `equalizer=frequency=200:width_type=h:width=100:gain=2,` +  // Boost low mids
        `equalizer=frequency=2000:width_type=h:width=200:gain=1,` + // Slight high boost
        `equalizer=frequency=8000:width_type=h:width=1000:gain=-1`; // Reduce harsh highs

      // Mix all harmonics and apply piano characteristics
      const filterComplex = waveformInputs + '; ' +
        harmonics.map((_, i) => `[h${i}]`).join('') +
        `amix=inputs=${harmonics.length}:duration=longest[mixed]; ` +
        `[mixed]${envelope}[piano]; ` +
        // Add subtle reverb for piano room sound
        `[piano]aecho=0.8:0.88:60:0.4,aecho=0.8:0.88:120:0.2[out]`;

      const ffmpegArgs = [
        '-f', 'lavfi',
        '-i', filterComplex,
        '-map', '[out]',
        '-ar', '48000',
        '-ac', '2',
        '-f', 'wav',
        fileName,
        '-y'
      ];

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(fileName);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }

  async loadExternalAudio(url, session, message) {
    try {
      let audioPath;

      if (ytdl.validateURL(url)) {
        // YouTube audio
        audioPath = await this.downloadYouTubeAudio(url);
      } else if (this.isValidUrl(url)) {
        // Direct MP3/audio URL
        audioPath = await this.downloadAudioFile(url);
      } else {
        throw new Error('Invalid URL format');
      }

      session.externalAudio = audioPath;

      const embed = new MessageEmbed()
        .setTitle('🎵 External Audio Loaded')
        .setDescription('Successfully loaded external audio file!')
        .setColor('#00FF00')
        .addFields(
          { name: '🔗 Source', value: this.truncateUrl(url), inline: true },
          { name: '📁 Status', value: 'Ready to play', inline: true },
          { name: '🎹 Note', value: 'Use ▶️ Playback to hear it!', inline: true }
        );

      await message.edit({ embeds: [embed] });

    } catch (error) {
      console.error('Error loading external audio:', error);
      const errorEmbed = new MessageEmbed()
        .setTitle('❌ Audio Load Failed')
        .setDescription('Failed to load external audio file.')
        .setColor('#FF0000')
        .addField('Error', error.message);

      await message.edit({ embeds: [errorEmbed] });
    }
  }

  async downloadYouTubeAudio(url) {
    return new Promise((resolve, reject) => {
      const fileName = `./temp/youtube_${Date.now()}.mp3`;

      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp');
      }

      const stream = ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        format: 'mp3'
      });

      const writeStream = fs.createWriteStream(fileName);
      stream.pipe(writeStream);

      writeStream.on('finish', () => {
        resolve(fileName);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  async downloadAudioFile(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios({
          method: 'GET',
          url: url,
          responseType: 'stream'
        });

        const fileName = `./temp/audio_${Date.now()}.mp3`;

        if (!fs.existsSync('./temp')) {
          fs.mkdirSync('./temp');
        }

        const writeStream = fs.createWriteStream(fileName);
        response.data.pipe(writeStream);

        writeStream.on('finish', () => {
          resolve(fileName);
        });

        writeStream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  setupKeyboardSimulation(message, session) {
    // Create a follow-up message for keyboard input simulation
    const keyboardEmbed = new MessageEmbed()
      .setTitle('⌨️ Keyboard Control')
      .setDescription([
        '**React with these emojis to simulate keyboard input:**',
        '🅰️ = A (C4) | 🇸 = S (D4) | 🇩 = D (E4) | 🇫 = F (F4) | 🇬 = G (G4)',
        '🇭 = H (A4) | 🇯 = J (B4) | 🇰 = K (C5) | 🇱 = L (D5)',
        '🇼 = W (C#4) | 🇪 = E (D#4) | 🇹 = T (F#4) | 🇾 = Y (G#4) | 🇺 = U (A#4)'
      ].join('\n'))
      .setColor('#3498DB')
      .setFooter('Add/remove reactions to play/stop notes');

    message.channel.send({ embeds: [keyboardEmbed] }).then(keyboardMessage => {
      // Add initial reactions
      const keyReactions = ['🅰️', '🇸', '🇩', '🇫', '🇬', '🇭', '🇯', '🇰', '🇱', '🇼', '🇪', '🇹', '🇾', '🇺'];

      keyReactions.forEach(async (emoji) => {
        try {
          await keyboardMessage.react(emoji);
        } catch (error) {
          console.error('Error adding reaction:', error);
        }
      });

      // Listen for reaction changes
      const reactionCollector = keyboardMessage.createReactionCollector({
        time: 600000 // 10 minutes
      });

      reactionCollector.on('collect', async (reaction, user) => {
        if (user.id !== session.user) return;

        const note = this.getNoteFromReaction(reaction.emoji.name);
        if (note) {
          await this.simulateKeyPress(note, session, keyboardMessage);
        }
      });

      reactionCollector.on('remove', async (reaction, user) => {
        if (user.id !== session.user) return;

        const note = this.getNoteFromReaction(reaction.emoji.name);
        if (note) {
          await this.simulateKeyRelease(note, session, keyboardMessage);
        }
      });
    });
  }

  getNoteFromReaction(emoji) {
    const reactionMap = {
      '🅰️': 'C4', '🇸': 'D4', '🇩': 'E4', '🇫': 'F4', '🇬': 'G4',
      '🇭': 'A4', '🇯': 'B4', '🇰': 'C5', '🇱': 'D5',
      '🇼': 'CS4', '🇪': 'DS4', '🇹': 'FS4', '🇾': 'GS4', '🇺': 'AS4'
    };
    return reactionMap[emoji] || null;
  }

  async simulateKeyPress(note, session, keyboardMessage) {
    if (!session.pressedKeys.has(note)) {
      session.pressedKeys.add(note);

      // Play the note
      if (session.voiceChannel && session.connection) {
        await this.playNoteInVoice(note, session);
      }

      // Visual feedback
      const embed = new MessageEmbed()
        .setTitle('🎹 Key Pressed')
        .setDescription(`Playing: **${this.getNoteInfo(note).name}**`)
        .setColor('#00FF00')
        .addField('🎵 Note', `${this.getNoteEmoji(note)} ${this.getSoundEffect(note)}`, true)
        .addField('⌨️ Keyboard', `Simulated via reaction`, true);

      await keyboardMessage.edit({ embeds: [embed] });
    }
  }

  async simulateKeyRelease(note, session, keyboardMessage) {
    if (session.pressedKeys.has(note)) {
      session.pressedKeys.delete(note);

      // Stop the note if needed
      // (Piano notes naturally decay, so we don't need to explicitly stop)

      // Visual feedback
      const embed = new MessageEmbed()
        .setTitle('🎹 Key Released')
        .setDescription(`Released: **${this.getNoteInfo(note).name}**`)
        .setColor('#FF9900')
        .addField('🎵 Note', `${this.getNoteEmoji(note)} Released`, true)
        .addField('⌨️ Keyboard', `Reaction removed`, true);

      await keyboardMessage.edit({ embeds: [embed] });
    }
  }

  isNoteKey(action) {
    return action.includes('4') || action.includes('5') || action.includes('S') || action.includes('3') || action.includes('6');
  }

  async playNote(interaction, note, session) {
    const noteInfo = this.getNoteInfo(note);
    const noteEmoji = this.getNoteEmoji(note);
    const soundEffect = this.getSoundEffect(note);

    // Add to melody if recording
    if (session.recording) {
      session.melody.push({
        note: note,
        time: Date.now() - session.startTime,
        emoji: noteEmoji,
        frequency: noteInfo.frequency
      });
    }

    session.lastNote = note;

    // Play note in voice channel if connected
    if (session.voiceChannel && session.connection) {
      await this.playNoteInVoice(note, session);
    }

    // Create enhanced note visualization
    const noteEmbed = new MessageEmbed()
      .setTitle('🎹 Piano Note')
      .setDescription(`${noteEmoji} **${noteInfo.name}** - ${noteInfo.frequency}Hz`)
      .setColor(noteInfo.color)
      .addFields(
        { name: '🎵 Sound', value: soundEffect, inline: true },
        { name: '📊 Recording', value: session.recording ? `${session.melody.length} notes` : 'Not recording', inline: true },
        { name: '🎶 Last Notes', value: this.getLastNotes(session.melody), inline: false },
        { name: '🔊 Voice Output', value: session.connection ? '✅ Playing in voice' : '❌ Not connected to voice', inline: true },
        { name: '⌨️ Keyboard', value: `Key: ${this.getKeyboardShortcut(note)?.toUpperCase() || 'N/A'}`, inline: true },
        { name: '🎼 Octave', value: `${noteInfo.octave}`, inline: true }
      )
      .setFooter(`Key: ${noteInfo.key} | Use keyboard shortcuts for faster playing!`)
      .setTimestamp();

    await interaction.reply({ embeds: [noteEmbed], ephemeral: true });
  }

  async playNoteInVoice(note, session) {
    try {
      // Ensure user is in voice channel
      if (!session.voiceChannel) {
        console.log('No voice channel available');
        return;
      }

      // Create/get connection
      if (!session.connection) {
        const connection = joinVoiceChannel({
          channelId: session.voiceChannel.id,
          guildId: session.voiceChannel.guild.id,
          adapterCreator: session.voiceChannel.guild.voiceAdapterCreator,
        });

        session.connection = connection;

        // Wait for connection to be ready
        await new Promise((resolve) => {
          connection.on(VoiceConnectionStatus.Ready, resolve);
          setTimeout(resolve, 1000); // Fallback timeout
        });
      }

      // Create new player for each note to avoid conflicts
      const player = createAudioPlayer();
      session.connection.subscribe(player);

      // Generate realistic piano audio
      const audioFile = await this.generateRealisticPianoAudio(note);
      const resource = createAudioResource(audioFile, {
        inputType: 'arbitrary',
        inlineVolume: true
      });

      // Set volume and play
      resource.volume.setVolume(50.0);
      player.play(resource);

      // Clean up audio file after playing
      player.on(AudioPlayerStatus.Idle, () => {
        try {
          fs.unlinkSync(audioFile);
        } catch (error) {
          console.error('Error cleaning up audio file:', error);
        }
      });

    } catch (error) {
      console.error('Error playing note in voice:', error);
    }
  }

  async handleControl(interaction, action, session, pianoMessage) {
    switch (action) {
      case 'record':
        session.recording = !session.recording;
        if (session.recording) {
          session.melody = [];
          session.startTime = Date.now();
        }

        await interaction.reply({
          content: `🔴 Recording ${session.recording ? 'started' : 'stopped'}!`,
          ephemeral: true
        });
        break;

      case 'stop':
        session.recording = false;
        if (session.player) {
          session.player.stop();
        }
        await interaction.reply({
          content: '⏹️ All playback stopped!',
          ephemeral: true
        });
        break;

      case 'play':
        if (session.externalAudio) {
          await this.playExternalAudio(interaction, session);
        } else if (session.melody.length > 0) {
          await this.playMelody(interaction, session.melody, session.voiceChannel, session);
        } else {
          await interaction.reply({
            content: '❌ No melody recorded and no external audio loaded!',
            ephemeral: true
          });
        }
        break;

      case 'load':
        await this.promptForAudioLoad(interaction, session);
        break;

      case 'preset':
        await this.playPreset(interaction, session);
        break;
    }
  }

  async playExternalAudio(interaction, session) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to play audio!',
        ephemeral: true
      });
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      session.connection = connection;
      const player = createAudioPlayer();
      session.player = player;
      connection.subscribe(player);

      const resource = createAudioResource(session.externalAudio);
      player.play(resource);

      const playingEmbed = new MessageEmbed()
        .setTitle('🎵 Playing External Audio')
        .setDescription('Playing loaded audio file in voice channel!')
        .setColor('#00FF00')
        .addField('🔊 Voice Channel', voiceChannel.name, true)
        .addField('📁 Audio Source', 'External file', true)
        .addField('🎹 Mix with Piano', 'Play piano notes while audio plays!', true);

      await interaction.reply({ embeds: [playingEmbed], ephemeral: true });

    } catch (error) {
      console.error('Error playing external audio:', error);
      await interaction.reply({ content: '❌ Error playing external audio!', ephemeral: true });
    }
  }

  async promptForAudioLoad(interaction, session) {
    const loadEmbed = new MessageEmbed()
      .setTitle('🔗 Load External Audio')
      .setDescription([
        '**To load external audio:**',
        '1. Reply with a YouTube URL',
        '2. Reply with a direct MP3/audio link',
        '3. Or use the command: `/piano <url>`',
        '',
        '**Supported formats:**',
        '• YouTube videos (audio will be extracted)',
        '• Direct MP3, WAV, M4A links',
        '• SoundCloud links (if accessible)',
        '',
        '**Examples:**',
        '`https://youtube.com/watch?v=...`',
        '`https://example.com/song.mp3`'
      ].join('\n'))
      .setColor('#3498DB')
      .setFooter('Reply with a URL in the next 30 seconds');

    await interaction.reply({ embeds: [loadEmbed], ephemeral: true });

    // Wait for URL response
    const filter = (m) => m.author.id === session.user;
    const collector = interaction.channel.createMessageCollector({
      filter,
      max: 1,
      time: 30000
    });

    collector.on('collect', async (message) => {
      const url = message.content.trim();

      if (this.isValidUrl(url) || ytdl.validateURL(url)) {
        await this.loadExternalAudio(url, session, interaction);
        message.react('✅');
      } else {
        message.react('❌');
        await interaction.followUp({
          content: '❌ Invalid URL format! Please provide a valid YouTube or direct audio link.',
          ephemeral: true
        });
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.followUp({
          content: '⏰ Audio load prompt timed out.',
          ephemeral: true
        });
      }
    });
  }

  async playMelody(interaction, melody, voiceChannel, session) {
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to play the melody!',
        ephemeral: true
      });
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      session.connection = connection;

      const melodyEmbed = new MessageEmbed()
        .setTitle('🎵 Playing Recorded Melody')
        .setDescription(`Playing your recorded melody in **${voiceChannel.name}**!`)
        .setColor('#00FF00')
        .addFields(
          { name: '📊 Notes', value: `${melody.length} notes`, inline: true },
          { name: '⏱️ Duration', value: `${Math.floor(melody[melody.length - 1].time / 1000)}s`, inline: true },
          { name: '🎶 Melody', value: melody.slice(0, 10).map(n => n.emoji).join(' ') + (melody.length > 10 ? '...' : ''), inline: false },
          { name: '🔊 Voice Channel', value: voiceChannel.name, inline: true }
        )
        .setFooter('🎼 Realistic piano melody playback in progress...');

      await interaction.reply({ embeds: [melodyEmbed], ephemeral: true });

      // Generate and play the melody with realistic piano sounds
      const audioFile = await this.generateRealisticMelodyAudio(melody);
      const resource = createAudioResource(audioFile);
      const player = createAudioPlayer();

      session.player = player;
      connection.subscribe(player);
      player.play(resource);

      // Enhanced playback visualization
      this.visualizeMelodyPlayback(interaction, melody, melodyEmbed);

      player.on(AudioPlayerStatus.Idle, () => {
        melodyEmbed.setDescription('🎉 Melody playback complete!');
        melodyEmbed.setColor('#32CD32');
        interaction.editReply({ embeds: [melodyEmbed] }).catch(() => { });

        setTimeout(() => {
          connection.destroy();
        }, 2000);
      });

    } catch (error) {
      console.error('Melody playback error:', error);
      await interaction.editReply({ content: '❌ Failed to play melody!' }).catch(() => { });
    }
  }

  async generateRealisticMelodyAudio(melody) {
    return new Promise((resolve, reject) => {
      const fileName = `./temp/piano_melody_${Date.now()}.wav`;

      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp');
      }

      // Create complex filter for realistic piano melody
      let filterComplex = '';
      let inputs = [];

      melody.forEach((note, index) => {
        const noteInfo = this.getNoteInfo(note.note);
        const frequency = noteInfo.frequency;
        const startTime = note.time / 1000;
        const duration = 1.5; // Longer, more realistic note duration

        // Generate multiple harmonics for each note
        const harmonics = [
          { freq: frequency, amp: 50.0 },
          { freq: frequency * 2, amp: 0.4 },
          { freq: frequency * 3, amp: 0.2 },
          { freq: frequency * 4, amp: 0.1 }
        ];

        harmonics.forEach((harmonic, hIndex) => {
          inputs.push('-f', 'lavfi', '-i',
            `sine=frequency=${harmonic.freq}:duration=${duration}`);
        });

        // Create harmonic mix for each note
        const noteInputs = harmonics.map((_, hIndex) =>
          `[${index * harmonics.length + hIndex}]volume=${harmonics[hIndex].amp}[h${index}_${hIndex}]`
        ).join(';');

        const noteMix = harmonics.map((_, hIndex) =>
          `[h${index}_${hIndex}]`
        ).join('') + `amix=inputs=${harmonics.length}:duration=longest[note${index}];`;

        filterComplex += noteInputs + ';' + noteMix;

        // Add ADSR envelope and delay
        filterComplex += `[note${index}]afade=t=in:d=0.05:curve=esin,afade=t=out:d=0.5:curve=esin,adelay=${startTime * 1000}|${startTime * 1000}[delayed${index}];`;
      });

      // Mix all notes together
      const finalMix = melody.map((_, index) => `[delayed${index}]`).join('') +
        `amix=inputs=${melody.length}:duration=longest,volume=50.0[out]`;

      filterComplex += finalMix;

      const ffmpegArgs = [
        ...inputs,
        '-filter_complex', filterComplex,
        '-map', '[out]',
        '-ar', '48000',
        '-ac', '2',
        '-f', 'wav',
        fileName,
        '-y'
      ];

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(fileName);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }

  visualizeMelodyPlayback(interaction, melody, embed) {
    let currentNote = 0;
    const playbackInterval = setInterval(() => {
      if (currentNote < melody.length) {
        const note = melody[currentNote];
        const noteInfo = this.getNoteInfo(note.note);
        const progress = Math.floor((currentNote / melody.length) * 100);

        embed.setFields(
          { name: '📊 Notes', value: `${melody.length} notes`, inline: true },
          { name: '⏱️ Progress', value: `${progress}% complete`, inline: true },
          { name: '🎶 Melody', value: melody.slice(0, 10).map(n => n.emoji).join(' ') + (melody.length > 10 ? '...' : ''), inline: false },
          { name: '🎵 Now Playing', value: `${note.emoji} **${noteInfo.name}** (${currentNote + 1}/${melody.length})`, inline: true },
          { name: '🔊 Voice Channel', value: 'Playing...', inline: true },
          { name: '🎹 Frequency', value: `${noteInfo.frequency}Hz`, inline: true }
        );

        const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
        embed.setDescription(`🎵 **Playing Melody** [${progressBar}] ${progress}%`);

        interaction.editReply({ embeds: [embed] }).catch(() => { });
        currentNote++;
      } else {
        clearInterval(playbackInterval);
      }
    }, 600);
  }

  async playPreset(interaction, session) {
    const presets = {
      'Für Elise (Beethoven)': [
        { note: 'E5', emoji: '🎼' }, { note: 'DS5', emoji: '🎵' }, { note: 'E5', emoji: '🎼' }, { note: 'DS5', emoji: '🎵' },
        { note: 'E5', emoji: '🎼' }, { note: 'B4', emoji: '🎶' }, { note: 'D5', emoji: '🎵' }, { note: 'C5', emoji: '🎼' },
        { note: 'A4', emoji: '🎹' }
      ],
      'Twinkle Twinkle Little Star': [
        { note: 'C4', emoji: '⭐' }, { note: 'C4', emoji: '⭐' }, { note: 'G4', emoji: '✨' }, { note: 'G4', emoji: '✨' },
        { note: 'A4', emoji: '🌟' }, { note: 'A4', emoji: '🌟' }, { note: 'G4', emoji: '✨' },
        { note: 'F4', emoji: '🌙' }, { note: 'F4', emoji: '🌙' }, { note: 'E4', emoji: '💫' }, { note: 'E4', emoji: '💫' },
        { note: 'D4', emoji: '⭐' }, { note: 'D4', emoji: '⭐' }, { note: 'C4', emoji: '✨' }
      ],
      'Happy Birthday': [
        { note: 'C4', emoji: '🎂' }, { note: 'C4', emoji: '🎂' }, { note: 'D4', emoji: '🎉' }, { note: 'C4', emoji: '🎂' },
        { note: 'F4', emoji: '🎊' }, { note: 'E4', emoji: '🎈' }, { note: 'C4', emoji: '🎂' }, { note: 'C4', emoji: '🎂' },
        { note: 'D4', emoji: '🎉' }, { note: 'C4', emoji: '🎂' }, { note: 'G4', emoji: '🎁' }, { note: 'F4', emoji: '🎊' }
      ],
      'Canon in D (Pachelbel)': [
        { note: 'D4', emoji: '🎼' }, { note: 'A4', emoji: '🎵' }, { note: 'B4', emoji: '🎶' }, { note: 'FS4', emoji: '🎼' },
        { note: 'G4', emoji: '🎵' }, { note: 'D4', emoji: '🎶' }, { note: 'G4', emoji: '🎼' }, { note: 'A4', emoji: '🎵' }
      ],
      'Chopsticks': [
        { note: 'C4', emoji: '🥢' }, { note: 'D4', emoji: '🥢' }, { note: 'E4', emoji: '🥢' }, { note: 'F4', emoji: '🥢' },
        { note: 'G4', emoji: '🥢' }, { note: 'F4', emoji: '🥢' }, { note: 'E4', emoji: '🥢' }, { note: 'D4', emoji: '🥢' }
      ]
    };

    const presetNames = Object.keys(presets);
    const selectedPreset = presetNames[Math.floor(Math.random() * presetNames.length)];
    const presetMelody = presets[selectedPreset];

    session.melody = presetMelody.map((note, index) => ({
      note: note.note,
      time: index * 500, // 500ms spacing between notes
      emoji: note.emoji,
      frequency: this.getNoteInfo(note.note).frequency
    }));

    const presetEmbed = new MessageEmbed()
      .setTitle('🎵 Classical Preset Loaded')
      .setDescription(`**${selectedPreset}** has been loaded!`)
      .setColor('#9D4EDD')
      .addFields(
        { name: '🎶 Melody Preview', value: presetMelody.map(n => n.emoji).join(' '), inline: false },
        { name: '📊 Notes', value: `${presetMelody.length} notes`, inline: true },
        { name: '🎹 Instructions', value: 'Click ▶️ Playback to hear it!', inline: true },
        { name: '🔊 Voice Required', value: 'Join a voice channel first!', inline: true },
        {
          name: '🎼 Composer', value: selectedPreset.includes('Beethoven') ? 'Ludwig van Beethoven' :
            selectedPreset.includes('Pachelbel') ? 'Johann Pachelbel' : 'Traditional', inline: true
        },
        { name: '🎵 Style', value: 'Classical Piano', inline: true },
        { name: '⏱️ Duration', value: `~${Math.floor(presetMelody.length * 0.5)}s`, inline: true }
      )
      .setFooter('🎹 You can now play this preset or record over it!');

    await interaction.reply({ embeds: [presetEmbed], ephemeral: true });
  }

  getNoteInfo(note) {
    const noteData = {
      // 3rd Octave
      'C3': { name: 'C3', frequency: 130.81, color: '#FF6B6B', octave: 3, key: 'C' },
      'D3': { name: 'D3', frequency: 146.83, color: '#45B7D1', octave: 3, key: 'D' },
      'E3': { name: 'E3', frequency: 164.81, color: '#FFEAA7', octave: 3, key: 'E' },
      'F3': { name: 'F3', frequency: 174.61, color: '#DDA0DD', octave: 3, key: 'F' },
      'G3': { name: 'G3', frequency: 196.00, color: '#F7DC6F', octave: 3, key: 'G' },
      'A3': { name: 'A3', frequency: 220.00, color: '#85C1E9', octave: 3, key: 'A' },
      'B3': { name: 'B3', frequency: 246.94, color: '#82E0AA', octave: 3, key: 'B' },

      // 4th Octave (Middle C)
      'C4': { name: 'C4 (Middle C)', frequency: 261.63, color: '#FF6B6B', octave: 4, key: 'C' },
      'CS4': { name: 'C#4/Db4', frequency: 277.18, color: '#4ECDC4', octave: 4, key: 'C#' },
      'D4': { name: 'D4', frequency: 293.66, color: '#45B7D1', octave: 4, key: 'D' },
      'DS4': { name: 'D#4/Eb4', frequency: 311.13, color: '#96CEB4', octave: 4, key: 'D#' },
      'E4': { name: 'E4', frequency: 329.63, color: '#FFEAA7', octave: 4, key: 'E' },
      'F4': { name: 'F4', frequency: 349.23, color: '#DDA0DD', octave: 4, key: 'F' },
      'FS4': { name: 'F#4/Gb4', frequency: 369.99, color: '#98D8C8', octave: 4, key: 'F#' },
      'G4': { name: 'G4', frequency: 392.00, color: '#F7DC6F', octave: 4, key: 'G' },
      'GS4': { name: 'G#4/Ab4', frequency: 415.30, color: '#BB8FCE', octave: 4, key: 'G#' },
      'A4': { name: 'A4 (Concert Pitch)', frequency: 440.00, color: '#85C1E9', octave: 4, key: 'A' },
      'AS4': { name: 'A#4/Bb4', frequency: 466.16, color: '#F8C471', octave: 4, key: 'A#' },
      'B4': { name: 'B4', frequency: 493.88, color: '#82E0AA', octave: 4, key: 'B' },

      // 5th Octave
      'C5': { name: 'C5', frequency: 523.25, color: '#FF9FF3', octave: 5, key: 'C' },
      'CS5': { name: 'C#5/Db5', frequency: 554.37, color: '#4ECDC4', octave: 5, key: 'C#' },
      'D5': { name: 'D5', frequency: 587.33, color: '#54A0FF', octave: 5, key: 'D' },
      'DS5': { name: 'D#5/Eb5', frequency: 622.25, color: '#96CEB4', octave: 5, key: 'D#' },
      'E5': { name: 'E5', frequency: 659.25, color: '#5F27CD', octave: 5, key: 'E' },
      'F5': { name: 'F5', frequency: 698.46, color: '#DDA0DD', octave: 5, key: 'F' },

      // 6th Octave
      'C6': { name: 'C6', frequency: 1046.50, color: '#FF6B6B', octave: 6, key: 'C' },
      'D6': { name: 'D6', frequency: 1174.66, color: '#45B7D1', octave: 6, key: 'D' },
      'E6': { name: 'E6', frequency: 1318.51, color: '#FFEAA7', octave: 6, key: 'E' }
    };

    return noteData[note] || { name: 'Unknown', frequency: 0, color: '#FFFFFF', octave: 0, key: '?' };
  }

  getNoteEmoji(note) {
    const emojiMap = {
      // 3rd Octave
      'C3': '🎹', 'D3': '🎼', 'E3': '🎵', 'F3': '🎶', 'G3': '🎸', 'A3': '🎺', 'B3': '🎻',

      // 4th Octave
      'C4': '🎹', 'CS4': '🎼', 'D4': '🎵', 'DS4': '🎶', 'E4': '🎺',
      'F4': '🎻', 'FS4': '🎸', 'G4': '🥁', 'GS4': '🎤', 'A4': '🎧',
      'AS4': '🔊', 'B4': '📻',

      // 5th Octave
      'C5': '🎹', 'CS5': '🎼', 'D5': '🎵', 'DS5': '🎶', 'E5': '🎺', 'F5': '🎻',

      // 6th Octave
      'C6': '🎹', 'D6': '🎵', 'E6': '🎼'
    };
    return emojiMap[note] || '🎵';
  }

  getSoundEffect(note) {
    const soundEffects = {
      // 3rd Octave
      'C3': 'Do ♫', 'D3': 'Re ♫', 'E3': 'Mi ♫', 'F3': 'Fa ♫', 'G3': 'So ♫', 'A3': 'La ♫', 'B3': 'Ti ♫',

      // 4th Octave
      'C4': 'Do ♪', 'CS4': 'Do# ♪', 'D4': 'Re ♪', 'DS4': 'Re# ♪', 'E4': 'Mi ♪',
      'F4': 'Fa ♪', 'FS4': 'Fa# ♪', 'G4': 'So ♪', 'GS4': 'So# ♪', 'A4': 'La ♪',
      'AS4': 'La# ♪', 'B4': 'Ti ♪',

      // 5th Octave
      'C5': 'Do ♫', 'CS5': 'Do# ♫', 'D5': 'Re ♫', 'DS5': 'Re# ♫', 'E5': 'Mi ♫', 'F5': 'Fa ♫',

      // 6th Octave
      'C6': 'Do ♪♪', 'D6': 'Re ♪♪', 'E6': 'Mi ♪♪'
    };
    return soundEffects[note] || '♪';
  }

  getLastNotes(melody) {
    if (melody.length === 0) return 'No notes recorded';

    const lastFive = melody.slice(-5);
    return lastFive.map(note => note.emoji).join(' ') + (melody.length > 5 ? ' ...' : '');
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  truncateUrl(url) {
    if (url.length > 50) {
      return url.substring(0, 47) + '...';
    }
    return url;
  }

  cleanup(session, message) {
    // Clean up voice connection
    if (session.connection) {
      session.connection.destroy();
    }

    // Stop any active players
    if (session.player) {
      session.player.stop();
    }

    // Disable all buttons
    const disabledComponents = message.components.map(row => {
      const newRow = new MessageActionRow();
      row.components.forEach(component => {
        if (component.type === 'BUTTON') {
          newRow.addComponents(
            new MessageButton()
              .setCustomId(component.customId)
              .setLabel(component.label)
              .setStyle(component.style)
              .setEmoji(component.emoji)
              .setDisabled(true)
          );
        }
      });
      return newRow;
    });

    const endEmbed = new MessageEmbed()
      .setTitle('🎹 Piano Session Ended')
      .setDescription('The piano session has timed out!')
      .setColor('#FF6B6B')
      .addFields(
        { name: '📊 Session Stats', value: `Notes played: ${session.melody.length}`, inline: true },
        { name: '⏱️ Duration', value: `${Math.floor((Date.now() - session.startTime) / 1000)}s`, inline: true },
        { name: '🎵 Thank you', value: 'Thanks for playing!', inline: true }
      )
      .setFooter('Start a new session anytime with /piano');

    message.edit({
      embeds: [endEmbed],
      components: disabledComponents
    }).catch(() => { });

    // Clean up temp files
    this.cleanupTempFiles();
  }

  static cleanupTempFiles() {
    const fs = require('fs');
    const path = require('path');

    if (fs.existsSync('./temp')) {
      fs.readdir('./temp', (err, files) => {
        if (err) return;

        files.forEach(file => {
          const filePath = path.join('./temp', file);
          try {
            const stats = fs.statSync(filePath);
            const now = Date.now();
            const fileAge = now - stats.mtime.getTime();

            // Delete files older than 10 minutes
            if (fileAge > 600000) {
              fs.unlinkSync(filePath);
              console.log(`Cleaned up old temp file: ${file}`);
            }
          } catch (error) {
            console.error(`Error cleaning up file ${file}:`, error);
          }
        });
      });
    }
  }
};