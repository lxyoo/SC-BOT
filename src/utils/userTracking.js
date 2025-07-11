const db = require('quick.db');

class UserTracker {
  static async updateUserActivity(userId, activity) {
    try {
      const userData = await db.get(`user_${userId}`) || {};
      
      // Update basic stats
      userData.messageCount = (userData.messageCount || 0) + 1;
      userData.lastActive = Date.now();
      
      // Update activity patterns
      const hour = new Date().getHours();
      const day = new Date().getDay();
      
      userData.hourlyActivity = userData.hourlyActivity || {};
      userData.hourlyActivity[hour] = (userData.hourlyActivity[hour] || 0) + 1;
      
      userData.dailyActivity = userData.dailyActivity || {};
      userData.dailyActivity[day] = (userData.dailyActivity[day] || 0) + 1;
      
      // Track consistency
      const today = new Date().toDateString();
      if (userData.lastActiveDay !== today) {
        userData.daysActive = (userData.daysActive || 0) + 1;
        userData.lastActiveDay = today;
        
        // Update streak
        if (userData.lastStreakDate) {
          const lastDate = new Date(userData.lastStreakDate);
          const dayDiff = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            userData.currentStreak = (userData.currentStreak || 0) + 1;
          } else if (dayDiff > 1) {
            userData.longestStreak = Math.max(userData.longestStreak || 0, userData.currentStreak || 0);
            userData.currentStreak = 1;
          }
        } else {
          userData.currentStreak = 1;
        }
        
        userData.lastStreakDate = today;
      }
      
      // Calculate peak hours
      const peakHour = Object.keys(userData.hourlyActivity).reduce((a, b) => 
        userData.hourlyActivity[a] > userData.hourlyActivity[b] ? a : b
      );
      userData.peakHours = `${peakHour}:00 - ${parseInt(peakHour) + 1}:00`;
      
      // Calculate most active day
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const peakDay = Object.keys(userData.dailyActivity).reduce((a, b) => 
        userData.dailyActivity[a] > userData.dailyActivity[b] ? a : b
      );
      userData.mostActiveDay = days[parseInt(peakDay)];
      
      // Calculate consistency score
      const totalDays = Math.max(1, Math.floor((Date.now() - (userData.firstActive || Date.now())) / (1000 * 60 * 60 * 24)));
      userData.consistency = Math.round((userData.daysActive / totalDays) * 100);
      
      if (!userData.firstActive) {
        userData.firstActive = Date.now();
      }
      
      await db.set(`user_${userId}`, userData);
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  static async updateCommandUsage(userId, command) {
    try {
      const userData = await db.get(`user_${userId}`) || {};
      
      userData.commandsUsed = (userData.commandsUsed || 0) + 1;
      userData.commandHistory = userData.commandHistory || {};
      userData.commandHistory[command] = (userData.commandHistory[command] || 0) + 1;
      
      // Track favorite command
      const favoriteCommand = Object.keys(userData.commandHistory).reduce((a, b) => 
        userData.commandHistory[a] > userData.commandHistory[b] ? a : b
      );
      userData.favoriteCommand = favoriteCommand;
      
      await db.set(`user_${userId}`, userData);
    } catch (error) {
      console.error('Error updating command usage:', error);
    }
  }

  static async updateReactionStats(userId, type = 'given') {
    try {
      const userData = await db.get(`user_${userId}`) || {};
      
      if (type === 'given') {
        userData.reactionsGiven = (userData.reactionsGiven || 0) + 1;
      } else {
        userData.reactionsReceived = (userData.reactionsReceived || 0) + 1;
      }
      
      await db.set(`user_${userId}`, userData);
    } catch (error) {
      console.error('Error updating reaction stats:', error);
    }
  }

  static async updateVoiceTime(userId, minutes) {
    try {
      const userData = await db.get(`user_${userId}`) || {};
      
      userData.voiceTime = (userData.voiceTime || 0) + minutes;
      userData.voiceSessions = (userData.voiceSessions || 0) + 1;
      
      // Calculate average session time
      userData.avgVoiceSession = Math.round(userData.voiceTime / userData.voiceSessions);
      
      await db.set(`user_${userId}`, userData);
    } catch (error) {
      console.error('Error updating voice time:', error);
    }
  }

  static async updateFileUpload(userId) {
    try {
      const userData = await db.get(`user_${userId}`) || {};
      
      userData.filesUploaded = (userData.filesUploaded || 0) + 1;
      
      await db.set(`user_${userId}`, userData);
    } catch (error) {
      console.error('Error updating file upload:', error);
    }
  }

  static async updateMBTI(userId, mbtiType) {
    try {
      const userData = await db.get(`user_${userId}`) || {};
      
      userData.mbti = mbtiType;
      userData.mbtiTestDate = Date.now();
      
      await db.set(`user_${userId}`, userData);
    } catch (error) {
      console.error('Error updating MBTI:', error);
    }
  }

  static async updateHelpfulVotes(userId, votes = 1) {
    try {
      const userData = await db.get(`user_${userId}`) || {};
      
      userData.helpfulVotes = (userData.helpfulVotes || 0) + votes;
      
      await db.set(`user_${userId}`, userData);
    } catch (error) {
      console.error('Error updating helpful votes:', error);
    }
  }

  static async getUserStats(userId) {
    try {
      return await db.get(`user_${userId}`) || {};
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {};
    }
  }

  static async getLeaderboard(type = 'messageCount', limit = 10) {
    try {
      const allUsers = await db.all();
      const userStats = allUsers
        .filter(entry => entry.ID.startsWith('user_'))
        .map(entry => ({
          userId: entry.ID.replace('user_', ''),
          ...entry.data
        }))
        .filter(user => user[type] > 0)
        .sort((a, b) => (b[type] || 0) - (a[type] || 0))
        .slice(0, limit);
      
      return userStats;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  static async getServerStats(guildId) {
    try {
      const allUsers = await db.all();
      const userStats = allUsers
        .filter(entry => entry.ID.startsWith('user_'))
        .map(entry => entry.data);
      
      const totalMessages = userStats.reduce((sum, user) => sum + (user.messageCount || 0), 0);
      const totalCommands = userStats.reduce((sum, user) => sum + (user.commandsUsed || 0), 0);
      const totalVoiceTime = userStats.reduce((sum, user) => sum + (user.voiceTime || 0), 0);
      const activeUsers = userStats.filter(user => user.lastActive && (Date.now() - user.lastActive) < 7 * 24 * 60 * 60 * 1000).length;
      
      return {
        totalMessages,
        totalCommands,
        totalVoiceTime,
        activeUsers,
        totalUsers: userStats.length
      };
    } catch (error) {
      console.error('Error getting server stats:', error);
      return {};
    }
  }
}

module.exports = UserTracker;