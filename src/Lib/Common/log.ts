import * as fs from "fs";
import { createLogger, format, transports } from "winston";
import * as DailyRotateFile from "winston-daily-rotate-file";
import { AppSettings } from "../../AppSettings";

export class Log {
  // env = process.env._Env || 'development';  --If env variable is set

  static logdir = AppSettings.logpath;

  //logs to the file everyday
  static logger() {
    if (!fs.existsSync(this.logdir)) {
      fs.mkdirSync(this.logdir);
    }

    let logger = createLogger({
      level: "info",
      format: format.combine(
        format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss"
        }),
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
      transports: [
        new transports.Console({
          level: "info",
          format: format.combine(
            format.combine(
              format.colorize(),
              format.printf(
                info => `${info.timestamp} ${info.level}: ${info.message}`
              )
            )
          )
        }),
        new DailyRotateFile({
          filename: `${this.logdir}/%DATE%.log`,
          datePattern: "YYYY-MM-DD",
          level: "info",
          handleExceptions: true
        })
      ],
      exitOnError: true
    });

    return logger;
  }
}
