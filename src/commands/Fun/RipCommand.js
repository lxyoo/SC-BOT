const { MessageEmbed, MessageAttachment } = require('discord.js');
const Canvas = require('canvas');
const axios = require('axios');
const BaseCommand = require('../../utils/structures/BaseCommand');

module.exports = class RipCommand extends BaseCommand {
  constructor() {
    super('rip', 'Fun', ['grave', 'death']);
  }

  async run(client, message, args) {
    try {
      // Show loading message
      const loadingEmbed = new MessageEmbed()
        .setColor('#ffcc00')
        .setDescription('🪦 Creating RIP image...')
        .setFooter('Please wait...');
      
      const loadingMsg = await message.channel.send({ embeds: [loadingEmbed] });

      // Get target user
      let user = message.mentions.users.first();
      
      if (!user && args[0]) {
        // Try to find user by ID
        if (args[0].length >= 17 && args[0].length <= 19) {
          try {
            user = await client.users.fetch(args[0]);
          } catch (error) {
            // Continue to username search
          }
        }
        
        // Try to find user by username
        if (!user) {
          const member = message.guild.members.cache.find(m => 
            m.user.username.toLowerCase().includes(args[0].toLowerCase()) ||
            m.displayName.toLowerCase().includes(args[0].toLowerCase())
          );
          if (member) user = member.user;
        }
      }
      
      if (!user) {
        user = message.author;
      }

      // Get user avatar
      const avatar = user.displayAvatarURL({
        dynamic: false,
        format: 'png',
        size: 256
      });

      // Create RIP image
      const ripImage = await this.createRipImage(avatar, user.username);
      
      // Create attachment
      const attachment = new MessageAttachment(ripImage, 'rip.png');
      
      // Create embed
      const embed = new MessageEmbed()
        .setColor('#36393f')
        .setTitle('🪦 Rest In Peace')
        .setDescription(`**${user.username}** you **will* (not) be forgotten.`)
        .setImage('attachment://rip.png')
        .setTimestamp();

      // Send the result
      await message.channel.send({ embeds: [embed], files: [attachment] });
      
      // Delete loading message
      await loadingMsg.delete().catch(() => {});

    } catch (error) {
      console.error('RIP Command Error:', error);
      
      const errorEmbed = new MessageEmbed()
        .setColor('#ff4757')
        .setTitle('❌ Error')
        .setDescription('Failed to create RIP image. Please try again.')
        .setFooter('Error occurred while processing image');
      
      await message.channel.send({ embeds: [errorEmbed] });
    }
  }

  async createRipImage(avatarUrl, username) {
    // Create canvas
    const canvas = Canvas.createCanvas(600, 800);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, '#2C2F33');
    gradient.addColorStop(1, '#23272A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 800);

    // Draw tombstone
    await this.drawTombstone(ctx);

    // Load and draw avatar using axios
    const avatar = await this.loadImageFromUrl(avatarUrl);
    
    // Create circular avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(300, 280, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 220, 200, 160, 160);
    ctx.restore();

    // Avatar border
    ctx.beginPath();
    ctx.arc(300, 280, 82, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw text
    await this.drawText(ctx, username);

    // Add decorative elements
    await this.drawDecorations(ctx);

    return canvas.toBuffer();
  }

  async loadImageFromUrl(url) {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(response.data);
      const image = new Canvas.Image();
      image.src = buffer;
      return image;
    } catch (error) {
      console.error('Error loading image:', error);
      // Return a default gray circle if avatar fails to load
      const canvas = Canvas.createCanvas(256, 256);
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#808080';
      ctx.beginPath();
      ctx.arc(128, 128, 128, 0, Math.PI * 2);
      ctx.fill();
      
      const image = new Canvas.Image();
      image.src = canvas.toBuffer();
      return image;
    }
  }

  async drawTombstone(ctx) {
    // Main tombstone body
    ctx.fillStyle = '#8B8B8B';
    ctx.fillRect(150, 150, 300, 450);

    // Tombstone top (rounded)
    ctx.beginPath();
    ctx.arc(300, 150, 150, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();

    // Tombstone shadow/depth
    ctx.fillStyle = '#696969';
    ctx.fillRect(450, 160, 20, 440);
    ctx.beginPath();
    ctx.arc(460, 160, 10, 0, Math.PI);
    ctx.closePath();
    ctx.fill();

    // Base/ground
    ctx.fillStyle = '#2F4F2F';
    ctx.fillRect(0, 600, 600, 200);

    // Grass texture
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 600;
      const y = 600 + Math.random() * 50;
      ctx.fillRect(x, y, 2, 8);
    }
  }

  async drawText(ctx, username) {
    // Truncate username if too long
    const displayName = username.length > 15 ? username.substring(0, 15) + '...' : username;

    // "RIP" text
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('R.I.P.', 302, 422);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText('R.I.P.', 300, 420);

    // Username
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText(displayName, 302, 472);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(displayName, 300, 470);

    // Date
    const currentYear = new Date().getFullYear();
    const dateText = `2020 - ${currentYear}`;
    ctx.font = '18px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText(dateText, 302, 502);
    
    ctx.fillStyle = '#cccccc';
    ctx.fillText(dateText, 300, 500);

    // Epitaph
    ctx.font = 'italic 16px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText('"Gone but not forgotten"', 302, 532);
    
    ctx.fillStyle = '#cccccc';
    ctx.fillText('"Gone but not forgotten"', 300, 530);
  }

  async drawDecorations(ctx) {
    // Flowers
    const flowerPositions = [
      { x: 100, y: 650 },
      { x: 500, y: 660 },
      { x: 80, y: 680 },
      { x: 520, y: 690 }
    ];

    flowerPositions.forEach(pos => {
      // Flower stem
      ctx.strokeStyle = '#228B22';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x, pos.y + 30);
      ctx.stroke();

      // Flower petals
      ctx.fillStyle = '#FFB6C1';
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const petalX = pos.x + Math.cos(angle) * 8;
        const petalY = pos.y + Math.sin(angle) * 8;
        
        ctx.beginPath();
        ctx.arc(petalX, petalY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flower center
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Clouds
    const cloudPositions = [
      { x: 100, y: 80 },
      { x: 400, y: 60 },
      { x: 500, y: 90 }
    ];

    cloudPositions.forEach(pos => {
      ctx.fillStyle = '#F0F8FF';
      ctx.globalAlpha = 0.8;
      
      // Cloud circles
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.arc(pos.x + 15, pos.y, 25, 0, Math.PI * 2);
      ctx.arc(pos.x + 30, pos.y, 20, 0, Math.PI * 2);
      ctx.arc(pos.x + 15, pos.y - 10, 15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalAlpha = 1;
    });

    // Cross on tombstone
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    // Vertical line
    ctx.moveTo(300, 380);
    ctx.lineTo(300, 410);
    // Horizontal line
    ctx.moveTo(285, 395);
    ctx.lineTo(315, 395);
    ctx.stroke();
  }
};