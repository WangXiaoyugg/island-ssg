"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }



var _chunk4S7ZDAJ4js = require('./chunk-4S7ZDAJ4.js');


var _chunk752VUXXMjs = require('./chunk-752VUXXM.js');

// src/node/dev.ts
var _vite = require('vite');

// src/node/plugin-island/indexHtml.ts
var _promises = require('fs/promises');
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
              src: `/@fs/${_chunk4S7ZDAJ4js.CLIENT_ENTRY_PATH}`
            },
            injectTo: "body"
          }
        ]
      };
    },
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res) => {
          let content = await _promises.readFile.call(void 0, _chunk4S7ZDAJ4js.DEFAULT_TEMPLATE_PATH, "utf-8");
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
var _pluginreact = require('@vitejs/plugin-react'); var _pluginreact2 = _interopRequireDefault(_pluginreact);

// src/node/plugin-island/config.ts
var _path = require('path');
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
${_path.relative.call(void 0, config.root, ctx.file)} changed, restarting server...`
        );
        await restart();
      }
    }
  };
}

// src/node/dev.ts
async function createDevServer(root, restart) {
  const config = await _chunk752VUXXMjs.resolveConfig.call(void 0, root, "serve", "development");
  console.log(config);
  return _vite.createServer.call(void 0, {
    root,
    plugins: [pluginIndexHtml(), _pluginreact2.default.call(void 0, ), pluginConfig(config, restart)],
    server: {
      fs: {
        allow: [_chunk4S7ZDAJ4js.PACKAGE_ROOT]
      }
    }
  });
}


exports.createDevServer = createDevServer;
