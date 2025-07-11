const db = require('quick.db');

class CurrencySystem {
  constructor() {
    this.currencyName = 'Yen';
    this.currencySymbol = '¥';
    this.workCooldown = 300000; // 5 minutes
    this.slotsCooldown = 60000; // 1 minute
  }

  // Get user balance
  async getBalance(userId) {
    return db.get(`balance_${userId}`) || 0;
  }

  // Set user balance
  async setBalance(userId, amount) {
    return db.set(`balance_${userId}`, Math.max(0, amount));
  }

  // Add to balance
  async addBalance(userId, amount) {
    const currentBalance = await this.getBalance(userId);
    return this.setBalance(userId, currentBalance + amount);
  }

  // Remove from balance
  async removeBalance(userId, amount) {
    const currentBalance = await this.getBalance(userId);
    return this.setBalance(userId, currentBalance - amount);
  }

  // Check if user can afford something
  async canAfford(userId, amount) {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  // Format currency display
  formatCurrency(amount) {
    return `${this.currencySymbol}${amount.toLocaleString()}`;
  }

  // Work cooldown management
  async getWorkCooldown(userId) {
    return db.get(`work_cooldown_${userId}`) || 0;
  }

  async setWorkCooldown(userId, timestamp) {
    return db.set(`work_cooldown_${userId}`, timestamp);
  }

  async canWork(userId) {
    const lastWork = await this.getWorkCooldown(userId);
    return Date.now() - lastWork >= this.workCooldown;
  }

  // Slots cooldown management
  async getSlotsCooldown(userId) {
    return db.get(`slots_cooldown_${userId}`) || 0;
  }

  async setSlotsCooldown(userId, timestamp) {
    return db.set(`slots_cooldown_${userId}`, timestamp);
  }

  async canPlaySlots(userId) {
    const lastSlots = await this.getSlotsCooldown(userId);
    return Date.now() - lastSlots >= this.slotsCooldown;
  }

  // Get top users for leaderboard
  async getTopUsers(limit = 10) {
    const allData = db.all();
    const balances = allData
      .filter(entry => entry.ID.startsWith('balance_'))
      .map(entry => ({
        userId: entry.ID.replace('balance_', ''),
        balance: entry.data
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);

    return balances;
  }

  // Time formatting
  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
}

module.exports = new CurrencySystem();