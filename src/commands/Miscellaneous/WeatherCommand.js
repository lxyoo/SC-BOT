const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const axios = require('axios');
const BaseCommand = require('../../utils/structures/BaseCommand');

const stateAbbreviations = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

module.exports = class WeatherCommand extends BaseCommand {
  constructor() {
    super('weather', 'Miscellaneous', ['w', 'forecast']);
  }

  async run(client, message, args) {
    const apiKey = 'c9822830892040a1bda223228240710';
    let query = args.join(' ').trim();
    
    // Handle state abbreviations
    const upperQuery = query.toUpperCase();
    if (stateAbbreviations[upperQuery]) {
      query = stateAbbreviations[upperQuery];
    }

    if (!query) {
      return this.sendErrorEmbed(message, 'Please provide a location (city, state, or country).\n**Example:** `weather New York` or `weather CA`');
    }

    // Show typing indicator
    await message.channel.sendTyping();

    const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(query)}&aqi=yes`;

    try {
      const { data: weather } = await axios.get(url);
      
      const embed = this.createWeatherEmbed(weather);
      const row = this.createActionRow(weather);

      await message.channel.send({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error('Weather API Error:', error.response?.data || error.message);
      
      let errorMessage = 'An unexpected error occurred while fetching weather data.';
      
      if (error.response?.status === 400) {
        errorMessage = `Location "${query}" not found. Please check the spelling and try again.`;
      } else if (error.response?.status === 401) {
        errorMessage = 'Weather service is temporarily unavailable. Please try again later.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }

      return this.sendErrorEmbed(message, errorMessage);
    }
  }

  createWeatherEmbed(weather) {
    const { location, current } = weather;
    
    // Get weather condition emoji
    const conditionEmoji = this.getWeatherEmoji(current.condition.text);
    
    // Format location display
    const locationDisplay = location.region 
      ? `${location.name}, ${location.region}, ${location.country}`
      : `${location.name}, ${location.country}`;

    // Get weather background color based on condition
    const embedColor = this.getWeatherColor(current.condition.text);

    const embed = new MessageEmbed()
      .setTitle(`${conditionEmoji} Weather in ${locationDisplay}`)
      .setDescription(`**${current.condition.text}**`)
      .setThumbnail(`https:${current.condition.icon}`)
      .addFields(
        { 
          name: 'Temperature', 
          value: `\`${current.temp_f}°F\` / \`${current.temp_c}°C\``, 
          inline: true 
        },
        { 
          name: 'Feels Like', 
          value: `\`${current.feelslike_f}°F\` / \`${current.feelslike_c}°C\``, 
          inline: true 
        },
        { 
          name: 'Humidity', 
          value: `\`${current.humidity}%\``, 
          inline: true 
        },
        { 
          name: 'Wind', 
          value: `\`${current.wind_mph} mph\` / \`${current.wind_kph} kph\`\n\`${current.wind_dir}\``, 
          inline: true 
        },
        { 
          name: 'Cloud Cover', 
          value: `\`${current.cloud}%\``, 
          inline: true 
        },
        { 
          name: 'UV Index', 
          value: `\`${current.uv}\` ${this.getUVDescription(current.uv)}`, 
          inline: true 
        },
        { 
          name: 'Visibility', 
          value: `\`${current.vis_miles} mi\` / \`${current.vis_km} km\``, 
          inline: true 
        },
        { 
          name: 'Pressure', 
          value: `\`${current.pressure_mb} mb\` / \`${current.pressure_in} in\``, 
          inline: true 
        }
      )
      .setColor(embedColor)
      .setFooter({ 
        text: `Last updated: ${current.last_updated} • Powered by WeatherAPI.com`, 
        iconURL: `https:${current.condition.icon}` 
      });

    // Add air quality information if available
    if (current.air_quality) {
      const aqiValue = Math.round(current.air_quality['us-epa-index']);
      const aqiDescription = this.getAQIDescription(aqiValue);
      embed.addField('Air Quality', `\`${aqiValue}\` ${aqiDescription}`, true);
    }

    return embed;
  }

  createActionRow(weather) {
    const moreInfoUrl = `https://www.weatherapi.com/weather/q/${encodeURIComponent(weather.location.name)}`;
    
    return new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel('More Details')
        .setStyle('LINK')
        .setURL(moreInfoUrl),
      new MessageButton()
        .setLabel('Refresh')
        .setStyle('SECONDARY')
        .setCustomId(`weather_refresh_${weather.location.name}`)
    );
  }

  getWeatherEmoji(condition) {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return '🌧️';
    if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) return '❄️';
    if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return '⛈️';
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '🌫️';
    if (conditionLower.includes('wind')) return '💨';
    if (conditionLower.includes('overcast')) return '☁️';
    
    return '🌤️';
  }

  getWeatherColor(condition) {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return '#FFD700';
    if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) return '#708090';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return '#4682B4';
    if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) return '#87CEEB';
    if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return '#483D8B';
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '#696969';
    
    return '#6ec5ff';
  }

  getUVDescription(uvIndex) {
    if (uvIndex <= 2) return '(Low)';
    if (uvIndex <= 5) return '(Moderate)';
    if (uvIndex <= 7) return '(High)';
    if (uvIndex <= 10) return '(Very High)';
    return '(Extreme)';
  }

  getAQIDescription(aqi) {
    if (aqi <= 50) return '(Good)';
    if (aqi <= 100) return '(Moderate)';
    if (aqi <= 150) return '(Unhealthy for Sensitive Groups)';
    if (aqi <= 200) return '(Unhealthy)';
    if (aqi <= 300) return '(Very Unhealthy)';
    return '(Hazardous)';
  }

  sendErrorEmbed(message, description) {
    const embed = new MessageEmbed()
      .setDescription(`\`❌\` Error: ${description}`)
      .setColor('#ff4757');
    
    return message.channel.send({ embeds: [embed] });
  }
};