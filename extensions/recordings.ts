import {
  ActionRowBuilder,
  ButtonBuilder,
  SlashCommandBuilder,
} from "@discordjs/builders";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import fs from "node:fs";
import moment from "moment";

const command = new SlashCommandBuilder()
  .setName("recordings")
  .setDescription("Show all recordings.");

export default {
  data: command,
  async execute(client: any, interaction: any) {
    let length = 0;
    const recordings = JSON.parse(
      fs.readFileSync("data/audioFileInfo.json", "utf8")
    ).filter((x: any) => {
      length++;

      return x.guildId == interaction.guild.id && length < 50;
    });

    let embeds: any = [];
    
    var a = [...recordings];
    while (a.length) {
      embeds.push(a.splice(0, 5));
    }

    let components = embeds.map((x: any) => {
      let e = [];
      for (const y of x) {
        e.push(
          new MessageButton()
            .setLabel(y.recordingId)
            .setCustomId(y.recordingId)
            .setStyle("PRIMARY")
        );
      }
      return new MessageActionRow().addComponents(e);
    });
    const baseComponents = new MessageActionRow().addComponents([
      new MessageButton()
        .setLabel("⬅️")
        .setCustomId("left")
        .setStyle("SUCCESS"),
      new MessageButton()
        .setLabel("➡️")
        .setCustomId("right")
        .setStyle("SUCCESS"),
    ]);
    let page = 0;
    let _embeds: any = [];
    for (let _page: number = 0; _page < components.length; _page++) {
      console.log(_embeds);
      let embedData = embeds[_page];
      let embed = new MessageEmbed().setTitle(
        `Recordings for ${interaction.guild.name} (Page ${_page + 1})`
      );
      for (const data of embedData) {
        embed.addField(
          data.recordingId,
          `
Time: ${moment.unix(data.time / 1000).format("YYYY-MM-DD HH:mm:ss")}
User: ${data.userId}
`
        );
      }
      _embeds.push(embed);
    }
    embeds = _embeds;
    console.log(embeds);
    console.log(components);
    console.log(baseComponents);

    let message = await interaction.reply({
      embeds: [embeds[0]],
      components: [baseComponents, components[0]],
    });

    client.waitFor(
      "interactionCreate",
      (data: any) => {
        return data.interaction.isButton();
      },
      async (client: any, data: any) => {
        const _interaction = data.interaction;
        console.log(_interaction);
        // await _interaction.deferUpdate();
        switch (_interaction.customId) {
          case "right":
            if (page != embeds.length - 1) page++;
            else page = 0;
            break;
          case "left":
            if (page != 0) page--;
            else page = embeds.length - 1;
            break;
          default:
            const recordingId = _interaction.customId;
            console.log("aaaaa");
            console.log(recordings)
            const recording = recordings.filter(
              (x: any) => x.recordingId == recordingId
            )[0];
            console.log(recording);
            await interaction.channel.send({
              content: recordingId,
              files: [`finalOutput/${recordingId}.mp3`],
            });
            break;
        }
        await interaction.editReply({
          embeds: [embeds[page]],
          components: [baseComponents, components[page]],
        });
      }
    );
  },
};
