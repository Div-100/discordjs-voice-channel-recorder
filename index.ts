import { Client, Intents, Collection } from "discord.js";
import dotenv from "dotenv";
import { Logging } from "./logging.js";
import fs from "node:fs";
import inquirer from "inquirer";

const logging = new Logging("./logs/logs.html");
dotenv.config();
const intents = new Intents().add(
  Intents.FLAGS.DIRECT_MESSAGES,
  Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_BANS,
  Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
  Intents.FLAGS.GUILD_INTEGRATIONS,
  Intents.FLAGS.GUILD_INVITES,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_PRESENCES,
  Intents.FLAGS.GUILD_VOICE_STATES,
  Intents.FLAGS.GUILD_WEBHOOKS
);

class CustomClient extends Client {
  logging: any;
  commands: any;
  mode: any;
  waitForWaits: Array<any> = [];
  owner_ids: Array<string> = ["554611266769911826", "699543638765731892"];
  listeningTo: Array<string> = [];
  recordings: Recordings = {};
  recordingStartedAt: {
    [k: string]: number;
  } = {};

  waitFor = async (event: string, check: Function, callback: Function) => {
    /*
    Waits for an event to be triggered, then runs a callback.
    events accepted - interactionCreate
    check - a function which specifies whether the callback should be called
      Parameters - 
        data - type: object
      Returns - type: boolean (true/false)
    callback - a function which is called when the event is triggered
      Parameters -
        icaria - type: Client  
        data - type: object      
     */
    this.waitForWaits.push({ event: event, check: check, callback: callback });
  };
}

const client = new CustomClient({ intents: intents });
client.logging = logging;
client.commands = new Collection();

interface Commands {
  noParentDirectory: Array<any>;
  [k: string]: any;
}

type RecordingArrayValue = {
  userId?: string;
  filePath?: string;
  startTime?: number;
  endTime?: number;
};

interface Recordings {
  [k: string]: Array<RecordingArrayValue>;
}

let commands: Commands = {
  noParentDirectory: [],
};

fs.readdir(
  "./build/extensions",
  { withFileTypes: true },
  async function (err, files) {
    if (err) {
      console.log(err);
    }
    await handle(err, files);
  }
);

const handle = async (err: any, files: Array<fs.Dirent>) => {
  files.forEach(function (file) {
    if (file.isDirectory()) {
      commands[file.name] = fs
        .readdirSync(`./build/extensions/${file.name}`)
        .filter((x) => !x.startsWith("_") && x.endsWith("js"));
    } else {
      commands.noParentDirectory.push(file.name);
    }
  });
  let _commands: Array<any> = [];
  new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      for (const entry of Object.entries(commands)) {
        entry[1].forEach((command: any) => {
          if (entry[0] == "noParentDirectory") {
            _commands.push(`./extensions/${command}`);
          } else {
            _commands.push(`./extensions/${entry[0]}/${command}`);
          }
        });
      }

      resolve();
    }, 500)
  )
    .then(() => {
      for (let command of _commands) {
        import(command).then((module) => {
          client.commands.set(module.default.data.name, module.default);
        });
      }

      client.on("interactionCreate", async (interaction) => {
        if (client.mode == "dev") {
          if (!client.owner_ids.includes(interaction.user.id)) {
            return;
          }
        }
        client.waitForWaits
          .filter(
            (x) =>
              x.event == `interactionCreate` &&
              x.check({ interaction: interaction })
          )
          .forEach((x) => x.callback(client, { interaction: interaction }));

        if (interaction.isButton()) {
          for (let module of client.commands.entries()) {
            module = module[1];
            if (Object.keys(module).includes("buttonInteractionEvent")) {
              new Promise<void>((resolve, reject) => {
                module.buttonInteractionEvent(client, interaction);
                if (resolve) {
                  resolve();
                }
              });
            }
          }
        }
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
          await command.execute(client, interaction);
        } catch (error) {
          console.error(error);
          await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        }
      });

      client.on("ready", () => {
        client.logging.info(`Logged in as ${client?.user?.tag}.`);
      });
    })
    .then(() => {
      inquirer
        .prompt([
          {
            type: "list",
            name: "mode",
            message: "Select a mode Icaria to boot into?",
            choices: [
              "Develop (Only Developers can run commands)",
              "PBT (All users can run commands)",
              "SafeMode (Only commands which are necessary (eval, load, unload, reload) can be run)",
            ],
          },
        ])
        .then((answers: any) => {
          switch (answers.mode) {
            case "Develop (only developers can run commands)":
              client.mode = "dev";
              break;
            case "PBT (all users can run commands)":
              client.mode = "production";
              break;
            case "SafeMode (Only commands which are necessary (eval, load, unload, reload) can be run)":
              for (const command of client.commands) {
                if (
                  !["eval", "load", "unload", "reload"].includes(command[0])
                ) {
                  client.commands.delete(command[0]);
                }
              }
              client.mode = "devcommands";
              break;
          }
        })
        .then(async () => {
          client.logging.info("Logging into the bot.");
          client.login(process.env.TOKEN);
        });
    });
};
