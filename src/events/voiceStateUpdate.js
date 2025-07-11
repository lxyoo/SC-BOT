const UserTracker = require('../utils/userTracking');

const voiceSessions = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const userId = newState.member.user.id;
    
    // User joined a voice channel
    if (!oldState.channel && newState.channel) {
      voiceSessions.set(userId, Date.now());
    }
    
    // User left a voice channel
    if (oldState.channel && !newState.channel) {
      const joinTime = voiceSessions.get(userId);
      if (joinTime) {
        const duration = Math.floor((Date.now() - joinTime) / (1000 * 60)); // minutes
        await UserTracker.updateVoiceTime(userId, duration);
        voiceSessions.delete(userId);
      }
    }
  }
};