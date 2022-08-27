import fs from "node:fs";
import chalk from "chalk";
import moment from "moment";

export class Logging {
  file: string;
  constructor(file: string) {
    this.file = file;
    this.appendFile("\n<br/>");
    this.appendFile(
      `<div style="color: #33b1e8;">INFO ${Math.round(
        Date.now() / 1000
      )} (${this.getTime()}): New session started </div>`
    );
  }
  appendFile = (data: any) => {
    fs.appendFileSync(this.file, data);
  };
  getTime = () => {
    return moment.utc().format("YYYY-MM-DD HH:mm:ss");
  };
  info(message: string) {
    console.log(
      chalk.blueBright(
        `INFO ${Math.round(Date.now() / 1000)} (${this.getTime()}): ${message}`
      )
    );
    this.appendFile(
      `<div style="color: #33b1e8;">INFO ${Math.round(
        Date.now() / 1000
      )} (${this.getTime()}): ${message}</div>`
    );
  }

  error(message: string) {
    console.log(chalk.redBright(`ERRR: ${message}`));
    this.appendFile(
      `<div style="color: #e83333;">ERRR ${Math.round(
        Date.now() / 1000
      )} (${this.getTime()}): ${message.toString()}</div>`
    );
  }

  debug(message: string) {
    console.log(chalk.yellowBright(`DEBG: ${message}`));
    this.appendFile(
      `<div style="color: #84e833;">DEBG ${Math.round(
        Date.now() / 1000
      )} (${this.getTime()}): ${message}</div`
    );
  }

  warn(message: string) {
    console.log(chalk.greenBright(`WARN: ${message}`));
    this.appendFile(
      `<div style="color: #d5e833;">WARN ${Math.round(
        Date.now() / 1000
      )} (${this.getTime()}): ${message}</div>`
    );
  }
}
