import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

const cache = new Map<string, unknown>();

export async function loadData<T>(file: string): Promise<T> {
  const cached = cache.get(file);
  if (cached) return cached as T;

  const raw = await readFile(path.join(dataDir, file), "utf-8");
  const parsed = JSON.parse(raw) as T;
  cache.set(file, parsed);
  return parsed;
}
