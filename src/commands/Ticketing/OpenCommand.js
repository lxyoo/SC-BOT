const BaseCommand = require('../../utils/structures/BaseCommand');

module.exports = class OpenCommand extends BaseCommand {
  constructor() {
    super('open', 'ticket', []);
  }

  run(client, message, args) {
    message.channel.send('open command works');
  }
}