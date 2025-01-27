# SquadJS-Server-Status
This repository extends **SquadJS** with a feature to post server status updates to a specified Discord channel. It's an enhancement of the `DiscordServerStatus` plugin, allowing real-time status updates of your server to be shared on Discord.

---

## Features

- Automatically posts server status updates (e.g., server population, uptime) to a designated Discord channel.
- Customizable update interval.
- Option to update the Discord bot's status based on the server's state.
- Fully integrated with SquadJS's plugin architecture.

---

## Installation

1. Clone or download this repository.
2. Move to plugins folder.


## Configuration

- Open config.json and ensure the DiscordServerStatus plugin is enabled:

```json
{
  "plugin": "DiscordServerStatus",
  "enabled": true,
  "discordClient": "discord",
  "channelID": "YOUR_DISCORD_CHANNEL_ID",
  "updateInterval": 60000,
  "setBotStatus": true
}
```
