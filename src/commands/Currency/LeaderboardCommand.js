const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const currency = require('../../utils/currency');
const { createCanvas, loadImage, registerFont } = require('canvas');

module.exports = class LeaderboardCommand extends BaseCommand {
  constructor() {
    super('leaderboard', 'Currency', ['lb', 'top', 'rich']);
  }

  async run(client, message, args) {
    const topUsers = await currency.getTopUsers(10);

    if (topUsers.length === 0) {
      const embed = new MessageEmbed()
        .setTitle('Miko Leaderboard')
        .setDescription('No one has any Yen yet! Be the first to work!')
        .setColor('#ff6b6b')
        .setFooter('Use ~work to start earning!');

      return message.channel.send({ embeds: [embed] });
    }

    // Get user info for each top user
    const leaderboardData = [];
    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      try {
        const discordUser = await client.users.fetch(user.userId);
        leaderboardData.push({
          position: i + 1,
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.displayAvatarURL({ format: 'png', size: 128 }),
          balance: user.balance,
          userId: user.userId
        });
      } catch (error) {
        // User not found, skip
        continue;
      }
    }

    // Create canvas image
    const canvas = await this.createAdvancedLeaderboardCanvas(leaderboardData, client, message);
    const attachment = new MessageAttachment(canvas.toBuffer(), 'leaderboard.png');

    // Create embed
    const embed = new MessageEmbed()
      .setTitle('🏆 Yen Leaderboard')
      .setColor('#7289DA')
      .setImage('attachment://leaderboard.png')
      .setTimestamp();

    // Add user's position info
    const userBalance = await currency.getBalance(message.author.id);
    if (userBalance > 0) {
      const allUsers = await currency.getTopUsers(1000);
      const userPosition = allUsers.findIndex(u => u.userId === message.author.id) + 1;
      
      if (userPosition > 10) {
        embed.setDescription(`Your Position: **#${userPosition}** with ${currency.formatCurrency(userBalance)}`);
      }
    }

    await message.channel.send({ embeds: [embed], files: [attachment] });
  }

  async createAdvancedLeaderboardCanvas(leaderboardData, client, message) {
    const canvas = createCanvas(900, 700);
    const ctx = canvas.getContext('2d');

    // Background with MEE6-style gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#2C2F33');
    bgGradient.addColorStop(0.5, '#23272A');
    bgGradient.addColorStop(1, '#1e2124');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header section
    const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    headerGradient.addColorStop(0, '#7289DA');
    headerGradient.addColorStop(1, '#5B6EAE');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, canvas.width, 100);

    // Header shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 100, canvas.width, 5);

    // Server info in header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 YEN LEADERBOARD', canvas.width / 2, 35);

    ctx.font = '16px Arial';
    ctx.fillText(`${message.guild.name} • ${leaderboardData.length} users`, canvas.width / 2, 70);

    // Draw leaderboard entries
    for (let i = 0; i < leaderboardData.length; i++) {
      const user = leaderboardData[i];
      const y = 130 + (i * 55);

      // Entry background with hover effect
      // Entry background with hover effect
      const entryGradient = ctx.createLinearGradient(0, y - 25, 0, y + 25);
      if (i < 3) {
        // Top 3 get special gradient
        entryGradient.addColorStop(0, 'rgba(114, 137, 218, 0.2)');
        entryGradient.addColorStop(1, 'rgba(114, 137, 218, 0.1)');
      } else {
        entryGradient.addColorStop(0, i % 2 === 0 ? '#36393F' : '#2C2F33');
        entryGradient.addColorStop(1, i % 2 === 0 ? '#2C2F33' : '#23272A');
      }
      ctx.fillStyle = entryGradient;
      ctx.fillRect(20, y - 25, canvas.width - 40, 50);

      // Entry border for top 3
      if (i < 3) {
        ctx.strokeStyle = this.getPositionColor(user.position);
        ctx.lineWidth = 2;
        ctx.strokeRect(20, y - 25, canvas.width - 40, 50);
      }

      // Position background circle
      ctx.fillStyle = this.getPositionColor(user.position);
      ctx.beginPath();
      ctx.arc(55, y, 18, 0, Math.PI * 2);
      ctx.fill();

      // Position text
      ctx.fillStyle = user.position <= 3 ? '#000000' : '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(user.position.toString(), 55, y + 5);

      // Load and draw avatar with border
      try {
        const avatar = await loadImage(user.avatar);
        
        // Avatar border
        ctx.strokeStyle = this.getPositionColor(user.position);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(110, y, 22, 0, Math.PI * 2);
        ctx.stroke();

        // Avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(110, y, 20, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 90, y - 20, 40, 40);
        ctx.restore();
      } catch (error) {
        // Draw default avatar
        ctx.fillStyle = '#7289DA';
        ctx.beginPath();
        ctx.arc(110, y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Default avatar icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👤', 110, y + 7);
      }

      // Username with shadow effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      const username = user.username.length > 15 ? user.username.substring(0, 15) + '...' : user.username;
      ctx.fillText(username, 151, y + 6);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(username, 150, y + 5);

      // Level badge (based on wealth)
      const levelBadge = this.getWealthBadge(user.balance);
      ctx.fillStyle = levelBadge.color;
      ctx.fillRect(150, y - 15, 80, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(levelBadge.text, 190, y - 2);

      // Balance with currency symbol
      ctx.fillStyle = '#00FF88';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(currency.formatCurrency(user.balance), canvas.width - 50, y + 5);

      // Wealth level icon
      const wealthIcon = this.getWealthLevel(user.balance);
      ctx.fillStyle = '#FFD700';
      ctx.font = '20px Arial';
      ctx.fillText(wealthIcon, canvas.width - 150, y + 5);

      // Progress bar showing relative wealth
      if (i === 0) {
        // First place gets 100% bar
        const maxWealth = user.balance;
        this.drawProgressBar(ctx, 400, y + 15, 300, 8, 1, '#00FF88');
      } else {
        // Others get relative percentage
        const percentage = user.balance / leaderboardData[0].balance;
        this.drawProgressBar(ctx, 400, y + 15, 300, 8, percentage, '#7289DA');
      }
    }

    // Footer section
    const footerGradient = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
    footerGradient.addColorStop(0, '#23272A');
    footerGradient.addColorStop(1, '#1e2124');
    ctx.fillStyle = footerGradient;
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // Footer shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, canvas.height - 65, canvas.width, 5);

    // Footer text
    ctx.fillStyle = '#99AAB5';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Updated: ${new Date().toLocaleString()}`, canvas.width / 2, canvas.height - 35);

    ctx.fillStyle = '#7289DA';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Start earning with !work • Try your luck with ~slots', canvas.width / 2, canvas.height - 15);

    return canvas;
  }

  drawProgressBar(ctx, x, y, width, height, percentage, color) {
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x, y, width, height);

    // Progress
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * percentage, height);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  getPositionColor(position) {
    switch (position) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#7289DA'; // Discord Blue
    }
  }

  getWealthBadge(balance) {
    if (balance >= 1000000) return { text: 'MILLIONAIRE', color: '#FFD700' };
    if (balance >= 500000) return { text: 'RICH', color: '#E91E63' };
    if (balance >= 100000) return { text: 'WEALTHY', color: '#9C27B0' };
    if (balance >= 50000) return { text: 'WELL-OFF', color: '#673AB7' };
    if (balance >= 10000) return { text: 'COMFORTABLE', color: '#3F51B5' };
    if (balance >= 1000) return { text: 'STABLE', color: '#2196F3' };
    return { text: 'BEGINNER', color: '#607D8B' };
  }

  getWealthLevel(balance) {
    if (balance >= 1000000) return '👑';
    if (balance >= 500000) return '💎';
    if (balance >= 100000) return '🏆';
    if (balance >= 50000) return '📈';
    if (balance >= 10000) return '💰';
    if (balance >= 1000) return '🎯';
    return '📊';
  }
};