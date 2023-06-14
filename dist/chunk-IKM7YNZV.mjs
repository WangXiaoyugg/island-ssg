import {
  __dirname
} from "./chunk-YZ4JLWLQ.mjs";

// src/node/constants/index.ts
import * as path from "path";
var PACKAGE_ROOT = path.join(__dirname, "..");
var CLIENT_ENTRY_PATH = path.join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "client-entry.tsx"
);
var SERVER_ENTRY_PATH = path.join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "ssr-entry.tsx"
);
var DEFAULT_TEMPLATE_PATH = path.join(PACKAGE_ROOT, "template.html");

export {
  PACKAGE_ROOT,
  CLIENT_ENTRY_PATH,
  SERVER_ENTRY_PATH,
  DEFAULT_TEMPLATE_PATH
};
