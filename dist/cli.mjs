// node_modules/.pnpm/registry.npmmirror.com+tsup@6.7.0_ts-node@10.9.1_typescript@5.0.4/node_modules/tsup/assets/esm_shims.js
import { fileURLToPath } from "url";
import path from "path";
var getFilename = () => fileURLToPath(import.meta.url);
var getDirname = () => path.dirname(getFilename());
var __dirname = /* @__PURE__ */ getDirname();

// src/node/cli.ts
import cac from "cac";

// src/node/dev.ts
import { createServer } from "vite";

// src/node/plugin-island/indexHtml.ts
import { readFile } from "fs/promises";

// src/node/constants/index.ts
import * as path2 from "path";
var PACKAGE_ROOT = path2.join(__dirname, "..");
var CLIENT_ENTRY_PATH = path2.join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "client-entry.tsx"
);
var SERVER_ENTRY_PATH = path2.join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "ssr-entry.tsx"
);
var DEFAULT_TEMPLATE_PATH = path2.join(PACKAGE_ROOT, "template.html");

// src/node/plugin-island/indexHtml.ts
function pluginIndexHtml() {
  return {
    name: "island:index-html",
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              type: "module",
              src: `/@fs/${CLIENT_ENTRY_PATH}`
            },
            injectTo: "body"
          }
        ]
      };
    },
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res) => {
          let content = await readFile(DEFAULT_TEMPLATE_PATH, "utf-8");
          content = await server.transformIndexHtml(
            req.url,
            content,
            req.originalUrl
          );
          res.setHeader("Content-Type", "text/html");
          res.end(content);
        });
      };
    }
  };
}

// src/node/dev.ts
import pluginReact from "@vitejs/plugin-react";

// src/node/config.ts
import { resolve } from "path";
import fse from "fs-extra";
import { loadConfigFromFile } from "vite";
function getUserConfigPath(root) {
  try {
    const supportConfigFiles = ["config.ts", "config.js"];
    const configPath = supportConfigFiles.map((file) => resolve(root, file)).find(fse.pathExistsSync);
    return configPath;
  } catch (e) {
    console.log("Failed to load user config.");
    throw e;
  }
}
async function resolveConfig(root, command, mode) {
  const configPath = getUserConfigPath(root);
  const result = await loadConfigFromFile(
    {
      command,
      mode
    },
    configPath,
    root
  );
  if (result) {
    const { config: rawConfig = {} } = result;
    const userConfig = await (typeof rawConfig === "function" ? rawConfig() : rawConfig);
    return [configPath, userConfig];
  } else {
    return [configPath, {}];
  }
}

// src/node/dev.ts
async function createDevServer(root) {
  const config = await resolveConfig(root, "serve", "development");
  console.log(config);
  return createServer({
    root,
    plugins: [pluginIndexHtml(), pluginReact()],
    server: {
      fs: {
        allow: [PACKAGE_ROOT]
      }
    }
  });
}

// src/node/build.ts
import { build as viteBuild } from "vite";
import { pathToFileURL } from "url";
import fs from "fs-extra";
import path3 from "path";
import ora from "ora";
async function bundle(root) {
  try {
    const resolveViteConfig = (isServer) => {
      return {
        mode: "production",
        root,
        build: {
          ssr: isServer,
          outDir: isServer ? ".temp" : "build",
          rollupOptions: {
            input: isServer ? SERVER_ENTRY_PATH : CLIENT_ENTRY_PATH,
            output: {
              format: isServer ? "cjs" : "esm"
            }
          }
        }
      };
    };
    const clientBuild = async () => {
      return viteBuild(resolveViteConfig(false));
    };
    const serverBuild = async () => {
      return viteBuild(resolveViteConfig(true));
    };
    const spinner = ora();
    spinner.start("Building client bundle and server bundle...");
    const [clientBundle, serverBundle] = await Promise.all([
      clientBuild(),
      serverBuild()
    ]);
    return [clientBundle, serverBundle];
  } catch (e) {
    console.log(e);
  }
}
async function renderPage(render, root, clientBundle) {
  const appHtml = render();
  const clientChunk = clientBundle.output.find(
    (chunk) => chunk.type === "chunk" && chunk.isEntry
  );
  const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>template</title>
        </head>
        <body>
            <div id="root">${appHtml}</div>
            <script src="/${clientChunk.fileName}" type="module"></script>
        </body>
        </html>
    `.trim();
  await fs.writeFile(path3.join(root, "build", "index.html"), html);
  await fs.remove(path3.join(root, ".temp"));
}
async function build(root) {
  const [clientBundle] = await bundle(root);
  const serverEntryPath = path3.resolve(root, ".temp", "ssr-entry.js");
  const { render } = await import(pathToFileURL(serverEntryPath).toString());
  await renderPage(render, root, clientBundle);
}

// src/node/cli.ts
var cli = cac("island").version("0.0.1").help();
cli.command("dev [root]", "start dev server").action(async (root) => {
  console.log("start dev server");
  const server = await createDevServer(root);
  await server.listen();
  server.printUrls();
});
cli.command("build [root]", "build a production").action(async (root) => {
  console.log("start building");
  await build(root);
});
cli.parse();
