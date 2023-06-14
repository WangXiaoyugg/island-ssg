"use strict"; function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }


var _chunk4S7ZDAJ4js = require('./chunk-4S7ZDAJ4.js');

// src/node/cli.ts
var _cac = require('cac'); var _cac2 = _interopRequireDefault(_cac);

// src/node/build.ts
var _vite = require('vite');
var _url = require('url');
var _fsextra = require('fs-extra'); var _fsextra2 = _interopRequireDefault(_fsextra);
var _path = require('path'); var _path2 = _interopRequireDefault(_path);
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
            input: isServer ? _chunk4S7ZDAJ4js.SERVER_ENTRY_PATH : _chunk4S7ZDAJ4js.CLIENT_ENTRY_PATH,
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
  await _fsextra2.default.writeFile(_path2.default.join(root, "build", "index.html"), html);
  await _fsextra2.default.remove(_path2.default.join(root, ".temp"));
}
async function build(root) {
  const [clientBundle] = await bundle(root);
  const serverEntryPath = _path2.default.resolve(root, ".temp", "ssr-entry.js");
  const { render } = await Promise.resolve().then(() => _interopRequireWildcard(require(_url.pathToFileURL.call(void 0, serverEntryPath).toString())));
  await renderPage(render, root, clientBundle);
}

// src/node/cli.ts
var cli = _cac2.default.call(void 0, "island").version("0.0.1").help();
cli.command("dev [root]", "start dev server").action(async (root) => {
  console.log("start dev server");
  const createServer = async () => {
    const { createDevServer } = await Promise.resolve().then(() => _interopRequireWildcard(require("./dev.js")));
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
