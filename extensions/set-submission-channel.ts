import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelTypes } from "discord.js/typings/enums";
import fs from "node:fs";

const command = new SlashCommandBuilder()
  .setName("set-submission-channel")
  .setDescription("Sets the channel to post submissions to.")
  .addChannelOption((builder) =>
    builder.setName("channel").setDescription("The channel").setRequired(true)
  );

export default {
  data: command,
  async execute(client: any, interaction: any) {
    const channel = interaction.options.get("channel")?.channel ;
    
    if (!channel.isText()) {
      return await interaction.reply({
        content: "Channel must be a text channel.",
      });
    }
    const channelInfo = JSON.parse(
      fs.readFileSync("data/channelInfo.json", "utf8")
    );
    channelInfo[interaction.guild.id] = channel.id;
    fs.writeFileSync("data/channelInfo.json", JSON.stringify(channelInfo));
    await interaction.reply({content: "Channel has been set."});
  },
};
