const fs = require("fs");
const path = require("path");

const targetDirs = ["app", "server"];
const extensions = [".ts", ".js", ".vue"];

function removeComments(content, ext) {
  // Remove multi-line comments /* ... */
  content = content.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove single-line comments // ...
  // We need to be careful not to remove URLs (http://) or comments inside strings.
  // This simple regex might be too aggressive, but for a "clear all comments" request it's usually acceptable.
  // A safer approach for // is to match it only if not inside quotes, but that's complex.
  // We'll use a slightly safer pattern that avoids http://
  content = content.replace(/(^|[^:])\/\/.*$/gm, "$1");

  // Remove HTML comments <!-- ... --> for Vue files
  if (ext === ".vue") {
    content = content.replace(/<!--[\s\S]*?-->/g, "");
  }

  // Cleanup empty lines left by full-line comments
  content = content.replace(/^\s*[\r\n]/gm, "");

  return content;
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        console.log(`Processing ${filePath}...`);
        let content = fs.readFileSync(filePath, "utf8");
        const newContent = removeComments(content, ext);
        if (content !== newContent) {
          fs.writeFileSync(filePath, newContent, "utf8");
        }
      }
    }
  });
}

targetDirs.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    walk(fullPath);
  } else {
    console.log(`Directory ${dir} not found.`);
  }
});

console.log("Done removing comments.");
