import fs from "fs";
import path from "path";

const srcDir = path.join(process.cwd(), "src");
const files = [];

function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(tsx|ts|jsx|js)$/.test(item)) files.push(full);
  }
}

walk(srcDir);

const links = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const regexes = [
    /to=["'`]([^"'`]+)["'`]/g,
    /href=["'`]([^"'`]+)["'`]/g,
    /navigate\(["'`]([^"'`]+)["'`]\)/g,
  ];

  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(text))) {
      links.push({
        file: path.relative(process.cwd(), file),
        link: match[1],
      });
    }
  }
}

console.table(links);
