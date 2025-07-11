const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = class Connect4Command extends BaseCommand {
  constructor() {
    super('connect4', 'Games', ['c4', 'connectfour']);
  }

  async run(client, message, args) {
    const opponent = message.mentions.users.first();

    if (!opponent) {
      const embed = new MessageEmbed()
        .setTitle('🔴 Connect 4')
        .setDescription('Mention someone to play against!')
        .setColor('#5865F2')
        .addFields([
          { name: 'Usage', value: '`!connect4 @user`', inline: true },
          { name: 'Goal', value: 'Connect 4 pieces in a row!', inline: true }
        ]);
      return message.reply({ embeds: [embed] });
    }

    if (opponent.id === message.author.id) {
      return message.reply('❌ You cannot play against yourself!');
    }

    if (opponent.bot) {
      return message.reply('❌ You cannot play against a bot!');
    }

    const game = new Connect4Game(message.author, opponent);
    await this.startGame(message, game);
  }

  async startGame(message, game) {
    const canvas = await this.createGameCanvas(game);
    const attachment = new MessageAttachment(canvas.toBuffer(), 'connect4.png');

    const embed = new MessageEmbed()
      .setTitle('🔴 Connect 4 Game 🟡')
      .setColor('#5865F2')
      .addFields([
        { name: '🔴 Player 1', value: game.player1.username, inline: true },
        { name: '🟡 Player 2', value: game.player2.username, inline: true },
        { name: '🎯 Turn', value: `${game.getCurrentPlayerEmoji()} ${game.currentPlayer.username}`, inline: true }
      ])
      .setImage('attachment://connect4.png')
      .setFooter({ text: 'Click the column numbers to drop your piece!' });

    // Create button rows
    const row1 = new MessageActionRow();
    const row2 = new MessageActionRow();

    // First row: columns 1-4
    for (let i = 0; i < 4; i++) {
      row1.addComponents(
        new MessageButton()
          .setCustomId(`c4_${i}`)
          .setLabel(`Column ${i + 1}`)
          .setStyle('PRIMARY')
          .setEmoji('⬇️')
      );
    }

    // Second row: columns 5-7
    for (let i = 4; i < 7; i++) {
      row2.addComponents(
        new MessageButton()
          .setCustomId(`c4_${i}`)
          .setLabel(`Column ${i + 1}`)
          .setStyle('PRIMARY')
          .setEmoji('⬇️')
      );
    }

    const gameMessage = await message.reply({ 
      embeds: [embed], 
      components: [row1, row2],
      files: [attachment]
    });

    const collector = gameMessage.createMessageComponentCollector({
      time: 300000,
      filter: (i) => [game.player1.id, game.player2.id].includes(i.user.id)
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== game.currentPlayer.id) {
        return interaction.reply({ content: '❌ Not your turn!', ephemeral: true });
      }

      const column = parseInt(interaction.customId.split('_')[1]);

      if (!game.isValidMove(column)) {
        return interaction.reply({ content: '❌ Column is full!', ephemeral: true });
      }

      game.makeMove(column);

      // Create new canvas with updated board
      const newCanvas = await this.createGameCanvas(game);
      const newAttachment = new MessageAttachment(newCanvas.toBuffer(), 'connect4.png');

      const newEmbed = new MessageEmbed()
        .setTitle('Connect 4')
        .setColor(game.isGameOver() ? '#57F287' : '#5865F2')
        .setImage('attachment://connect4.png');

      if (game.isGameOver()) {
        newEmbed.addField('🏆 Result', game.winner ? `${game.getPlayerEmoji(game.winner)} ${game.winner.username} wins!` : 'Tie game!');
        newEmbed.setFooter({ text: 'Game Over! Thanks for playing!' });
        collector.stop();
        await interaction.update({ 
          embeds: [newEmbed], 
          components: [],
          files: [newAttachment]
        });
      } else {
        newEmbed.addFields([
          { name: 'Player 1', value: game.player1.username, inline: true + '🔴' },
          { name: 'Player 2', value: game.player2.username, inline: true + '🟡' },
          { name: 'Turn', value: `${game.getCurrentPlayerEmoji()} ${game.currentPlayer.username}`, inline: true }
        ]);
        newEmbed.setFooter({ text: 'Click the column numbers to drop your piece!' });

        // Create new button rows
        const newRow1 = new MessageActionRow();
        const newRow2 = new MessageActionRow();

        // First row: columns 1-4
        for (let i = 0; i < 4; i++) {
          newRow1.addComponents(
            new MessageButton()
              .setCustomId(`c4_${i}`)
              .setLabel(`Column ${i + 1}`)
              .setStyle('PRIMARY')
              .setEmoji('⬇️')
              .setDisabled(!game.isValidMove(i))
          );
        }

        // Second row: columns 5-7
        for (let i = 4; i < 7; i++) {
          newRow2.addComponents(
            new MessageButton()
              .setCustomId(`c4_${i}`)
              .setLabel(`Column ${i + 1}`)
              .setStyle('PRIMARY')
              .setEmoji('⬇️')
              .setDisabled(!game.isValidMove(i))
          );
        }

        await interaction.update({ 
          embeds: [newEmbed], 
          components: [newRow1, newRow2],
          files: [newAttachment]
        });
      }
    });

    collector.on('end', () => {
      if (!game.isGameOver()) {
        gameMessage.edit({ content: 'Game timed out!', components: [] }).catch(() => {});
      }
    });
  }

  async createGameCanvas(game) {
    const canvas = createCanvas(700, 600);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Connect 4', canvas.width / 2, 40);

    // Player info
    ctx.font = '20px Arial';
    ctx.fillStyle = '#E74C3C';
    ctx.fillText(`🔴 ${game.player1.username}`, 150, 80);
    ctx.fillStyle = '#F39C12';
    ctx.fillText(`🟡 ${game.player2.username}`, 550, 80);

    // Current turn indicator
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    const turnText = `${game.getCurrentPlayerEmoji()} ${game.currentPlayer.username}'s turn`;
    ctx.fillText(turnText, canvas.width / 2, 110);

    // Board background
    ctx.fillStyle = '#3498DB';
    ctx.fillRect(50, 140, 600, 420);

    // Draw grid and pieces
    const cellSize = 80;
    const startX = 70;
    const startY = 160;

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const x = startX + col * cellSize + cellSize / 2;
        const y = startY + row * cellSize + cellSize / 2;

        // Draw cell background
        ctx.fillStyle = '#2980B9';
        ctx.fillRect(startX + col * cellSize, startY + row * cellSize, cellSize, cellSize);

        // Draw piece
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, 2 * Math.PI);

        const cell = game.board[row][col];
        if (cell === 0) {
          ctx.fillStyle = '#34495E'; // Empty
        } else if (cell === 1) {
          ctx.fillStyle = '#E74C3C'; // Red
        } else {
          ctx.fillStyle = '#F39C12'; // Yellow
        }
        ctx.fill();

        // Add border
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Column numbers
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    for (let col = 0; col < 7; col++) {
      const x = startX + col * cellSize + cellSize / 2;
      ctx.fillText((col + 1).toString(), x, 590);
    }

    // Game over overlay
    if (game.isGameOver()) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';

      if (game.winner) {
        ctx.fillText('🎉 GAME OVER! 🎉', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = game.winner === game.player1 ? '#E74C3C' : '#F39C12';
        ctx.fillText(`${game.getPlayerEmoji(game.winner)} ${game.winner.username} WINS!`, canvas.width / 2, canvas.height / 2 + 20);
      } else {
        ctx.fillText('🤝 TIE GAME! 🤝', canvas.width / 2, canvas.height / 2);
      }
    }

    return canvas;
  }
};

// Connect 4 Game Class
class Connect4Game {
  constructor(player1, player2) {
    this.player1 = player1;
    this.player2 = player2;
    this.currentPlayer = player1;
    this.board = Array(6).fill().map(() => Array(7).fill(0));
    this.winner = null;
    this.gameOver = false;
  }

  makeMove(column) {
    for (let row = 5; row >= 0; row--) {
      if (this.board[row][column] === 0) {
        this.board[row][column] = this.currentPlayer === this.player1 ? 1 : 2;
        break;
      }
    }

    if (this.checkWin()) {
      this.winner = this.currentPlayer;
      this.gameOver = true;
    } else if (this.isBoardFull()) {
      this.gameOver = true;
    } else {
      this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
    }
  }

  isValidMove(column) {
    return column >= 0 && column < 7 && this.board[0][column] === 0;
  }

  checkWin() {
    const directions = [[0,1], [1,0], [1,1], [1,-1]];

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const player = this.board[row][col];
        if (player === 0) continue;

        for (let [dx, dy] of directions) {
          let count = 1;
          for (let i = 1; i < 4; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 7 && 
                this.board[newRow][newCol] === player) {
              count++;
            } else break;
          }
          if (count >= 4) return true;
        }
      }
    }
    return false;
  }

  isBoardFull() {
    return this.board[0].every(cell => cell !== 0);
  }

  isGameOver() {
    return this.gameOver;
  }

  getCurrentPlayerEmoji() {
    return this.currentPlayer === this.player1 ? '🔴' : '🟡';
  }

  getPlayerEmoji(player) {
    return player === this.player1 ? '🔴' : '🟡';
  }
}