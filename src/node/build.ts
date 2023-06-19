import { InlineConfig, build as viteBuild } from 'vite';
import { CLIENT_ENTRY_PATH, SERVER_ENTRY_PATH } from './constants';
import type { RollupOutput } from 'rollup';
import { pathToFileURL } from 'url';
import fs from 'fs-extra';
import path, { dirname, join } from 'path';
// import ora from 'ora';
import { SiteConfig } from 'shared/types';
import { createVitePlugins } from './vitePlugins';
import { Route } from './plugin-routes';

// const dynamicImport = new Function('m', 'return import(m)');

export async function bundle(root: string, config: SiteConfig) {
  try {
    const resolveViteConfig = async (
      isServer: boolean
    ): Promise<InlineConfig> => {
      return {
        mode: 'production',
        root,
        plugins: await createVitePlugins(config, undefined, isServer),
        ssr: {
          noExternal: ['react-router-dom', 'lodash-es']
        },
        build: {
          ssr: isServer,
          outDir: isServer
            ? path.join(root, '.temp')
            : path.join(root, 'build'),
          rollupOptions: {
            input: isServer ? SERVER_ENTRY_PATH : CLIENT_ENTRY_PATH,
            output: {
              format: isServer ? 'cjs' : 'esm'
            }
          }
        }
      };
    };

    const [clientBundle, serverBundle] = await Promise.all([
      // client build
      viteBuild(await resolveViteConfig(false)),
      // server build
      viteBuild(await resolveViteConfig(true))
    ]);
    return [clientBundle, serverBundle] as [RollupOutput, RollupOutput];
  } catch (e) {
    console.log('error: ', e);
  }
}

export async function renderPages(
  render: (pagePath: string) => string,
  root: string,
  clientBundle: RollupOutput,
  routes: Route[]
) {
  const clientChunk = clientBundle.output.find(
    (chunk) => chunk.type === 'chunk' && chunk.isEntry
  );

  await Promise.all(
    routes.map(async (route) => {
      const routePath = route.path;
      const appHtml = await render(routePath);

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
      const fileName = routePath.endsWith('/')
        ? `${routePath}index.html`
        : `${routePath}.html`;
      await fs.ensureDir(join(root, 'build', dirname(fileName)));
      await fs.writeFile(join(root, 'build', fileName), html);
    })
  );
  await fs.remove(path.join(root, '.temp'));
}

export async function build(root: string = process.cwd(), config: SiteConfig) {
  // bundle code: server and client
  const [clientBundle] = await bundle(root, config);

  // import server-entry module
  const serverEntryPath = path.join(root, '.temp', 'ssr-entry.js');
  // ssr render, generate html
  const { render, routes } = await import(
    pathToFileURL(serverEntryPath).toString()
  );
  await renderPages(render, root, clientBundle as RollupOutput, routes);
}
