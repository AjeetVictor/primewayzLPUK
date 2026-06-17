import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const imageRoot = path.resolve("public/images");

const convertibleExtensions = new Set([".jpg", ".jpeg", ".png"]);
const neverConvertExtensions = new Set([
  ".svg",
  ".gif",
  ".webp",
  ".mp4",
  ".webm",
  ".mov",
  ".avi",
  ".mkv"
]);

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function toWebpPath(filePath) {
  return filePath.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

async function convertToWebp(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (neverConvertExtensions.has(ext) || !convertibleExtensions.has(ext)) {
    return {
      status: "skipped",
      filePath,
      reason: "not-jpg-jpeg-png"
    };
  }

  const outputPath = toWebpPath(filePath);
  const sourceStat = await fs.stat(filePath);
  const outputExists = await pathExists(outputPath);

  if (outputExists) {
    const outputStat = await fs.stat(outputPath);

    if (outputStat.mtimeMs >= sourceStat.mtimeMs) {
      return {
        status: "up-to-date",
        filePath,
        outputPath,
        sourceSize: sourceStat.size,
        outputSize: outputStat.size
      };
    }
  }

  await sharp(filePath)
    .rotate()
    .webp({
      quality: ext === ".png" ? 88 : 82,
      effort: 6
    })
    .toFile(outputPath);

  const outputStat = await fs.stat(outputPath);

  return {
    status: "converted",
    filePath,
    outputPath,
    sourceSize: sourceStat.size,
    outputSize: outputStat.size
  };
}

function formatKb(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

async function main() {
  if (!(await pathExists(imageRoot))) {
    console.log(`[images:optimize] Folder not found: ${imageRoot}`);
    process.exit(0);
  }

  const files = await walk(imageRoot);
  const results = [];

  for (const file of files) {
    results.push(await convertToWebp(file));
  }

  const converted = results.filter((item) => item.status === "converted");
  const upToDate = results.filter((item) => item.status === "up-to-date");
  const skipped = results.filter((item) => item.status === "skipped");

  console.log("");
  console.log("=== IMAGE OPTIMIZATION SUMMARY ===");
  console.log(`Converted : ${converted.length}`);
  console.log(`Up-to-date: ${upToDate.length}`);
  console.log(`Skipped   : ${skipped.length}`);
  console.log("");

  for (const item of converted) {
    console.log(
      `[converted] ${path.relative(process.cwd(), item.filePath)} -> ${path.relative(process.cwd(), item.outputPath)} (${formatKb(item.sourceSize)} -> ${formatKb(item.outputSize)})`
    );
  }

  if (converted.length === 0) {
    console.log("No new JPG/JPEG/PNG images needed conversion.");
  }
}

main().catch((error) => {
  console.error("[images:optimize] Failed:", error);
  process.exit(1);
});
