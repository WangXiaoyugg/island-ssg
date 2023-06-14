import {
  CLIENT_ENTRY_PATH,
  SERVER_ENTRY_PATH
} from "./chunk-IKM7YNZV.mjs";
import "./chunk-YZ4JLWLQ.mjs";

// src/node/cli.ts
import cac from "cac";

// src/node/build.ts
import { build as viteBuild } from "vite";
import { pathToFileURL } from "url";
import fs from "fs-extra";
import path from "path";
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
  await fs.writeFile(path.join(root, "build", "index.html"), html);
  await fs.remove(path.join(root, ".temp"));
}
async function build(root) {
  const [clientBundle] = await bundle(root);
  const serverEntryPath = path.resolve(root, ".temp", "ssr-entry.js");
  const { render } = await import(pathToFileURL(serverEntryPath).toString());
  await renderPage(render, root, clientBundle);
}

// src/node/cli.ts
var cli = cac("island").version("0.0.1").help();
cli.command("dev [root]", "start dev server").action(async (root) => {
  console.log("start dev server");
  const createServer = async () => {
    const { createDevServer } = await import("./dev.mjs");
    const server = await createDevServer(root, async () => {
      await server.close();
      await createServer();
    });
    await server.listen();
    server.printUrls();
  };
  await createServer();
});
cli.command("build [root]", "build a production").action(async (root) => {
  console.log("start building");
  await build(root);
});
cli.parse();
