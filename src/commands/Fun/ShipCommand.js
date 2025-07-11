const { MessageEmbed, MessageAttachment } = require('discord.js');
const BaseCommand = require('../../utils/structures/BaseCommand');
const Canvas = require('canvas');
const axios = require('axios');

module.exports = class ShipCommand extends BaseCommand {
  constructor() {
    super('ship', 'Fun', ['love', 'couple', 'match']);
  }

  async run(client, message, args) {
    let user1, user2;
    
    // Check if users are mentioned
    if (message.mentions.users.size >= 2) {
      user1 = message.mentions.users.first();
      user2 = message.mentions.users.last();
    } else if (message.mentions.users.size === 1) {
      user1 = message.author;
      user2 = message.mentions.users.first();
    } else {
      // No users mentioned - self love scenarios
      return this.handleSelfLove(message);
    }

    // Generate ship percentage
    const shipPercentage = Math.floor(Math.random() * 101);

    // Create ship image
    const shipImage = await this.createShipImage(user1, user2, shipPercentage);
    const attachment = new MessageAttachment(shipImage, 'ship.png');

    // Create embed
    const embed = new MessageEmbed()
      .setTitle('A Ship Attempts to Sail..')
      .setDescription(`**${user1.username}** 💕 **${user2.username}**\n\n${this.getShipMessage(shipPercentage)}`)
      .setColor(this.getShipColor(shipPercentage))
      .setImage('attachment://ship.png')
    await message.channel.send({ embeds: [embed], files: [attachment] });
  }

  async handleSelfLove(message) {
    const selfLoveScenarios = [
      'You tried to ship yourself with... yourself. That\'s just masturbation with extra steps.',
      'Congratulations! You have a 100% compatibility rate with your hand. A match made in heaven!',
      'You\'re so lonely that even your reflection ghosted you. Maybe try dating a houseplant?',
      'Breaking news: Local person discovers they\'re their own soulmate. More at 11.',
      'You and your body pillow have a 95% compatibility rate. The missing 5% is because it can\'t talk back.',
      'Your left hand and right hand are fighting over who gets to date you. Plot twist: neither wants to.',
      'You tried to ship yourself but even the shipping calculator said "Please seek therapy."',
      'You have a perfect relationship with your pizza. It\'s cheesy, hot, and always satisfies you.',
      'You\'re so single that when you play solitaire, the cards file a restraining order.',
      'Your love life is like a broken pencil... completely pointless. But hey, at least you\'re consistent!',
      'You and your Netflix account have been together longer than most marriages. True love exists!',
      'You tried to find your other half but realized you\'re a whole mess, not a half of anything.',
      'Your phone\'s autocorrect has a better relationship with you than any human ever will.',
      'You\'re like a software update - nobody wants you, but you keep showing up anyway.',
      'You and your anxiety have a 100% compatibility rate. You never leave each other alone!',
      'Your love life is so dry that even the Sahara Desert is offering you hydration tips.',
      'You tried to ship yourself with someone but the universe said "Error 404: Love not found."',
      'You have a stronger bond with your Wi-Fi than with any human. At least it connects to you sometimes.',
      'Your relationship status is "It\'s complicated" with your own reflection.',
      'You\'re so single that when you order food for two, the second meal is also for you.',
    ];

    const scenario = selfLoveScenarios[Math.floor(Math.random() * selfLoveScenarios.length)];
    const percentage = Math.floor(Math.random() * 101);

    // Create self-love image
    const selfImage = await this.createSelfLoveImage(message.author, percentage);
    const attachment = new MessageAttachment(selfImage, 'self-love.png');

    const embed = new MessageEmbed()
      .setTitle('Self-Love?')
      .setDescription(scenario)
      .setColor('#ff69b4')
      .setImage('attachment://self-love.png')
    await message.channel.send({ embeds: [embed], files: [attachment] });
  }

  async createShipImage(user1, user2, percentage) {
    const canvas = Canvas.createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 800, 400);

    // Load avatars
    const avatar1 = await this.loadImageFromUrl(user1.displayAvatarURL({ format: 'png', size: 256 }));
    const avatar2 = await this.loadImageFromUrl(user2.displayAvatarURL({ format: 'png', size: 256 }));

    // Draw left avatar (circular)
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 200, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar1, 70, 120, 160, 160);
    ctx.restore();

    // Left avatar border
    ctx.beginPath();
    ctx.arc(150, 200, 82, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw right avatar (circular)
    ctx.save();
    ctx.beginPath();
    ctx.arc(650, 200, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar2, 570, 120, 160, 160);
    ctx.restore();

    // Right avatar border
    ctx.beginPath();
    ctx.arc(650, 200, 82, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw heart in the middle
    this.drawHeart(ctx, 400, 200, 60, '#ff1744');

    // Draw percentage
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${percentage}%`, 400, 350);

    // Draw usernames
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(user1.username, 150, 320);
    ctx.fillText(user2.username, 650, 320);

    return canvas.toBuffer();
  }

  async createSelfLoveImage(user, percentage) {
    const canvas = Canvas.createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 800, 400);

    // Load avatar
    const avatar = await this.loadImageFromUrl(user.displayAvatarURL({ format: 'png', size: 256 }));

    // Draw same avatar twice with different effects
    // Left avatar (normal)
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 200, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 70, 120, 160, 160);
    ctx.restore();

    // Left avatar border
    ctx.beginPath();
    ctx.arc(150, 200, 82, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Right avatar (slightly different - maybe grayscale or flipped)
    ctx.save();
    ctx.beginPath();
    ctx.arc(650, 200, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.filter = 'grayscale(50%)';
    ctx.drawImage(avatar, 570, 120, 160, 160);
    ctx.restore();

    // Right avatar border
    ctx.beginPath();
    ctx.arc(650, 200, 82, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw broken heart in the middle
    this.drawBrokenHeart(ctx, 400, 200, 60);

    // Draw percentage
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${percentage}%`, 400, 350);

    // Draw usernames
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(user.username, 150, 320);
    ctx.fillText(user.username, 650, 320);

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

  drawHeart(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x - size/4, y - size/4, size/4, 0, Math.PI * 2);
    ctx.arc(x + size/4, y - size/4, size/4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x, y + size/4);
    ctx.lineTo(x - size/2, y - size/8);
    ctx.lineTo(x + size/2, y - size/8);
    ctx.closePath();
    ctx.fill();
  }

  drawBrokenHeart(ctx, x, y, size) {
    // Left half of heart
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(x - size/4, y - size/4, size/4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x, y + size/4);
    ctx.lineTo(x - size/2, y - size/8);
    ctx.lineTo(x, y - size/8);
    ctx.closePath();
    ctx.fill();

    // Right half of heart (slightly offset)
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(x + size/4 + 5, y - size/4, size/4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x + 5, y + size/4);
    ctx.lineTo(x + 5, y - size/8);
    ctx.lineTo(x + size/2 + 5, y - size/8);
    ctx.closePath();
    ctx.fill();

    // Crack line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - size/2);
    ctx.lineTo(x + 2, y + size/2);
    ctx.stroke();
  }

  getShipMessage(percentage) {
    if (percentage >= 90) return "💖 Perfect match! You're soulmates!";
    if (percentage >= 70) return "💕 Great compatibility! Love is in the air!";
    if (percentage >= 50) return "💛 Not bad! There's potential here!";
    if (percentage >= 30) return "💙 Friendship material, maybe more?";
    if (percentage >= 10) return "💔 Yikes... Maybe just stay friends?";
    return "💀 This ship has sunk before it even sailed!";
  }

  getShipColor(percentage) {
    if (percentage >= 70) return '#ff1744'; // Red for high love
    if (percentage >= 40) return '#ff9800'; // Orange for medium
    return '#9e9e9e'; // Gray for low
  }
};