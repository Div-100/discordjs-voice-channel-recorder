import dotenv from "dotenv";
dotenv.config();
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import inquirer from "inquirer";
import fs from "node:fs";
let commands;

const handle = async (err, files) => {
  commands = {
    noParentDirectory: [],
  };
  files.forEach(function (file) {
    if (file.isDirectory()) {
      commands[file.name] = fs
        .readdirSync(`./build/extensions/${file.name}`)
        .filter((x) => !x.startsWith("_") && x.endsWith("js"));
      console.log(files)
    } else {
      commands.noParentDirectory.push(file.name);
      console.log(files)
    }
  });
  inquirer
    .prompt([
      {
        type: "list",
        name: "register",
        message: "How do you want to register",
        choices: ["All guilds", "Only Testing guilds"],
      },
      {
        type: "checkbox",
        name: "modules",
        message: "Which modules do you want to load?",
        choices: Object.keys(commands),
      },
      {
        type: "list",
        name: "bot",
        message: "Which bot is this for",
        choices: ["Testing", "Main"],
      },
    ])
    .then(async (answers) => {
      let syncFor;
      switch (answers.register) {
        case "All guilds":
          syncFor = "all";
        case "Only Testing guilds":
          syncFor = "testing";
      }
      await syncCommands(syncFor, answers.modules, answers.bot);
    });
};

const clientIds = {
  main: "12345678645678", // CHANGE
  testing: "816883567019819008",
};
const syncCommands = async (guilds, modules, bot) => {
  console.log('modules', modules)
  const clientId = clientIds[bot.toLowerCase()];
  const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
  let _commands = [];
  console.log(commands)
  for (const entry of Object.entries(commands)) {
    if (!modules.includes(entry[0])) {
      continue;
    }
    entry[1].forEach((command) => {
      if (entry[0] == "noParentDirectory") {
        _commands.push(`./build/extensions/${command}`);
      } else {
        _commands.push(`./build/extensions/${entry[0]}/${command}`);
      }
    });
  }

  commands = _commands;
  _commands = [];
  const _handle = async () => {
    commands = _commands;

    console.log(commands);
    console.info("Syncing commands");
    let guildId = "881816860398616576";
    if (guilds === "all") {
      await rest.put(Routes.applicationGuildCommands(clientId), {
        body: commands,
      });
    } else {
      await rest
        .put(Routes.applicationGuildCommands(clientId, guildId), {
          body: commands,
        })
        .then(() => {
          console.info("Synced commands");
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };
  
  new Promise(async (resolve, reject) => {
    for (const command of commands) {
      import(command).then((_command) => {
        console.log(_command);
        _commands.push(_command.default.data.toJSON());
      });
    }
    setTimeout(_handle, 1000);
  });
};

fs.readdir("./build/extensions", { withFileTypes: true }, async function (err, files) {
  await handle(err, files);
});
