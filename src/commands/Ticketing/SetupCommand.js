const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const sourcebin = require('sourcebin_js');
const { MessageEmbed } = require("discord.js");

module.exports = class SetupCommand extends BaseCommand {
  constructor() {
    super('setup', 'Ticketing', []);
  }

  async run(client, message, args) {
    const log = message.guild.channels.cache.find(log => log.name === "ticket-box")
    if (log) {
      const embed3 = new MessageEmbed()
        .setDescription("`❌` You or an admin has __already__ set up the ticketing system")
      return message.reply({ embeds: [embed3] })
    }
    message.guild.channels.create(`ticket-box`, {
      permissionOverwrites: [
        {
          id: message.guild.roles.everyone,
          allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
        },
      ],
      type: 'text',
    }).then(async channel => {
      const embed2 = new MessageEmbed()
        .setDescription('`⚠️` Please run `~new` here to create a new ticket.')
        .setColor("YELLOW")
      channel.send({ embeds: [embed2] });
      let vc1 = "600";
      channel.setRateLimitPerUser(vc1, `Responsible - ${message.member}`);
      db.set(`setuped_${message.guild.id}`, channel.id);
    })
    const embed = new MessageEmbed()
      .setDescription("`✅` Accepting tickets __only__ from ticket box channel")
      .setColor("GREEN")
    message.reply({ embeds: [embed] })
  }
}