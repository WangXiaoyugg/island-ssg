import {
  CLIENT_ENTRY_PATH,
  DEFAULT_TEMPLATE_PATH,
  PACKAGE_ROOT
} from "./chunk-IKM7YNZV.mjs";
import {
  resolveConfig
} from "./chunk-RIKWM6KN.mjs";
import "./chunk-YZ4JLWLQ.mjs";

// src/node/dev.ts
import { createServer } from "vite";

// src/node/plugin-island/indexHtml.ts
import { readFile } from "fs/promises";
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

// src/node/plugin-island/config.ts
import { relative } from "path";
var SITE_DATA_ID = "island:site-data";
function pluginConfig(config, restart) {
  return {
    name: "island:site-data",
    resolveId(id) {
      if (id === SITE_DATA_ID) {
        return "\0" + SITE_DATA_ID;
      }
    },
    load(id) {
      if (id === "\0" + SITE_DATA_ID) {
        return `export default ${JSON.stringify(config.siteData)}`;
      }
    },
    async handleHotUpdate(ctx) {
      console.log("ctx: ", ctx.file);
      const customWatchedFiles = [config.configPath.replaceAll("\\", "/")];
      console.log("customWatchedFiles: ", customWatchedFiles);
      const include = (id) => customWatchedFiles.some((file) => id.includes(file));
      console.log("include: ", include(ctx.file));
      if (include(ctx.file)) {
        console.log(
          `
${relative(config.root, ctx.file)} changed, restarting server...`
        );
        await restart();
      }
    }
  };
}

// src/node/dev.ts
async function createDevServer(root, restart) {
  const config = await resolveConfig(root, "serve", "development");
  console.log(config);
  return createServer({
    root,
    plugins: [pluginIndexHtml(), pluginReact(), pluginConfig(config, restart)],
    server: {
      fs: {
        allow: [PACKAGE_ROOT]
      }
    }
  });
}
export {
  createDevServer
};
