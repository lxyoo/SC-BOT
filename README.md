# Lumic

<div align="center" style="background: linear-gradient(135deg, #ff69b4, #ffb6c1, #ffc0cb); padding: 20px; border-radius: 15px; margin: 20px 0;">
  <img src="./lumic.jpg" alt="Lumic Bot Logo" width="200" height="200" />
  
  [![Discord.js](https://img.shields.io/badge/Discord.js-v13-ff69b4.svg)](https://discord.js.org)
  [![Node.js](https://img.shields.io/badge/Node.js-v16+-ffb6c1.svg)](https://nodejs.org)
  [![License](https://img.shields.io/badge/License-MIT-ffc0cb.svg)](LICENSE)
  [![Status](https://img.shields.io/badge/Status-Active-ff69b4.svg)]()
  
  🌸 **Simply beautiful, lol** 🌸
</div>

<div style="background: linear-gradient(135deg, #ff69b4, #ffb6c1, #ffc0cb, #ffe4e6); padding: 30px; border-radius: 20px; color: #2c2c2c; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">

## 🌸 Features

<div style="background: rgba(255, 255, 255, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">

### 🌸 **Moderation System**
- **Warning System** - Comprehensive warning management with auto-moderation
- **Blacklist System** - Ban users from using the bot entirely
- **Auto-Moderation** - Automatic timeouts and bans based on warning thresholds
- **Role Hierarchy** - Respects server role permissions

### 🌸 **Games & Entertainment**
- **Connect 4** - Visual canvas-based Connect 4 with interactive buttons
- **Chess** - Full chess game with visual board rendering
- **Interactive UI** - Button-based game controls

### 🌸 **User Tracking**
- **Activity Monitoring** - Track user messages, uploads, and links
- **Command Usage** - Monitor most used commands
- **Channel Analytics** - Find users' favorite channels
- **Persistent Storage** - All data saved with quick.db

### 🌸 **Visual Design**
- **Canvas Integration** - Beautiful game boards and graphics
- **Rich Embeds** - Colorful, informative message embeds
- **Humorous Error Messages** - Entertaining error responses with GIFs

</div>

## 🌸 Quick Start

<div style="background: rgba(255, 255, 255, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">

### Prerequisites
- Node.js v16 or higher
- npm or yarn package manager
- Discord Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lxyoo/SC-BOT.git
   cd lumic-bot

   ```

2. **Install dependencies**
   ```bash
   npm install

   ```

3. **Setup configuration**
   ```json
   // slappey.json
   {
     "token": "YOUR_BOT_TOKEN",
     "prefix": "~"
   }

   ```

4. **Run the bot**
   ```bash
   npm start

   ```

</div>

## 🌸 Commands

<div style="background: rgba(255, 255, 255, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">

### 🌸 Moderation Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `~warn add` | Add a warning to a user | `~warn add @user [reason]` |
| `~warn remove` | Remove a specific warning | `~warn remove @user <id>` |
| `~warn list` | List all warnings for a user | `~warn list @user` |
| `~warn clear` | Clear all warnings | `~warn clear @user` |
| `~warn info` | Get detailed warning info | `~warn info @user [id]` |
| `~blacklist add` | Blacklist a user | `~blacklist add @user [reason]` |
| `~blacklist remove` | Remove from blacklist | `~blacklist remove @user` |
| `~blacklist list` | List all blacklisted users | `~blacklist list` |
| `~blacklist check` | Check if user is blacklisted | `~blacklist check @user` |

### 🌸 Game Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `~connect4` | Start a Connect 4 game | `~connect4 @opponent` |
| `~chess` | Start a chess game | `~chess @opponent` |

### 🌸 Fun Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `~fate` | Discover your inevitable doom | `~fate` |
| `~profile` | View user profile/stats | `~profile [@user]` |

</div>

## 🌸 Configuration

<div style="background: rgba(255, 255, 255, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">

### Auto-Moderation Settings
- **3 warnings** → 24-hour timeout
- **5 warnings** → Permanent ban
- **Customizable thresholds** in code

### Permissions Required
- `MANAGE_MESSAGES` - For warning system
- `MODERATE_MEMBERS` - For timeouts
- `BAN_MEMBERS` - For auto-ban feature
- `ADMINISTRATOR` - For blacklist system

</div>

## 🌸 Built With

<div style="background: rgba(255, 255, 255, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">

- **[Discord.js](https://discord.js.org)** - Discord API wrapper
- **[Canvas](https://www.npmjs.com/package/canvas)** - Visual game rendering
- **[Quick.db](https://www.npmjs.com/package/quick.db)** - Simple database solution
- **[Node.js](https://nodejs.org)** - JavaScript runtime

</div>

## 🌸 Contributing

<div style="background: rgba(255, 255, 255, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

</div>

## 🌸 License

<div style="background: rgba(255, 255, 255, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

</div>

## 🌸 Special Features

<div style="background: rgba(255, 255, 255, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">

### 🌸 **Visual Games**
- Canvas-rendered game boards
- Interactive button controls
- Real-time game state updates

### 🌸 **Humor System**
- Entertaining error messages
- Personality-filled responses
- GIF integration for errors

### 🌸 **Analytics**
- User activity tracking
- Command usage statistics
- Channel popularity metrics

### 🌸 **Security**
- Role hierarchy respect
- Permission validation
- Blacklist system protection

</div>

## 🌸 Acknowledgments

<div style="background: rgba(255, 255, 255, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">

- Discord.js community for excellent documentation
- Canvas library for game rendering capabilities
- All contributors who helped improve Lumic

</div>

</div>

---

<div align="center" style="background: linear-gradient(135deg, #ff69b4, #ffb6c1, #ffc0cb); padding: 20px; border-radius: 15px; margin: 20px 0;">
  <b>Made with 🌸 by Quinn</b>
  
  [Report Bug](https://github.com/lxyoo/SC-BOT/issues) • [Request Feature](https://github.com/lxyoo/SC-BOT/issues)
</div>