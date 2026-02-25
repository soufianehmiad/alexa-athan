import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

export class JsonFileStore {
  constructor(filePath) {
    if (typeof filePath !== "string" || filePath.trim().length === 0) {
      throw new Error("filePath is required.");
    }

    this.filePath = filePath;
  }

  exists() {
    try {
      readFileSync(this.filePath, "utf8");
      return true;
    } catch {
      return false;
    }
  }

  read() {
    const raw = readFileSync(this.filePath, "utf8");
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error(`Failed to parse JSON store at ${this.filePath}: ${error.message}`);
    }
  }

  write(data) {
    const directory = path.dirname(this.filePath);
    mkdirSync(directory, { recursive: true });

    const tempPath = `${this.filePath}.tmp`;
    writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
    renameSync(tempPath, this.filePath);
  }

  clear() {
    rmSync(this.filePath, { force: true });
  }
}
