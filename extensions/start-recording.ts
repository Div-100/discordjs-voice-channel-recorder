import { SlashCommandBuilder } from "@discordjs/builders";
import {
  getVoiceConnection,
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { createListeningStream } from "../utilities/createListeningStream.js";
import { randomUUID } from "node:crypto";

const command = new SlashCommandBuilder()
  .setName("start-recording")
  .setDescription("Starts recording a new session.");

export default {
  data: command,
  async execute(client: any, interaction: any) {
    let connection = getVoiceConnection(interaction.guild.id);
    let uniqueId = randomUUID();
    client.recordings[uniqueId] = [];
    client.recordingStartedAt[uniqueId] = Date.now();
    if (connection) {
    } else {
      if (interaction.member.voice.channel) {
        const channel = interaction.member.voice.channel;
        connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          selfDeaf: false,
          selfMute: true,
          adapterCreator: channel.guild.voiceAdapterCreator,
        });

        try {
          await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
          const receiver = connection.receiver;

          receiver.speaking.on("start", (userId) => {
            console.log(client.listeningTo);
            if (client.listeningTo.includes(userId)) {
              return;
            }
            console.log("started");
            client.listeningTo.push(userId);
            createListeningStream(
              receiver,
              userId,
              client,
              uniqueId,
              client.users.cache.get(userId)
            );
          });
        } catch (error) {
          console.log(error);
        }
      }
    }
    await interaction.reply({
      content: `Started recording Recording ID: ${uniqueId}`,
    });
  },
};
