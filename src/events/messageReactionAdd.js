const BaseEvent = require('../utils/structures/BaseEvent');
const UserTracker = require('../utils/userTracking');

module.exports = class MessageReactionAddEvent extends BaseEvent {
  constructor() {
    super('messageReactionAdd');
  }

  async run(client, reaction, user) {
    if (user.bot) return;

    // Update reaction stats for the person giving the reaction
    await UserTracker.updateReactionStats(user.id, 'given');
    
    // Update reaction stats for the person receiving the reaction
    if (reaction.message.author && !reaction.message.author.bot) {
      await UserTracker.updateReactionStats(reaction.message.author.id, 'received');
    }
  }
};