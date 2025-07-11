const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const currency = require('../../utils/currency');

module.exports = class RapBattleCommand extends BaseCommand {
  constructor() {
    super('rapbattle', 'WTF', ['rap', 'battle', 'diss']);
  }

  async run(client, message, args) {
    const target = message.mentions.users.first();
    
    if (!target) {
      return this.generateRandomRap(message);
    }

    if (target.id === message.author.id) {
      return message.channel.send({
        embeds: [
          new MessageEmbed()
            .setTitle('Rap Battle Error')
            .setDescription('You cannot battle yourself! Find an opponent!')
            .setColor('#FF6B6B')
        ]
      });
    }

    // Challenge the target user
    const embed = new MessageEmbed()
      .setTitle('Rap Battle Challenge')
      .setDescription(`**${message.author.username}** has challenged **${target.username}** to a rap battle!`)
      .setColor('#FF6B35')
      .addFields(
        { name: 'Prize', value: '500 Yen to the winner', inline: true },
        { name: 'Format', value: 'Best of 3 rounds', inline: true },
        { name: 'Time Limit', value: '30 seconds per verse', inline: true }
      )
      .setFooter('Accept the challenge to begin!');

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('accept-battle')
          .setLabel('Accept Challenge')
          .setStyle('SUCCESS'),
        new MessageButton()
          .setCustomId('decline-battle')
          .setLabel('Decline')
          .setStyle('DANGER')
      );

    const challengeMessage = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = challengeMessage.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === target.id,
      time: 30000
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'accept-battle') {
        await this.startRapBattle(message, message.author, target);
      } else {
        await interaction.update({
          embeds: [
            new MessageEmbed()
              .setTitle('Challenge Declined')
              .setDescription(`${target.username} declined the rap battle!`)
              .setColor('#FF6B6B')
          ],
          components: []
        });
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        challengeMessage.edit({
          embeds: [
            new MessageEmbed()
              .setTitle('Challenge Expired')
              .setDescription(`${target.username} didn't respond in time!`)
              .setColor('#FF6B6B')
          ],
          components: []
        });
      }
    });
  }

  async generateRandomRap(message) {
    const rapLines = [
      `Yo, ${message.author.username} stepped up to the mic tonight`,
      `They think they got bars, but their flow ain't right`,
      `Discord legend in the making, that's what they claim`,
      `But when it comes to real rap, they ain't got game`,
      `Sitting at their keyboard, typing all day`,
      `Thinking they're a rapper, but they just press play`,
      `Their rhymes are basic, flow's out of sync`,
      `Better stick to memes, that's their missing link`,
      `But respect where it's due, they got the courage to try`,
      `Maybe next time their bars will reach the sky`,
      `Keep practicing hard, don't give up the fight`,
      `One day you'll be spitting fire, burning bright`
    ];

    const embed = new MessageEmbed()
      .setTitle('AI Rap Generator')
      .setDescription('Since no opponent was mentioned, here\'s a custom rap about you!')
      .setColor('#9D4EDD')
      .addFields(
        { name: 'Your Rap', value: rapLines.slice(0, 8).join('\n'), inline: false },
        { name: 'Bars Rating', value: `${Math.floor(Math.random() * 5) + 6}/10`, inline: true },
        { name: 'Flow Check', value: 'Needs work but has potential', inline: true }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter('Challenge someone with !rapbattle @user');

    await message.channel.send({ embeds: [embed] });
  }

  async startRapBattle(message, challenger, opponent) {
    const battleEmbed = new MessageEmbed()
      .setTitle('Rap Battle Started!')
      .setDescription(`**${challenger.username}** vs **${opponent.username}**`)
      .setColor('#9D4EDD')
      .addFields(
        { name: 'Round 1', value: `${challenger.username} goes first! Drop your bars!`, inline: false },
        { name: 'Rules', value: 'Each rapper gets 30 seconds to respond\nCommunity will vote on the winner', inline: false }
      )
      .setFooter('Battle begins now!');

    await message.channel.send({ embeds: [battleEmbed] });

    const verses = [];
    let currentRapper = challenger;
    let round = 1;

    const verseCollector = message.channel.createMessageCollector({
      time: 180000, // 3 minutes total
      filter: (msg) => (msg.author.id === challenger.id || msg.author.id === opponent.id) && msg.content.length > 10
    });

    verseCollector.on('collect', (msg) => {
      if (msg.author.id === currentRapper.id) {
        verses.push({
          rapper: msg.author,
          verse: msg.content,
          round: round
        });

        // Switch to next rapper
        currentRapper = currentRapper.id === challenger.id ? opponent : challenger;
        
        if (verses.length < 6) { // 3 rounds each
          if (verses.length % 2 === 0) {
            round++;
            message.channel.send(`**Round ${round}** - ${currentRapper.username}'s turn!`);
          } else {
            message.channel.send(`${currentRapper.username}'s response!`);
          }
        } else {
          verseCollector.stop();
        }
      }
    });

    verseCollector.on('end', async () => {
      if (verses.length < 2) {
        return message.channel.send({
          embeds: [
            new MessageEmbed()
              .setTitle('Battle Incomplete')
              .setDescription('Not enough verses were submitted!')
              .setColor('#FF6B6B')
          ]
        });
      }

      await this.judgeRapBattle(message, challenger, opponent, verses);
    });
  }

  async judgeRapBattle(message, challenger, opponent, verses) {
    const challengerVerses = verses.filter(v => v.rapper.id === challenger.id);
    const opponentVerses = verses.filter(v => v.rapper.id === opponent.id);

    // Simple scoring based on length and creativity
    const challengerScore = this.calculateRapScore(challengerVerses);
    const opponentScore = this.calculateRapScore(opponentVerses);

    const winner = challengerScore > opponentScore ? challenger : opponent;
    const loser = winner.id === challenger.id ? opponent : challenger;

    await currency.addBalance(winner.id, 500);

    const resultEmbed = new MessageEmbed()
      .setTitle('Rap Battle Results')
      .setColor('#00FF00')
      .addFields(
        { name: 'Winner', value: `${winner.username}`, inline: true },
        { name: 'Prize', value: '500 Yen', inline: true },
        { name: 'Score', value: `${winner.username}: ${Math.max(challengerScore, opponentScore)}\n${loser.username}: ${Math.min(challengerScore, opponentScore)}`, inline: true }
      )
      .setThumbnail(winner.displayAvatarURL({ dynamic: true }))
      .setFooter('Great battle everyone!');

    // Show best verses
    if (challengerVerses.length > 0) {
      resultEmbed.addFields(
        { name: `${challenger.username}'s Best Verse`, value: challengerVerses[0].verse.slice(0, 200) + (challengerVerses[0].verse.length > 200 ? '...' : ''), inline: false }
      );
    }

    if (opponentVerses.length > 0) {
      resultEmbed.addFields(
        { name: `${opponent.username}'s Best Verse`, value: opponentVerses[0].verse.slice(0, 200) + (opponentVerses[0].verse.length > 200 ? '...' : ''), inline: false }
      );
    }

    await message.channel.send({ embeds: [resultEmbed] });
  }

  calculateRapScore(verses) {
    let score = 0;
    
    verses.forEach(verse => {
      // Points for length
      score += Math.min(verse.verse.length / 20, 10);
      
      // Points for rhyme attempts (simple check)
      const lines = verse.verse.split('\n');
      if (lines.length > 1) {
        score += lines.length * 2;
      }
      
      // Points for creativity keywords
      const creativeWords = ['fire', 'bars', 'flow', 'mic', 'beat', 'rhyme', 'spit', 'drop'];
      creativeWords.forEach(word => {
        if (verse.verse.toLowerCase().includes(word)) {
          score += 3;
        }
      });
    });

    return Math.floor(score);
  }
};