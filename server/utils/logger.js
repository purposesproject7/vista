import fs from "fs";
import path from "path";
import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, colorize, json } = format;

const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const consoleFormat = combine(
  colorize(),
  timestamp(),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  }),
);

export const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    new transports.Console({ format: consoleFormat }),
    new transports.File({
      filename: "logs/combined.log",
      format: combine(timestamp(), json()),
    }),
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      format: combine(timestamp(), json()),
    }),
  ],
  exitOnError: false,
});

export function safeMeta(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { note: "unserializable_meta" };
  }
}
