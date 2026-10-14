const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");

const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr", "path", "circle", "ellipse", "rect", "line", "polygon", "polyline", "stop", "use"]);
const stack = [];
const problems = [];

const tagPattern = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
let match;

while ((match = tagPattern.exec(html)) !== null) {
  const closing = match[1] === "/";
  const name = match[2].toLowerCase();
  const attrs = match[3];

  if (name === "!doctype") {
    continue;
  }
  if (voidTags.has(name) || attrs.trim().endsWith("/")) {
    continue;
  }
  if (!closing) {
    stack.push({ name, index: match.index });
  } else {
    const top = stack.pop();
    if (!top) {
      problems.push("stray closing </" + name + ">");
    } else if (top.name !== name) {
      problems.push("expected </" + top.name + "> but found </" + name + ">");
    }
  }
}

if (stack.length) {
  problems.push("unclosed: " + stack.map((entry) => entry.name).join(", "));
}

console.log("tag balance:", problems.length ? problems.join(" | ") : "OK");

const svgOpen = (html.match(/<svg/g) || []).length;
const svgClose = (html.match(/<\/svg>/g) || []).length;
const figureOpen = (html.match(/<figure/g) || []).length;
const figureClose = (html.match(/<\/figure>/g) || []).length;
console.log("svg tags:", svgOpen, "/", svgClose, "| figure tags:", figureOpen, "/", figureClose);

const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const brokenAnchors = [...new Set(anchors)].filter((id) => !ids.includes(id));
console.log("in-page anchors:", new Set(anchors).size, "| broken:", brokenAnchors.length ? brokenAnchors.join(", ") : "none");

const noAlt = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).filter((tag) => !/alt=/.test(tag));
console.log("images without alt:", noAlt.length);
