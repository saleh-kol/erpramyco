const fs = require("fs");
const path = require("path");

const root = (...p) => path.join(process.cwd(), ...p);
const standalone = root(".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.log("standalone یافت نشد — رد شد");
  process.exit(0);
}

fs.cpSync(root("public"), path.join(standalone, "public"), { recursive: true });
fs.cpSync(root(".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });

console.log("✅ public و static به standalone کپی شد");