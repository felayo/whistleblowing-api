import { format } from "date-fns";
import { v4 as uuid } from "uuid";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss");
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    const logsDir = path.join(__dirname, "..", "logs");

    if (!fs.existsSync(logsDir)) {
      await fsPromises.mkdir(logsDir, { recursive: true });
    }

    const logPath = path.join(logsDir, logFileName);
    await fsPromises.appendFile(logPath, logItem);
  } catch (err) {
    console.error("Logging error:", err);
  }
};

export const logger = (req, res, next) => {
  logEvents(
    `${req.method}\t${req.url}\t${req.headers.origin || "no-origin"}`,
    "reqLog.log"
  );
  console.log(`${req.method} ${req.path}`);
  next();
};
