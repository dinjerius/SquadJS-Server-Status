import tinygradient from 'tinygradient';
import { COPYRIGHT_MESSAGE } from '../utils/constants.js';
import DiscordBaseMessageUpdater from './discord-base-message-updater.js';

export default class DiscordServerStatus extends DiscordBaseMessageUpdater {
  static get description() {
    return 'The <code>DiscordServerStatus</code> plugin can be used to get the server status in Discord.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBaseMessageUpdater.optionsSpecification,
      command: {
        required: false,
        description: 'Command name to get message.',
        default: '!status'
      },
      updateInterval: {
        required: false,
        description: 'How frequently to update the time in Discord.',
        default: 60 * 1000
      },
      setBotStatus: {
        required: false,
        description: "Whether to update the bot's status with server information.",
        default: true
      },
      channelId: {
        required: true,
        description: 'The ID of the channel where the status message will be updated.',
        default: null
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.updateMessages = this.updateMessages.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.targetMessageId = null;
  }

  async mount() {
    await super.mount();
    this.updateInterval = setInterval(this.updateMessages, this.options.updateInterval);
    this.updateStatusInterval = setInterval(this.updateStatus, this.options.updateInterval);
  }

  async unmount() {
    await super.unmount();
    clearInterval(this.updateInterval);
    clearInterval(this.updateStatusInterval);
  }

  async updateMessages() {
    const channel = this.options.discordClient.channels.cache.get(this.options.channelId);
    if (!channel) {
      console.error('Channel not found!');
      return;
    }

    const messageContent = await this.generateMessage();

    // Ilk mesaj g�nderildiyse g�ncelle, degilse yeni bir mesaj g�nder.
    if (this.targetMessageId) {
      try {
        const message = await channel.messages.fetch(this.targetMessageId);
        await message.edit(messageContent);
      } catch (err) {
        console.error('Failed to fetch or edit the message:', err);
        this.targetMessageId = null; // Eger mesaj bulunamazsa ID sifirlanir.
      }
    }

    if (!this.targetMessageId) {
      const message = await channel.send(messageContent);
      this.targetMessageId = message.id; // Mesaj ID'si kaydedilir.
    }
  }

  async generateMessage() {
    // Ayni kod blogunu generateMessage islevine dahil ettik
    let players = '';

    players += `${this.server.a2sPlayerCount}`;
    if (this.server.publicQueue + this.server.reserveQueue > 0)
      players += ` (+${this.server.publicQueue + this.server.reserveQueue})`;

    players += ` / ${this.server.publicSlots}`;
    if (this.server.reserveSlots > 0) players += ` (+${this.server.reserveSlots})`;

    const layerName = this.server.currentLayer
      ? this.server.currentLayer.name
      : (await this.server.rcon.getCurrentMap()).layer;

    const ratio = this.server.a2sPlayerCount / (this.server.publicSlots + this.server.reserveSlots);
    const clampedRatio = Math.min(1, Math.max(0, ratio));

    const color = parseInt(
      tinygradient([
        { color: '#ff0000', pos: 0 },
        { color: '#ffff00', pos: 0.5 },
        { color: '#00ff00', pos: 1 }
      ])
        .rgbAt(clampedRatio)
        .toHex(),
      16
    );

    const embedobj = {
      title: this.server.serverName,
      fields: [
        {
          name: 'Players',
          value: players
        },
        {
          name: 'Current Layer',
          value: `\`\`\`${layerName || 'Unknown'}\`\`\``,
          inline: true
        },
        {
          name: 'Next Layer',
          value: `\`\`\`${
            this.server.nextLayer?.name ||
            (this.server.nextLayerToBeVoted ? 'To be voted' : 'Unknown')
          }\`\`\``,
          inline: true
        }
      ],
      color: color,
      footer: { text: COPYRIGHT_MESSAGE },
      timestamp: new Date(),
      image: {
        url: this.server.currentLayer
          ? `https://raw.githubusercontent.com/Squad-Wiki/squad-wiki-pipeline-map-data/master/completed_output/_Current%20Version/images/${this.server.currentLayer.layerid}.jpg`
          : undefined
      }
    };

    return { embeds: [embedobj] };
  }

  async updateStatus() {
    if (!this.options.setBotStatus) return;

    await this.options.discordClient.user.setActivity(
      `(${this.server.a2sPlayerCount}/${this.server.publicSlots}) ${
        this.server.currentLayer?.name || 'Unknown'
      }`,
      { type: 4 }
    );
  }
}
