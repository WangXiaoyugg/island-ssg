"use strict"; function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }// src/node/cli.ts
var _cac = require('cac'); var _cac2 = _interopRequireDefault(_cac);

// src/node/dev.ts
var _vite = require('vite');

// src/node/plugin-island/indexHtml.ts
var _promises = require('fs/promises');

// src/node/constants/index.ts
var _path = require('path'); var path = _interopRequireWildcard(_path);
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
        server.middlewares.use(async (req, res, next) => {
          let content = await _promises.readFile.call(void 0, DEFAULT_TEMPLATE_PATH, "utf-8");
          content = await server.transformIndexHtml(req.url, content, req.originalUrl);
          res.setHeader("Content-Type", "text/html");
          res.end(content);
        });
      };
    }
  };
}

// src/node/dev.ts
var _pluginreact = require('@vitejs/plugin-react'); var _pluginreact2 = _interopRequireDefault(_pluginreact);
function createDevServer(root) {
  return _vite.createServer.call(void 0, {
    root,
    plugins: [
      pluginIndexHtml(),
      _pluginreact2.default.call(void 0, )
    ]
  });
}

// src/node/build.ts

var _url = require('url');
var _fsextra = require('fs-extra'); var _fsextra2 = _interopRequireDefault(_fsextra);

var _ora = require('ora'); var _ora2 = _interopRequireDefault(_ora);
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
      return _vite.build.call(void 0, resolveViteConfig(false));
    };
    const serverBuild = async () => {
      return _vite.build.call(void 0, resolveViteConfig(true));
    };
    const spinner = _ora2.default.call(void 0, );
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
  const clientChunk = clientBundle.output.find((chunk) => chunk.type === "chunk" && chunk.isEntry);
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
  await _fsextra2.default.writeFile(path.default.join(root, "build", "index.html"), html);
  await _fsextra2.default.remove(path.default.join(root, ".temp"));
}
async function build(root) {
  const [clientBundle] = await bundle(root);
  const serverEntryPath = path.default.resolve(root, ".temp", "ssr-entry.js");
  const { render } = await Promise.resolve().then(() => _interopRequireWildcard(require(_url.pathToFileURL.call(void 0, serverEntryPath).toString())));
  await renderPage(render, root, clientBundle);
}

// src/node/cli.ts
var cli = _cac2.default.call(void 0, "island").version("0.0.1").help();
cli.command("dev [root]", "start dev server").action(async (root) => {
  const server = await createDevServer(root);
  await server.listen();
  server.printUrls();
});
cli.command("build [root]", "build a production").action(async (root) => {
  await build(root);
});
cli.parse();
