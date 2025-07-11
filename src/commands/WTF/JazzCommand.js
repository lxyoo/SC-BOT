const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus 
} = require('@discordjs/voice');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = class JazzPlayerCommand extends BaseCommand {
  constructor() {
    super('jazz', 'WTF', ['saxophone', 'smooth', 'lounge', 'reckless']);
  }

  async run(client, message, args) {
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
      return message.reply('❌ You need to be in a voice channel to experience the smooth jazz!');
    }

    // Check if music file exists
// Add this debug code right after the musicPath line:
const musicPath = path.join(__dirname, 'whisper.mp3');

    const embed = new MessageEmbed()
      .setTitle('🎷 Reckless Yelling - Smooth Jazz Experience')
      .setDescription('*Definitely not that other famous saxophone song...*\n\nGet ready for some totally original smooth jazz vibes!')
      .setColor('#8B4513')
      .addFields(
        { name: '🎵 Track', value: 'Reckless Yelling (100% Original)', inline: true },
        { name: '⏱️ Duration', value: '~6:30', inline: true },
        { name: '🎯 Genre', value: 'Smooth Jazz (Totally Not 80s)', inline: true },
        { name: '🎸 Features', value: 'Legendary saxophone solo, romantic lyrics, smooth vibes', inline: false },
        { name: '🌙 Mood', value: 'Romantic, passionate, and definitely reckless', inline: false },
        { name: '😉 Disclaimer', value: 'Any resemblance to other songs is purely coincidental', inline: false }
      )
      .setThumbnail('https://cdn.discordapp.com/attachments/jazz-sax-wink.png')
      .setFooter('🎷 Prepare for some serious smooth jazz (wink wink)')
      .setTimestamp();

    const controls = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('jazz_play')
          .setLabel('▶️ Play')
          .setStyle('SUCCESS')
          .setEmoji('🎷'),
        new MessageButton()
          .setCustomId('jazz_pause')
          .setLabel('⏸️ Pause')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('jazz_stop')
          .setLabel('⏹️ Stop')
          .setStyle('DANGER'),
        new MessageButton()
          .setCustomId('jazz_lyrics')
          .setLabel('📝 Lyrics')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('jazz_visualizer')
          .setLabel('🌈 Visualizer')
          .setStyle('SECONDARY')
      );

    const jazzMessage = await message.channel.send({ embeds: [embed], components: [controls] });

    const jazzSession = {
      user: message.author.id,
      voiceChannel: voiceChannel,
      connection: null,
      player: null,
      isPlaying: false,
      startTime: null,
      musicPath: musicPath,
      currentLyricIndex: 0,
      lyricsMessage: null
    };

    const collector = jazzMessage.createMessageComponentCollector({
      time: 420000 // 7 minutes
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'This is not your jazz session!', ephemeral: true });
      }

      const action = interaction.customId.split('_')[1];
      await this.handleJazzControl(interaction, action, jazzSession, jazzMessage);
    });

    collector.on('end', () => {
      if (jazzSession.connection) {
        jazzSession.connection.destroy();
      }
      this.endJazzSession(jazzMessage);
    });
  }

  async handleJazzControl(interaction, action, session, jazzMessage) {
    switch (action) {
      case 'play':
        await this.playRecklessYelling(interaction, session);
        break;
      case 'pause':
        await this.pauseJazz(interaction, session);
        break;
      case 'stop':
        await this.stopJazz(interaction, session);
        break;
      case 'lyrics':
        await this.showLyrics(interaction, session);
        break;
      case 'visualizer':
        await this.toggleVisualizer(interaction, session);
        break;
    }
  }

  async playRecklessYelling(interaction, session) {
    try {
      // Join voice channel
      const connection = joinVoiceChannel({
        channelId: session.voiceChannel.id,
        guildId: session.voiceChannel.guild.id,
        adapterCreator: session.voiceChannel.guild.voiceAdapterCreator,
      });

      session.connection = connection;
      session.isPlaying = true;
      session.startTime = Date.now();

      // Create audio resource from MP3 file
      const resource = createAudioResource(session.musicPath);
      const player = createAudioPlayer();

      session.player = player;
      connection.subscribe(player);
      player.play(resource);

      const playingEmbed = new MessageEmbed()
        .setTitle('🎷 Now Playing: Reckless Yelling')
        .setDescription('*That totally original smooth jazz is now flowing...*')
        .setColor('#FFD700')
        .addFields(
          { name: '🎵 Status', value: 'Playing from MP3', inline: true },
          { name: '⏱️ Time', value: '0:00 / ~6:30', inline: true },
          { name: '🔊 Source', value: 'Local Music File', inline: true },
          { name: '🎸 Current Vibe', value: 'Sultry saxophone intro beginning...', inline: false },
          { name: '🌙 Atmosphere', value: 'Romantic late-night jazz club (totally not the 80s)', inline: false },
          { name: '😏 Fun Fact', value: 'This song is 100% original and not inspired by anything else!', inline: false }
        )
        .setThumbnail('https://cdn.discordapp.com/attachments/saxophone-playing-wink.gif')
        .setFooter('🎷 Reckless Yelling experience in progress... (nudge nudge)');

      await interaction.update({ embeds: [playingEmbed] });

      // Start lyrics display
      this.startLyricsDisplay(interaction, session);

      // Handle player events
      player.on(AudioPlayerStatus.Idle, () => {
        this.onTrackComplete(interaction, session);
      });

      player.on('error', (error) => {
        console.error('Jazz player error:', error);
        interaction.editReply({ content: '❌ Error playing Reckless Yelling! Check if the MP3 file exists.' }).catch(() => {});
      });

    } catch (error) {
      console.error('Jazz connection error:', error);
      await interaction.reply({ content: '❌ Failed to connect to voice channel!', ephemeral: true });
    }
  }

  async startLyricsDisplay(interaction, session) {
    // Parody/original lyrics that don't reproduce copyrighted content
    const lyricsTimeline = [
      { time: 0, text: "🎷 *Smooth saxophone intro plays*" },
      { time: 15000, text: "I feel so reckless tonight..." },
      { time: 30000, text: "Dancing with danger in the moonlight..." },
      { time: 45000, text: "These whispers in the dark..." },
      { time: 60000, text: "Speaking to my restless heart..." },
      { time: 90000, text: "🎵 *Legendary saxophone solo begins*" },
      { time: 120000, text: "Never knew love could feel so wild..." },
      { time: 150000, text: "Lost in rhythm, lost in style..." },
      { time: 180000, text: "🎶 *Saxophone intensifies*" },
      { time: 210000, text: "Reckless yelling in the night..." },
      { time: 240000, text: "Everything's gonna be alright..." },
      { time: 270000, text: "When the music takes control..." },
      { time: 300000, text: "Jazz flows through my very soul..." },
      { time: 330000, text: "🌙 *Gentle outro begins*" },
      { time: 360000, text: "Reckless... but so right..." },
      { time: 390000, text: "🎷 *Final saxophone fade*" }
    ];

    const lyricsInterval = setInterval(() => {
      if (!session.isPlaying) {
        clearInterval(lyricsInterval);
        return;
      }

      const elapsed = Date.now() - session.startTime;
      const currentLyric = this.getCurrentLyric(elapsed, lyricsTimeline);
      
      if (currentLyric) {
        this.updateLyricsDisplay(interaction, session, currentLyric, lyricsTimeline, elapsed);
      }
    }, 2000); // Update every 2 seconds
  }

  getCurrentLyric(elapsed, timeline) {
    for (let i = timeline.length - 1; i >= 0; i--) {
      if (elapsed >= timeline[i].time) {
        return { ...timeline[i], index: i };
      }
    }
    return timeline[0];
  }

  async updateLyricsDisplay(interaction, session, currentLyric, timeline, elapsed) {
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    // Create lyrics display with gradient highlighting
    let lyricsDisplay = '';
    timeline.forEach((lyric, index) => {
      if (index === currentLyric.index) {
        // Current lyric with purple gradient effect
        lyricsDisplay += `**🟣 ${lyric.text} 🟣**\n`;
      } else if (index < currentLyric.index) {
        // Previous lyrics (dimmed)
        lyricsDisplay += `~~${lyric.text}~~\n`;
      } else {
        // Future lyrics (light)
        lyricsDisplay += `*${lyric.text}*\n`;
      }
    });

    const lyricsEmbed = new MessageEmbed()
      .setTitle('🎷 Reckless Yelling - Live Lyrics')
      .setDescription(`**⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}**\n\n${lyricsDisplay}`)
      .setColor('#8A2BE2') // Purple color
      .addFields(
        { name: '🎵 Current Vibe', value: this.getCurrentVibe(elapsed), inline: true },
        { name: '🌟 Mood', value: 'Romantically Reckless', inline: true },
        { name: '😉 Originality', value: '100% Not Copyrighted', inline: true }
      )
      .setFooter('🎷 Scrolling through totally original lyrics...')
      .setTimestamp();

    interaction.editReply({ embeds: [lyricsEmbed] }).catch(() => {});
  }

  getCurrentVibe(elapsed) {
    if (elapsed < 45000) return 'Sultry Intro';
    if (elapsed < 90000) return 'Smooth Verses';
    if (elapsed < 180000) return 'Legendary Sax Solo';
    if (elapsed < 270000) return 'Passionate Bridge';
    if (elapsed < 330000) return 'Emotional Climax';
    return 'Gentle Outro';
  }

  async showLyrics(interaction, session) {
    const lyricsEmbed = new MessageEmbed()
      .setTitle('📝 Reckless Yelling - Complete Lyrics')
      .setDescription('*Our totally original smooth jazz composition*')
      .setColor('#8A2BE2')
      .addFields(
        { 
          name: '🎷 Opening', 
          value: '*Smooth saxophone intro*\n*I feel so reckless tonight...*\n*Dancing with danger in the moonlight...*', 
          inline: false 
        },
        { 
          name: '🎵 Verse', 
          value: '*These whispers in the dark...*\n*Speaking to my restless heart...*\n*Never knew love could feel so wild...*', 
          inline: false 
        },
        { 
          name: '🎶 Saxophone Solo', 
          value: '*[Legendary saxophone solo that definitely wasn\'t inspired by anything else]*', 
          inline: false 
        },
        { 
          name: '🌙 Bridge', 
          value: '*Reckless yelling in the night...*\n*Everything\'s gonna be alright...*\n*When the music takes control...*', 
          inline: false 
        },
        { 
          name: '🎷 Outro', 
          value: '*Jazz flows through my very soul...*\n*Reckless... but so right...*\n*[Final saxophone fade]*', 
          inline: false 
        }
      )
      .setFooter('🎷 100% Original Composition (wink wink)')
      .setTimestamp();

    await interaction.reply({ embeds: [lyricsEmbed], ephemeral: true });
  }

  async toggleVisualizer(interaction, session) {
    const visualizerImage = await this.generateRecklessVisualizer();
    
    const visualizerEmbed = new MessageEmbed()
      .setTitle('🌈 Reckless Yelling Visualizer')
      .setDescription('Audio waves dancing to our totally original saxophone')
      .setColor('#8A2BE2')
      .setImage('attachment://reckless_visualizer.png')
      .addFields(
        { name: '🎵 Frequency', value: 'Smooth Jazz Waves', inline: true },
        { name: '🌊 Pattern', value: 'Sultry Saxophone Vibes', inline: true },
        { name: '🎨 Theme', value: 'Purple Jazz Gradient', inline: true },
        { name: '😏 Originality', value: 'Completely original visualization', inline: false }
      )
      .setFooter('Visual representation of our definitely not copyrighted jazz');

    await interaction.reply({ 
      embeds: [visualizerEmbed], 
      files: [{ attachment: visualizerImage, name: 'reckless_visualizer.png' }],
      ephemeral: true 
    });
  }

  async generateRecklessVisualizer() {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Create purple-blue gradient background
    const gradient = ctx.createLinearGradient(0, 0, 800, 400);
    gradient.addColorStop(0, '#1a0033');
    gradient.addColorStop(0.3, '#4a0e4e');
    gradient.addColorStop(0.6, '#6a1b9a');
    gradient.addColorStop(0.8, '#8e24aa');
    gradient.addColorStop(1, '#9c27b0');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);

    // Draw audio wave visualization with purple theme
    const time = Date.now() * 0.001;
    
    // Main saxophone wave
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const hue = 260 + i * 10; // Purple to blue spectrum
      const saturation = 80 + i * 2;
      const lightness = 50 + i * 6;
      ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.lineWidth = 5 - i * 0.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = ctx.strokeStyle;
      
      for (let x = 0; x < 800; x++) {
        const frequency = 0.006 + i * 0.002;
        const amplitude = 70 + i * 12;
        const offset = 200 + Math.sin(time * 0.5 + i) * 30;
        
        const y = offset + Math.sin(x * frequency + time * 1.5 + i) * amplitude;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Add floating jazz elements with purple tint
    ctx.fillStyle = '#e1bee7';
    ctx.font = '28px Arial';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#9c27b0';
    
    const jazzElements = ['🎷', '🎵', '🎶', '💜', '✨', '🌙', '🎼', '🎹'];
    for (let i = 0; i < 25; i++) {
      const x = (time * 20 + i * 50) % 850;
      const y = 100 + Math.sin(time + i) * 150;
      const element = jazzElements[Math.floor(Math.random() * jazzElements.length)];
      const alpha = 0.3 + Math.sin(time + i) * 0.3;
      
      ctx.globalAlpha = alpha;
      ctx.fillText(element, x, y);
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Add romantic atmosphere particles
    ctx.fillStyle = 'rgba(156, 39, 176, 0.4)';
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 400;
      const size = Math.random() * 40 + 15;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add title with gradient text effect
    const titleGradient = ctx.createLinearGradient(0, 0, 800, 0);
    titleGradient.addColorStop(0, '#e1bee7');
    titleGradient.addColorStop(0.5, '#ce93d8');
    titleGradient.addColorStop(1, '#ba68c8');
    
    ctx.fillStyle = titleGradient;
    ctx.font = 'bold 32px Arial';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#9c27b0';
    ctx.fillText('🎷 Reckless Yelling Visualizer', 150, 60);
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#e1bee7';
    ctx.fillText('100% Original Audio Waves (wink wink)', 250, 380);
    
    // Add cheeky disclaimer
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ce93d8';
    ctx.fillText('Any resemblance to other songs is purely coincidental 😉', 220, 360);
    
    return canvas.toBuffer();
  }

  async pauseJazz(interaction, session) {
    if (session.player && session.isPlaying) {
      session.player.pause();
      session.isPlaying = false;
      
      const pausedEmbed = new MessageEmbed()
        .setTitle('⏸️ Reckless Yelling Paused')
        .setDescription('The totally original smooth jazz has been paused')
        .setColor('#FFA500')
        .addFields(
          { name: '🎵 Status', value: 'Paused', inline: true },
          { name: '⏱️ Time', value: this.formatTime(Date.now() - session.startTime), inline: true },
          { name: '🎷 Note', value: 'The saxophone is taking a breather...', inline: true },
          { name: '😏 Reminder', value: 'This song is definitely not copyrighted!', inline: false }
        )
        .setFooter('Click play to resume the reckless vibes');

      await interaction.update({ embeds: [pausedEmbed] });
    } else {
      await interaction.reply({ content: '❌ No Reckless Yelling track is currently playing!', ephemeral: true });
    }
  }

  async stopJazz(interaction, session) {
    if (session.player) {
      session.player.stop();
      session.isPlaying = false;
    }
    
    if (session.connection) {
      session.connection.destroy();
      session.connection = null;
    }

    const stoppedEmbed = new MessageEmbed()
      .setTitle('⏹️ Reckless Yelling Session Ended')
      .setDescription('Thank you for experiencing our totally original jazz composition')
      .setColor('#FF6B6B')
      .addFields(
        { name: '🎵 Status', value: 'Stopped', inline: true },
        { name: '🎷 Final Note', value: 'The saxophone rests... for now', inline: true },
        { name: '😉 Disclaimer', value: 'Hope you enjoyed our 100% original creation!', inline: false },
        { name: '💭 Reflection', value: 'Sometimes being reckless with your music taste pays off...', inline: false }
      )
      .setFooter('Thanks for listening to our definitely not copyrighted jazz');

    await interaction.update({ embeds: [stoppedEmbed] });
  }

  onTrackComplete(interaction, session) {
    const completedEmbed = new MessageEmbed()
      .setTitle('🎉 Reckless Yelling Experience Complete!')
      .setDescription('Our totally original smooth jazz masterpiece has concluded')
      .setColor('#32CD32')
      .addFields(
        { name: '🎵 Track', value: 'Reckless Yelling (100% Original)', inline: true },
        { name: '⏱️ Duration', value: 'Perfect Length', inline: true },
        { name: '🎷 Rating', value: '⭐⭐⭐⭐⭐', inline: true },
        { name: '🌟 Experience', value: 'Thank you for joining us in this smooth jazz journey. That saxophone solo was particularly legendary and definitely not inspired by any 80s classics!', inline: false },
        { name: '💫 Final Thought', value: '*"Being reckless with your music choices sometimes leads to the most beautiful discoveries..."*', inline: false },
        { name: '😏 Fun Fact', value: 'This song has never been heard before in human history!', inline: false }
      )
      .setThumbnail('https://cdn.discordapp.com/attachments/jazz-complete-original.png')
      .setFooter('🎷 Keep the totally original jazz alive in your heart');

    interaction.editReply({ embeds: [completedEmbed] }).catch(() => {});
    
    // Auto-disconnect after 5 seconds
    setTimeout(() => {
      if (session.connection) {
        session.connection.destroy();
      }
    }, 5000);
  }

  endJazzSession(jazzMessage) {
    const endedEmbed = new MessageEmbed()
      .setTitle('🎷 Reckless Yelling Session Timed Out')
      .setDescription('The totally original smooth jazz session has ended')
      .setColor('#FF6B6B')
      .addFields(
        { name: '🎵 Final Note', value: 'The saxophone may be silent, but the melody lives on...', inline: false },
        { name: '😉 Reminder', value: 'Remember: This was 100% original music!', inline: false }
      )
      .setFooter('Thanks for the reckless vibes! (nudge nudge)');

    jazzMessage.edit({ 
      embeds: [endedEmbed], 
      components: [] 
    }).catch(() => {});
  }

  formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};