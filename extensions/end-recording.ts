import { SlashCommandBuilder } from "@discordjs/builders";
import { getVoiceConnection } from "@discordjs/voice";
import fs from "node:fs";
import { exec } from "child_process";

const command = new SlashCommandBuilder()
  .setName("end-recording")
  .setDescription("Ends recording a new session.")
  .addStringOption((builder) => {
    return builder
      .setName("recording-id")
      .setDescription("The recording ID.")
      .setRequired(true);
  });

export default {
  data: command,
  async execute(client: any, interaction: any) {
    const recordingId =
      interaction.options.get("recording-id")?.value ?? "null";
    if (client.recordings[recordingId] == undefined) {
      return await interaction.reply({
        content: `Recording ID ${recordingId} not found.`,
      });
    }
    let connection = getVoiceConnection(interaction.guild.id);
    if (connection) {
      connection.destroy();
      await new Promise<void>((resolve, reject) => {
        setTimeout(resolve, 750);
      });
      const startedAt = client.recordingStartedAt[recordingId];
      let recordings = [];
      for (const recording of client.recordings[recordingId]) {
        recordings.push({
          filePath: recording.filePath,
          startTime: recording.startTime - startedAt,
        });
      }
      recordings = recordings.sort((a, b) => a.startTime - b.startTime);
      if (recordings.length < 1) {
        return;
      }
      const json = JSON.stringify(recordings);
      const filename = `overlayData/${recordingId}.json`;
      fs.writeFileSync(filename, json, "utf8");
      await interaction.reply({
        content: `Recording ID ${recordingId} has been ended.`,
      });
      exec(
        `python3 overlayAudioFiles.py ${filename} ${recordingId}`,
        async (err, stdout, stderr) => {
          console.log("test");
          let audioFileInfo = JSON.parse(
            fs.readFileSync("data/audioFileInfo.json", "utf8")
          );
          audioFileInfo.push({
            recordingId: recordingId,
            time: Date.now(),
            userId: interaction.user.id,
            guildId: interaction.guild.id,
          });
          fs.writeFileSync(
            "data/audioFileInfo.json",
            JSON.stringify(audioFileInfo),
            "utf8"
          );
          let channelInfo = JSON.parse(
            fs.readFileSync("data/channelInfo.json", "utf8")
          );
          let channel = channelInfo[interaction.guild.id];
          if (channel == undefined) {
            return;
          }
          channel = interaction.guild.channels.cache.get(channel);
          try {
            await channel.send({
              content: `Recording ${recordingId} has been processed. (Recorded By ${interaction.user.tag})`,
              files: [`finalOutput/${recordingId}.mp3`],
            });
          } catch (e) {
            console.log(e);
          }
        }
      );
    } else {
    }
  },
};
