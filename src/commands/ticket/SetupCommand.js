const BaseCommand = require('../../utils/structures/BaseCommand');
const db = require("quick.db");
const sourcebin = require('sourcebin_js');
const Discord = require("discord.js");

module.exports = class SetupCommand extends BaseCommand {
  constructor() {
    super('setup', 'ticket', []);
  }

  async run(client, message, args) {
    const log = message.guild.channels.cache.find(log => log.name === "ticket-box")
    if (log) {
      const discord = new Discord.MessageEmbed()
      .setDescription("❌ You, or a moderator has already set up the ticketing system.")
      return message.reply(embed)
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
      const embed = new Discord.MessageEmbed()
        .setTitle(`Ticket Box`)
        .setDescription('Please run `%new` here to create a new ticket to gain acces, and verify.')
        .setColor("FF0000")
      channel.send(embed);
      let vc1 = "600";
      channel.setRateLimitPerUser(vc1, `Responsible - ${message.member}`);
      db.set(`setuped_${message.guild.id}`, channel.id);
    })
    const embed = new Discord.MessageEmbed()
    .setDescription("✅ I will now accept ticket messages __only__ from the ticket box channel!")
    .setColor("ff0000")
    message.reply(embed)
  }
}
