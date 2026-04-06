import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const projectRoot = path.resolve(currentDirPath, "..");
const cacheTargets = [".next"];

const removedTargets = [];

for (const target of cacheTargets) {
  const targetPath = path.join(projectRoot, target);

  if (!fs.existsSync(targetPath)) {
    continue;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  removedTargets.push(target);
}

if (removedTargets.length === 0) {
  console.log("Nenhum cache do Next para limpar.");
  process.exit(0);
}

console.log(`Cache limpo: ${removedTargets.join(", ")}`);