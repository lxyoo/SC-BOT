const BaseEvent = require('../../utils/structures/BaseEvent');

module.exports = class ReadyEvent extends BaseEvent {
  constructor() {
    super('ready');
  }

  async run(client) {
    console.log(`${client.user.tag} has logged in.`);

    client.user.setPresence({
      activities: [
        {
          name: 'Over Goon City',
          type: 'WATCHING', // Can also be PLAYING, LISTENING, COMPETING
        }
      ],
      status: 'online' // valid: 'online', 'idle', 'dnd', or 'invisible'
    });
  }
};
