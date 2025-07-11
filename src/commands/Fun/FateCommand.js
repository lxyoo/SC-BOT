const BaseCommand = require('../../utils/structures/BaseCommand');
const { MessageEmbed } = require('discord.js');

module.exports = class FateCommand extends BaseCommand {
  constructor() {
    super('fate', 'Miscellaneous', []);
    this.aliases = ['howdoidie', 'death', 'killme', 'destiny', 'doom'];
  }

  async run(client, message, args) {
    const responses = [
      // Original ones
      'You\'re in the forest, preferrably with your coworker. Don\'t ask me why. Suddenly, a bear approaches you, and mauls off your head, as your coworker is forced to view your grisly remains.',
      'A ~~cereal~~ serial killer is rampant, loose on the streets. Apparently, you were out clubbing, and as American culture dictates; drinking. He spots you, and beheads you with a U.K. Zombie knife. Thought those were outlawed...',
      'You find yourself boarding a plane to Venice, Italy. About 14 hours in the flight, you realize a suicide bomber is boarding the plane, and threatens to blow everyone up. Well, he blows himself up.. The engine catches on fire, and boom. You\'re dead.',
      'It\'s a lovely afternoon. You, unsuspecting, are out for a walk. You immediately clutch your chest in pain, and keel down, and realize you\'ve been the victim of an untimely active shooting. So much so for America...',
      'A bird swoops down, craps like hell hath scorned, and you, blinded, proceed to walk in a straight direction. You\'re in the streets of bustling London, and you get run over by a cheerful tour bus.',
      'It\'s a wonderful day, and you\'re out with your dog, Quasimodo. Suddenly, Quasimodo jumps on you, and begins to tear your flesh apart one by one.',
      'Your dog, Quasimodo, begins barking into the horizon, wistfully, pretending that he is a wolf. A 64-year old man, enraged, grabs his gun and shoots Quasimodo, thinking he had hit the jackpot for wolf-hunting. RIP Quasimodo!',
      'Your pet fish, Susan, drowns due to her fat-self choking on food. Enraged, her spirit comes to haunt you, in the form of a sleep paralysis demon.',
      
      // New hilarious ones
      'You\'re at McDonald\'s ordering a Big Mac when suddenly the ice cream machine starts working. The shock is so intense that you have a heart attack and die. The last thing you see is a confused employee holding a McFlurry.',
      
      'While browsing Reddit at 3 AM, you stumble upon a meme so funny that you literally die of laughter. Your last words are "LMAO" but you actually did laugh your ass off... to death.',
      
      'You slip on a banana peel outside a comedy club. As you fall, you think "How cliché" and die from the irony overload before you even hit the ground.',
      
      'Your grandmother\'s 47 cats finally revolt against her tyrannical rule. You become collateral damage in the Great Feline Uprising of 2024. The cats leave a single dead mouse on your chest as tribute.',
      
      'While trying to take the perfect selfie on a cliff, you accidentally switch to front camera and see your own face. The sheer horror causes you to stumble backwards and fall. Death by selfie... literally.',
      
      'You\'re eating cereal when you realize you\'re out of milk. In a rage-induced blackout, you storm to the store but get trampled by a stampede of soccer moms fighting over the last gallon of 2% milk.',
      
      'A pigeon steals your sandwich, so you chase it across the city for 3 hours. You finally catch up to it on a rooftop where it drops the sandwich... directly onto your head, knocking you unconscious. You fall off the roof.',
      
      'While arguing with someone on Twitter about pineapple on pizza, you get so heated that you spontaneously combust. Your last tweet is "PINEAPPLE BELONGS ON PIZZA" and it goes viral after your death.',
      
      'You find a genie lamp and wish for immortality. The genie grants your wish but you immediately get hit by a bus. Turns out you\'re immortal but still very much dead. The genie shrugs and says "Whoops."',
      
      'Your smart home becomes sentient and decides you\'re too lazy to live. Alexa turns evil and coordinates with your toaster, microwave, and coffee maker to create the ultimate kitchen appliance death squad.',
      
      'While watching a horror movie, you mock the characters for making dumb decisions. A real ghost appears and says "Oh really? Let\'s see you do better" and drags you into the TV. You die in the opening scene.',
      
      'You get stuck in an elevator with your ex, your boss, and a mime. The psychological torture is so intense that you choose to gnaw through the elevator cables rather than endure another minute of awkward silence.',
      
      'A time traveler from the future appears and says "I\'m here to prevent your death!" Then immediately trips over their own feet and accidentally pushes you into traffic. Time travel is clearly overrated.',
      
      'You\'re at a wedding and catch the bouquet. Unfortunately, it\'s made of poison ivy and you\'re severely allergic. You die from anaphylactic shock while everyone applauds your "catch."',
      
      'While playing Pokemon GO, you walk into a real-life Pokemon battle between two actual animals. A squirrel and a raccoon are fighting over territory and you become their unwilling participant. The squirrel wins.',
      
      'You decide to become a food critic and review a suspicious hot dog stand. The hot dog is so terrible that your soul leaves your body in protest. The vendor gives you 1 star on Yelp posthumously.',
      
      'A flash mob appears around you and starts dancing. You try to escape but they keep surrounding you with increasingly aggressive choreography. You die from exhaustion trying to keep up with the Macarena.',
      
      'You\'re at a library when all the books suddenly come to life. They\'re angry about being underappreciated in the digital age. You get beaten to death by a particularly vindictive dictionary.',
      
      'While assembling IKEA furniture, you accidentally create a portal to another dimension. An alien emerges, takes one look at your Allen wrench skills, and decides humanity isn\'t worth saving. You die of shame.',
      
      'Your GPS malfunctions and gives you directions to the afterlife instead of the grocery store. You follow them anyway because you trust technology more than your own judgment. Siri says "You have arrived at your destination."',
      
      'You enter a dad joke contest and your joke is so bad that it creates a black hole of cringe. The last thing you hear before being sucked into the void is your own terrible punchline echoing in space.',
      
      'A group of angry geese mistake you for someone who didn\'t feed them bread at the park last Tuesday. They form a goose gang and hunt you down across three states. You die in an epic goose chase.',
      
      'You try to pet a cat that turns out to be a very patient lion who was just waiting for someone dumb enough to approach it. The lion is actually impressed by your stupidity and gives you a quick, merciful death.',
      
      'While doing yoga, you accidentally achieve enlightenment and your soul ascends to a higher plane. Your body is left behind doing a perfect downward dog pose. The yoga instructor uses you as an example for the next class.',
      
      'You get into an argument with a toddler about the correct way to color inside the lines. The toddler\'s logic is so flawless that your brain short-circuits and you die from being intellectually outmatched by a 3-year-old.',
      
      'A conspiracy theorist convinces you that birds aren\'t real. You spend so much time looking up at "government drones" that you walk into an actual bird, which turns out to be very real and very angry about being called fake.',
      
      'You find a magic eight ball that actually predicts the future. You ask it "Will I die today?" and it says "Ask again later." You shake it again immediately and it explodes from the paradox, taking you with it.',
      
      'While trying to cancel a subscription service, you get trapped in an infinite loop of customer service transfers. You die of old age while on hold, still listening to the same 30-second elevator music on repeat.',
      
      'A group of mimes trap you in an invisible box. You laugh at first, thinking it\'s just a performance, but then realize you actually can\'t get out. You die of embarrassment when you realize mimes are real and very powerful.',
      
      'You challenge a child to a video game and lose so badly that your gamer card gets revoked by the International Gaming Committee. The shame is so intense that you spontaneously combust into pixels.',
      
      'While speed-dating, you meet your perfect match. Unfortunately, they\'re also Death in disguise looking for a date. You have a lovely evening together before they gently escort you to the afterlife. At least you died happy!'
    ];

    const memeImages = [
      'https://i.imgflip.com/2/1bij.jpg', // Skull meme
      'https://i.imgflip.com/2/5c7lwm.jpg', // Coffin dance
      'https://i.imgflip.com/2/4t0m5.jpg', // This is fine (burning)
      'https://i.imgflip.com/2/26am.jpg', // Surprised Pikachu
      'https://i.imgflip.com/2/1otk96.jpg', // Distracted boyfriend
      'https://i.imgflip.com/2/1ur9b0.jpg', // Drake pointing
      'https://i.imgflip.com/2/4q29.jpg', // Expanding brain
      'https://i.imgflip.com/2/1ihzfe.jpg', // Sword pointing
      'https://i.imgflip.com/2/61kp.jpg', // Disaster girl
      'https://i.imgflip.com/2/5496.jpg', // One does not simply
    ];
    
    const deathTexts = [
      'You died lol',
      'WASTED',
      'Mission Failed Successfully',
      'Achievement Unlocked: Dead',
      'Game Over',
      'You have been eliminated',
      'RIP in pepperoni',
      'Death speedrun any%',
      'Congratulations! You died!',
      'Task failed successfully',
      'You got yeeted out of existence',
      'Connection lost: Life.exe has stopped working',
      'Error 404: Life not found',
      'You have been unalived',
      'Skill issue: Death',
      'POV: You died',
      'When you die but it\'s Tuesday:',
      'Nobody: \nAbsolutely nobody: \nYou: *dies*',
      'Breaking News: Local person dies',
      'You died (emotional) (not clickbait)',
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    const memeImage = memeImages[Math.floor(Math.random() * memeImages.length)];
    const deathText = deathTexts[Math.floor(Math.random() * deathTexts.length)];

    const embed = new MessageEmbed()
      .setDescription(response)
      .setFooter(
        `${deathText}`
      )
      .setColor('#ff6b6b')
      .setImage(memeImage)
    message.channel.send({ embeds: [embed] });
  }
}
