const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const duplicates = ids.filter((value, index) => ids.indexOf(value) !== index);
console.log("html ids:", ids.length, "| duplicates:", duplicates.length ? duplicates.join(", ") : "none");

const js = fs.readFileSync("main.js", "utf8");
const referenced = [...js.matchAll(/pick\("#([A-Za-z0-9_-]+)"\)/g)].map((m) => m[1]);
const missing = [...new Set(referenced)].filter((id) => !ids.includes(id));
console.log("ids used by main.js:", new Set(referenced).size, "| missing in html:", missing.length ? missing.join(", ") : "none");

const css = fs.readFileSync("styles.css", "utf8");
console.log("styles.css braces balanced:", (css.match(/{/g) || []).length === (css.match(/}/g) || []).length);

const images = [...html.matchAll(/(?:src|data-full)="([^"]+\.(?:jpg|png|svg))"/g)].map((m) => m[1]);
const notFound = [...new Set(images)].filter((file) => !fs.existsSync(file));
console.log("image references:", new Set(images).size, "| missing on disk:", notFound.length ? notFound.join(", ") : "none");

const cards = [...html.matchAll(/data-category="([^"]+)"/g)].map((m) => m[1]);
console.log("gallery cards:", cards.length);
