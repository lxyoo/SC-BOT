const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');
const { getLyrics } = require('genius-lyrics-api');
const db = require('quick.db');
const YouTubeAPI = require('../../utils/YoutubeAPI');

module.exports = class MusicCommand extends BaseCommand {
  constructor() {
    super('music', 'Music', ['m', 'play', 'p', 'queue', 'skip', 'stop', 'pause', 'resume', 'volume', 'lyrics', 'loop', 'shuffle', 'nowplaying', 'np', 'seek', 'jump', 'autoplay', 'status', 'playskip', 'ps', 'sc', 'soundcloud', 'spotify']);

    // Initialize YouTube API
    this.youtubeAPI = new YouTubeAPI(process.env.YOUTUBE_API_KEY);
  }

  async run(client, message, args) {
    const command = this.aliases.includes(message.content.split(' ')[0].toLowerCase().slice(1))
      ? message.content.split(' ')[0].toLowerCase().slice(1)
      : args[0]?.toLowerCase() || 'help';

    const commandArgs = command === 'music' ? args.slice(1) : args;

    // Handle different commands
    switch (command) {
      case 'play':
      case 'p':
        return this.handlePlay(client, message, commandArgs);

      case 'sc':
      case 'soundcloud':
        return this.handleSoundCloudPlay(client, message, commandArgs);

      case 'spotify':
        return this.handleSpotifyPlay(client, message, commandArgs);

      case 'skip':
      case 's':
        return this.handleSkip(client, message);

      case 'stop':
      case 'leave':
        return this.handleStop(client, message);

      case 'pause':
        return this.handlePause(client, message);

      case 'resume':
      case 'r':
        return this.handleResume(client, message);

      case 'volume':
      case 'vol':
        return this.handleVolume(client, message, commandArgs);

      case 'queue':
      case 'q':
        return this.handleQueue(client, message);

      case 'nowplaying':
      case 'np':
        return this.handleNowPlaying(client, message);

      case 'lyrics':
      case 'ly':
        return this.handleLyrics(client, message);

      case 'loop':
      case 'repeat':
        return this.handleLoop(client, message, commandArgs);

      case 'shuffle':
      case 'mix':
        return this.handleShuffle(client, message);

      case 'seek':
        return this.handleSeek(client, message, commandArgs);

      case 'jump':
        return this.handleJump(client, message, commandArgs);

      case 'autoplay':
      case 'ap':
        return this.handleAutoplay(client, message);

      case 'status':
        return this.handleStatus(client, message);

      case 'playskip':
      case 'ps':
        return this.handlePlaySkip(client, message, commandArgs);

      case 'help':
      case 'h':
        return this.handleHelp(client, message);

      default:
        // Check if it's a filter command
        const filters = ["mcompand", "gate", "haas", "pulsator", "surrounding", "clear", "8d", "bassboost", "echo", "karaoke", "nightcore", "vaporwave", "flanger", "subboost", "phaser", "tremolo", "vibrato", "reverse", "purebass", "treble"];
        if (filters.includes(command)) {
          return this.handleFilter(client, message, command);
        }

        // Default to play if args provided, otherwise show help
        return commandArgs.length > 0 ? this.handlePlay(client, message, args) : this.handleHelp(client, message);
    }
  }

  // Main play command with YouTube search and SoundCloud fallback
  async handlePlay(client, message, args) {
    if (!args.length) {
      return this.embedBuilder(message, "RED", "❌ Error", "Please provide a song name or URL!");
    }

    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const query = args.join(" ");

    // Check if it's already a URL
    if (query.includes('youtube.com') || query.includes('youtu.be')) {
      return this.playDirectUrl(client, message, query, "YouTube");
    } else if (query.includes('soundcloud.com')) {
      return this.playDirectUrl(client, message, query, "SoundCloud");
    } else if (query.includes('spotify.com')) {
      return this.playDirectUrl(client, message, query, "Spotify");
    } else {
      // Search and play with multiple fallbacks
      return this.searchAndPlayWithFallbacks(client, message, query);
    }
  }

  // Direct URL playing
  async playDirectUrl(client, message, url, platform) {
    const searchMsg = await this.embedBuilder(message, "#99aab5", `🔎 Loading ${platform}...`, "Please wait...");
    setTimeout(() => searchMsg.delete().catch(console.error), 5000);

    try {
      await client.distube.play(message.member.voice.channel, url, {
        textChannel: message.channel,
        member: message.member
      });
    } catch (error) {
      console.error(`${platform} play error:`, error);

      if (error.message.includes('Sign in to confirm') || error.message.includes('bot')) {
        const fallbackMsg = await this.embedBuilder(message, "ORANGE", "🔄 YouTube Blocked", "Trying SoundCloud instead...");
        setTimeout(() => fallbackMsg.delete().catch(console.error), 3000);
        return this.searchSoundCloud(client, message, url);
      }

      return this.embedBuilder(message, "RED", "❌ Error", `Failed to play ${platform} URL: ${error.message}`);
    }
  }

  // YouTube search with fallback options
  async searchAndPlayWithFallbacks(client, message, query) {
    try {
      const searchResults = await this.youtubeAPI.searchVideos(query, 5);

      if (searchResults.length === 0) {
        // Fallback to SoundCloud search
        return this.searchSoundCloud(client, message, query);
      }

      // Create search results embed
      // In your searchAndPlayWithFallbacks method, update the embed description:
      const embed = new MessageEmbed()
        .setTitle("🔍 YouTube Search Results")
        .setDescription(`**Choose a number (1-${searchResults.length}) or wait 30 seconds to cancel:**\n\n${searchResults.map((video, index) =>
          `**${index + 1}.** [${video.title}](${video.url})\n` +
          `*${video.channel} • ${video.duration} • ${video.views}*`
        ).join('\n\n')}\n\n*Type 'sc' to search SoundCloud instead*`)
        .setColor("YELLOW")
        .setFooter({ text: "Type a number to select or 'sc' for SoundCloud" });

      const searchMessage = await message.channel.send({ embeds: [embed] });

      // Wait for user response
      const filter = (response) => {
        if (response.author.id !== message.author.id) return false;

        const content = response.content.toLowerCase();
        if (content === 'sc' || content === 'soundcloud') return true;

        const num = parseInt(response.content);
        return num >= 1 && num <= searchResults.length;
      };

      const collector = message.channel.createMessageCollector({
        filter,
        time: 30000,
        max: 1
      });

      collector.on('collect', async (response) => {
        const content = response.content.toLowerCase();

        if (content === 'sc' || content === 'soundcloud') {
          await searchMessage.delete().catch(console.error);
          await response.delete().catch(console.error);
          return this.searchSoundCloud(client, message, query);
        }

        const choice = parseInt(response.content) - 1;
        const selectedVideo = searchResults[choice];

        try {
          await client.distube.play(message.member.voice.channel, selectedVideo.url, {
            textChannel: message.channel,
            member: message.member
          });

          await searchMessage.delete().catch(console.error);
          await response.delete().catch(console.error);
        } catch (error) {
          console.error('YouTube play error:', error);

          // If YouTube fails, try SoundCloud automatically
          if (error.message.includes('Sign in to confirm') || error.message.includes('bot')) {
            await searchMessage.delete().catch(console.error);
            await response.delete().catch(console.error);

            const fallbackMsg = await this.embedBuilder(message, "ORANGE", "🔄 YouTube Blocked", "Trying SoundCloud instead...");
            setTimeout(() => fallbackMsg.delete().catch(console.error), 3000);

            return this.searchSoundCloud(client, message, query);
          }

          return this.embedBuilder(message, "RED", "❌ Error", `Failed to play: ${error.message}`);
        }
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          this.embedBuilder(message, "RED", "❌ Cancelled", "Search cancelled due to no response.");
          searchMessage.delete().catch(console.error);
        }
      });

    } catch (error) {
      console.error('YouTube search error:', error);
      // Fallback to SoundCloud if YouTube API fails
      return this.searchSoundCloud(client, message, query);
    }
  }

  // SoundCloud direct play
  async handleSoundCloudPlay(client, message, args) {
    if (!args.length) {
      return this.embedBuilder(message, "RED", "❌ Error", "Please provide a song name!");
    }

    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const query = args.join(" ");
    return this.searchSoundCloud(client, message, query);
  }

  // SoundCloud search helper
  async searchSoundCloud(client, message, query) {
    const searchMsg = await this.embedBuilder(message, "#FF5500", "🔎 Searching SoundCloud...", query);
    setTimeout(() => searchMsg.delete().catch(console.error), 5000);

    try {
      await client.distube.play(message.member.voice.channel, `soundcloud:${query}`, {
        textChannel: message.channel,
        member: message.member
      });
    } catch (error) {
      console.error('SoundCloud play error:', error);
      return this.embedBuilder(message, "RED", "❌ Error", `SoundCloud search failed: ${error.message}\n\nTry providing a direct URL instead.`);
    }
  }

  // Spotify direct play
  async handleSpotifyPlay(client, message, args) {
    if (!args.length) {
      return this.embedBuilder(message, "RED", "❌ Error", "Please provide a song name or Spotify URL!");
    }

    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const query = args.join(" ");
    const searchMsg = await this.embedBuilder(message, "#1DB954", "🔎 Searching Spotify...", query);
    setTimeout(() => searchMsg.delete().catch(console.error), 5000);

    try {
      await client.distube.play(message.member.voice.channel, `spotify:${query}`, {
        textChannel: message.channel,
        member: message.member
      });
    } catch (error) {
      console.error('Spotify play error:', error);
      return this.embedBuilder(message, "RED", "❌ Error", `Spotify search failed: ${error.message}`);
    }
  }

  // Skip command
  async handleSkip(client, message) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    try {
      await client.distube.skip(message);
      const skipMsg = await this.embedBuilder(message, "GREEN", "✅ Skipped!", "Skipped the current song!");
      setTimeout(() => skipMsg.delete().catch(console.error), 5000);
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot skip the song!");
    }
  }

  // Stop command
  async handleStop(client, message) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    try {
      await client.distube.stop(message);
      const stopMsg = await this.embedBuilder(message, "RED", "🛑 Stopped!", "Stopped the music and left the channel!");
      setTimeout(() => stopMsg.delete().catch(console.error), 5000);
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot stop the music!");
    }
  }

  // Pause command
  async handlePause(client, message) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    try {
      await client.distube.pause(message);
      return this.embedBuilder(message, "#061244", "⏸️ Paused!", "Paused the current song!");
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot pause the song!");
    }
  }

  // Resume command
  async handleResume(client, message) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    try {
      await client.distube.resume(message);
      return this.embedBuilder(message, "#061244", "▶️ Resumed!", "Resumed the current song!");
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot resume the song!");
    }
  }

  // Volume command
  async handleVolume(client, message, args) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    const volume = parseInt(args[0]);
    if (isNaN(volume) || volume < 0 || volume > 100) {
      return this.embedBuilder(message, "RED", "❌ Error", "Please provide a valid volume (0-100)!");
    }

    try {
      await client.distube.setVolume(message, volume);
      return this.embedBuilder(message, "GREEN", "🔊 Volume Changed!", `Set volume to ${volume}%`);
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot change volume!");
    }
  }

  // Queue command
  async handleQueue(client, message) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    const embeds = this.createQueueEmbeds(queue.songs);
    if (embeds.length === 0) {
      return this.embedBuilder(message, "RED", "❌ Error", "Queue is empty!");
    }

    let currentPage = 0;
    const queueEmbed = await message.channel.send({
      content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
      embeds: [embeds[currentPage]]
    });

    if (embeds.length > 1) {
      await queueEmbed.react("⬅️");
      await queueEmbed.react("⏹");
      await queueEmbed.react("➡️");

      const filter = (reaction, user) => {
        return ["⬅️", "⏹", "➡️"].includes(reaction.emoji.name) && message.author.id === user.id;
      };

      const collector = queueEmbed.createReactionCollector({ filter, time: 60000 });

      collector.on("collect", async (reaction, user) => {
        try {
          if (reaction.emoji.name === "➡️") {
            if (currentPage < embeds.length - 1) {
              currentPage++;
              await queueEmbed.edit({
                content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
                embeds: [embeds[currentPage]]
              });
            }
          } else if (reaction.emoji.name === "⬅️") {
            if (currentPage !== 0) {
              currentPage--;
              await queueEmbed.edit({
                content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
                embeds: [embeds[currentPage]]
              });
            }
          } else {
            collector.stop();
            await queueEmbed.reactions.removeAll();
          }
          await reaction.users.remove(message.author.id);
        } catch (error) {
          console.error(error);
        }
      });

      collector.on("end", () => {
        queueEmbed.reactions.removeAll().catch(console.error);
      });
    }
  }

  // Now playing command
  async handleNowPlaying(client, message) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    const song = queue.songs[0];
    const embed = new MessageEmbed()
      .setTitle("🎵 Now Playing")
      .setDescription(`[${song.name}](${song.url})`)
      .addFields(
        { name: "⏱️ Duration", value: `\`${queue.formattedCurrentTime} / ${song.formattedDuration}\``, inline: true },
        { name: "👤 Requested by", value: `${song.user}`, inline: true },
        { name: "🔊 Volume", value: `\`${queue.volume}%\``, inline: true },
        { name: "♾️ Loop", value: `\`${queue.repeatMode ? queue.repeatMode === 2 ? "✅ Queue" : "✅ Song" : "❌"}\``, inline: true },
        { name: "↪️ Autoplay", value: `\`${queue.autoplay ? "✅" : "❌"}\``, inline: true },
        { name: "🎛️ Filter", value: `\`${queue.filter || "❌"}\``, inline: true }
      )
      .setThumbnail(song.thumbnail)
      .setColor("#061244")
      .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    return message.channel.send({ embeds: [embed] });
  }

  // Lyrics command
  async handleLyrics(client, message) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    const song = queue.songs[0];
    const searchMsg = await this.embedBuilder(message, "#99aab5", "🔎 Searching lyrics...", "Please wait...");

    try {
      const options = {
        apiKey: 'zjriw-pYm1g6_Eg3_aPc0_0Cx5IlxedyT3ya3yB4XqEbbnYZT8T5vG7dc9x75scD',
        title: song.name,
        artist: song.uploader?.name || 'Unknown Artist',
        optimizeQuery: true
      };

      const lyrics = await getLyrics(options);
      await searchMsg.delete().catch(console.error);

      if (!lyrics) {
        return this.embedBuilder(message, "RED", "❌ No lyrics found!", "Couldn't find lyrics for this song.");
      }

      const embeds = this.createLyricsEmbeds(lyrics, song);
      let currentPage = 0;

      const lyricsEmbed = await message.channel.send({
        content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
        embeds: [embeds[currentPage]]
      });

      if (embeds.length > 1) {
        await lyricsEmbed.react("⬅️");
        await lyricsEmbed.react("⏹");
        await lyricsEmbed.react("➡️");

        const filter = (reaction, user) => {
          return ["⬅️", "⏹", "➡️"].includes(reaction.emoji.name) && message.author.id === user.id;
        };

        const collector = lyricsEmbed.createReactionCollector({ filter, time: 60000 });

        collector.on("collect", async (reaction, user) => {
          try {
            if (reaction.emoji.name === "➡️") {
              if (currentPage < embeds.length - 1) {
                currentPage++;
                await lyricsEmbed.edit({
                  content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
                  embeds: [embeds[currentPage]]
                });
              }
            } else if (reaction.emoji.name === "⬅️") {
              if (currentPage !== 0) {
                currentPage--;
                await lyricsEmbed.edit({
                  content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
                  embeds: [embeds[currentPage]]
                });
              }
            } else {
              collector.stop();
              await lyricsEmbed.reactions.removeAll();
            }
            await reaction.users.remove(message.author.id);
          } catch (error) {
            console.error(error);
          }
        });

        collector.on("end", () => {
          lyricsEmbed.reactions.removeAll().catch(console.error);
        });
      }
    } catch (error) {
      console.error(error);
      await searchMsg.delete().catch(console.error);
      return this.embedBuilder(message, "RED", "❌ Error", "Failed to fetch lyrics!");
    }
  }

  // Loop command
  async handleLoop(client, message, args) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    const mode = parseInt(args[0]);
    if (isNaN(mode) || mode < 0 || mode > 2) {
      return this.embedBuilder(message, "RED", "❌ Error", "Please use a number between 0 and 2!\n(0: Off, 1: Song, 2: Queue)");
    }

    try {
      await client.distube.setRepeatMode(message, mode);
      const modeText = mode === 0 ? "Off" : mode === 1 ? "Song" : "Queue";
      return this.embedBuilder(message, "GREEN", "🔄 Loop Mode Changed!", `Set loop mode to: ${modeText}`);
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot change loop mode!");
    }
  }

  // Shuffle command
  async handleShuffle(client, message) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    try {
      await client.distube.shuffle(message);
      return this.embedBuilder(message, "#061244", "🔀 Shuffled!", "Queue has been shuffled!");
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot shuffle the queue!");
    }
  }

  // Seek command
  async handleSeek(client, message, args) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    const time = parseInt(args[0]);
    if (isNaN(time) || time < 0) {
      return this.embedBuilder(message, "RED", "❌ Error", "Please provide a valid time in seconds!");
    }

    try {
      await client.distube.seek(message, time * 1000);
      return this.embedBuilder(message, "GREEN", "⏩ Seeked!", `Seeked to ${time} seconds`);
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot seek the song!");
    }
  }

  // Jump command
  async handleJump(client, message, args) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    const position = parseInt(args[0]);
    if (isNaN(position) || position < 1 || position > queue.songs.length) {
      return this.embedBuilder(message, "RED", "❌ Error", `Please provide a valid position (1-${queue.songs.length})!`);
    }

    try {
      await client.distube.jump(message, position - 1);
      return this.embedBuilder(message, "GREEN", "⏭️ Jumped!", `Jumped to position ${position}`);
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot jump to that position!");
    }
  }

  // Autoplay command
  async handleAutoplay(client, message) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    try {
      const autoplay = client.distube.toggleAutoplay(message);
      return this.embedBuilder(message, "#061244", "🔄 Autoplay", `Autoplay is now ${autoplay ? "ON" : "OFF"}!`);
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot toggle autoplay!");
    }
  }

  // Status command
  async handleStatus(client, message) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    const embed = new MessageEmbed()
      .setTitle("📊 Current Status")
      .setColor("#061244")
      .addFields(
        { name: "🔊 Volume", value: `${queue.volume}%`, inline: true },
        { name: "🎛️ Filter", value: queue.filter || "None", inline: true },
        { name: "♾️ Loop", value: queue.repeatMode ? queue.repeatMode === 2 ? "Queue" : "Song" : "Off", inline: true },
        { name: "↪️ Autoplay", value: queue.autoplay ? "On" : "Off", inline: true },
        { name: "🎧 Queue Length", value: `${queue.songs.length} songs`, inline: true },
        { name: "⏱️ Total Duration", value: queue.formattedDuration, inline: true }
      )
      .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    return message.channel.send({ embeds: [embed] });
  }

  // Play and skip command
  async handlePlaySkip(client, message, args) {
    if (!args.length) {
      return this.embedBuilder(message, "RED", "❌ Error", "Please provide a song name or URL!");
    }

    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const searchMsg = await this.embedBuilder(message, "GREEN", "🔎 + 👉 Searching and skipping...", args.join(" "));
    setTimeout(() => searchMsg.delete().catch(console.error), 5000);

    try {
      await client.distube.play(message.member.voice.channel, args.join(" "), {
        textChannel: message.channel,
        member: message.member,
        skip: true
      });
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Failed to play and skip!");
    }
  }

  // Filter command
  async handleFilter(client, message, filter) {
    if (!message.member.voice.channel) {
      return this.embedBuilder(message, "RED", "❌ Error", "You need to be in a voice channel!");
    }

    const queue = client.distube.getQueue(message.guild);
    if (!queue) {
      return this.embedBuilder(message, "RED", "❌ Error", "There is nothing playing!");
    }

    try {
      if (filter === "clear") {
        await client.distube.setFilter(message, false);
        return this.embedBuilder(message, "#061244", "🎛️ Filter Cleared!", "Removed all audio filters");
      } else {
        await client.distube.setFilter(message, filter);
        return this.embedBuilder(message, "#061244", "🎛️ Filter Applied!", `Applied filter: ${filter}`);
      }
    } catch (error) {
      return this.embedBuilder(message, "RED", "❌ Error", "Cannot apply filter!");
    }
  }

  // Help command
  async handleHelp(client, message) {
    const embed = new MessageEmbed()
      .setTitle("🎵 Music Commands")
      .setColor("#061244")
      .setDescription("Here are all the available music commands:")
      .addFields(
        {
          name: "**🎶 Playback Commands**",
          value: "`play <song>` - Search YouTube (with SoundCloud fallback)\n`sc <song>` - Search SoundCloud directly\n`spotify <song>` - Search Spotify\n`skip` - Skip current song\n`stop` - Stop music and leave\n`pause` - Pause current song\n`resume` - Resume paused song\n`playskip <song>` - Play and skip current",
          inline: false
        },
        {
          name: "**🎛️ Control Commands**",
          value: "`volume <0-100>` - Set volume\n`loop <0-2>` - Set loop mode\n`shuffle` - Shuffle queue\n`seek <seconds>` - Seek to time\n`jump <position>` - Jump to queue position\n`autoplay` - Toggle autoplay",
          inline: false
        },
        {
          name: "**📝 Info Commands**",
          value: "`queue` - Show current queue\n`nowplaying` - Show current song\n`lyrics` - Show song lyrics\n`status` - Show player status",
          inline: false
        },
        {
          name: "**🎚️ Audio Filters**",
          value: "`bassboost` `nightcore` `vaporwave` `8d` `tremolo` `vibrato` `reverse` `karaoke` `clear` and more!",
          inline: false
        },
        {
          name: "**💡 Pro Tips**",
          value: "• Use `!sc song name` if YouTube is blocked\n• Provide direct URLs for best results\n• SoundCloud usually works more reliably\n• When searching YouTube, type 'sc' to switch to SoundCloud",
          inline: false
        }
      )
      .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    return message.channel.send({ embeds: [embed] });
  }

  // Helper functions
  embedBuilder(message, color, title, description, thumbnail) {
    const embed = new MessageEmbed()
      .setColor(color)
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: message.client.user.username, iconURL: message.client.user.displayAvatarURL() });

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (thumbnail) embed.setThumbnail(thumbnail);

    return message.channel.send({ embeds: [embed] });
  }

  createCurrentEmbed(queue) {
    const song = queue.songs[0];
    return new MessageEmbed()
      .setTitle("🎵 Now Playing")
      .setDescription(`[${song.name}](${song.url})`)
      .addFields(
        { name: "⏱️ Duration", value: `\`${queue.formattedCurrentTime} / ${song.formattedDuration}\``, inline: true },
        { name: "🎧 Queue", value: `\`${queue.songs.length} song(s) - ${queue.formattedDuration}\``, inline: true },
        { name: "🔊 Volume", value: `\`${queue.volume}%\``, inline: true },
        { name: "♾️ Loop", value: `\`${queue.repeatMode ? queue.repeatMode === 2 ? "✅ Queue" : "✅ Song" : "❌"}\``, inline: true },
        { name: "↪️ Autoplay", value: `\`${queue.autoplay ? "✅" : "❌"}\``, inline: true },
        { name: "🎛️ Filter", value: `\`${queue.filter || "❌"}\``, inline: true }
      )
      .setThumbnail(song.thumbnail)
      .setColor("GREEN")
      .setFooter({ text: `Requested by ${song.user.tag}`, iconURL: song.user.displayAvatarURL({ dynamic: true }) });
  }

  createQueueEmbeds(songs) {
    const embeds = [];
    let k = 10;

    for (let i = 0; i < songs.length; i += 10) {
      const current = songs.slice(i, k);
      let j = i;
      k += 10;

      const info = current.map((track) => `**${++j}** - [${track.name}](${track.url}) - \`${track.formattedDuration}\``).join("\n");

      const embed = new MessageEmbed()
        .setTitle("📝 Server Queue")
        .setColor("YELLOW")
        .setDescription(`**Now Playing:** [${songs[0].name}](${songs[0].url})\n\n${info}`)
        .setFooter({ text: `Page ${Math.floor(i / 10) + 1}` });

      embeds.push(embed);
    }

    return embeds;
  }

  createLyricsEmbeds(lyrics, song) {
    const embeds = [];
    let k = 1000;

    for (let i = 0; i < lyrics.length; i += 1000) {
      const current = lyrics.slice(i, k);
      k += 1000;

      const embed = new MessageEmbed()
        .setTitle(`🎶 Lyrics - ${song.name}`)
        .setURL(song.url)
        .setThumbnail(song.thumbnail)
        .setColor("PURPLE")
        .setDescription(current);

      embeds.push(embed);
    }

    return embeds;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
};
