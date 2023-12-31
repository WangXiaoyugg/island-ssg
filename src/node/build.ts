import { InlineConfig, build as viteBuild } from 'vite';
import {
  CLIENT_ENTRY_PATH,
  EXTERNALS,
  MASK_SPLITTER,
  PACKAGE_ROOT,
  SERVER_ENTRY_PATH
} from './constants';
import type { RollupOutput } from 'rollup';
import { pathToFileURL } from 'url';
import fs from 'fs-extra';
import path, { dirname, join } from 'path';
// import ora from 'ora';
import { SiteConfig } from 'shared/types';
import { createVitePlugins } from './vitePlugins';
import { Route } from './plugin-routes';
import { RenderResult } from '../runtime/ssr-entry';
import { HelmetData } from 'react-helmet-async';

const CLIENT_OUTPUT = 'build';

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
            : path.join(root, CLIENT_OUTPUT),
          rollupOptions: {
            input: isServer ? SERVER_ENTRY_PATH : CLIENT_ENTRY_PATH,
            output: {
              format: isServer ? 'cjs' : 'esm'
            },
            external: EXTERNALS
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

    const publicDic = path.join(root, 'public');
    if (fs.pathExistsSync(publicDic)) {
      await fs.copy(publicDic, path.join(root, CLIENT_OUTPUT));
    }

    await fs.copy(
      path.join(PACKAGE_ROOT, 'vendors'),
      path.join(root, CLIENT_OUTPUT)
    );

    return [clientBundle, serverBundle] as [RollupOutput, RollupOutput];
  } catch (e) {
    console.log('error: ', e);
  }
}

// async function buildIslands(
//   root: string,
//   islandPathToMap: Record<string, string>
// ) {
//   // { Aside: 'xxx' }
//   // 内容
//   // import { Aside } from 'xxx'
//   // windows.ISLANDS = { Aside }
//   // windows.ISLAND_PROPS = JSON.parse(document.getElementById('island-props').textContent);
//   const islandsInjectCode = `
//     ${Object.entries(islandPathToMap)
//       .map(
//         ([islandName, islandPath]) =>
//           `import {${islandName}} from '${islandPath}';`
//       )
//       .join('')}
//     window.ISLANDS = { ${Object.keys(islandPathToMap).join(',')} };
//     window.ISLAND_PROPS = JSON.parse(
//       document.getElementById('island-props').textContent
//     );
//   `;
//   const injectId = 'island:inject';
//   return viteBuild({
//     mode: 'production',
//     esbuild: {
//       jsx: 'automatic'
//     },
//     build: {
//       outDir: path.join(root, '.temp'),
//       rollupOptions: {
//         input: injectId,
//         external: EXTERNALS
//       }
//     },
//     plugins: [
//       {
//         name: 'island:inject',
//         enforce: 'post',
//         resolveId(id) {
//           if (id.includes(MASK_SPLITTER)) {
//             const [originId, importer] = id.split(MASK_SPLITTER);
//             return this.resolve(originId, importer, { skipSelf: true });
//           }

//           if (id === injectId) {
//             return id;
//           }
//         },
//         load(id) {
//           if (id === injectId) {
//             return islandsInjectCode;
//           }
//         },
//         generateBundle(_, bundle) {
//           for (const name in bundle) {
//             if (bundle[name].type === 'asset') {
//               delete bundle[name];
//             }
//           }
//         }
//       }
//     ]
//   });
// }

async function buildIslands(
  root: string,
  islandPathToMap: Record<string, string>
) {
  // { Aside: 'xxx' }
  // 内容
  // import { Aside } from 'xxx'
  // window.ISLANDS = { Aside }
  // window.ISLAND_PROPS = JSON.parse(
  // document.getElementById('island-props').textContent
  // );
  const islandsInjectCode = `
    ${Object.entries(islandPathToMap)
      .map(
        ([islandName, islandPath]) =>
          `import { ${islandName} } from '${islandPath}'`
      )
      .join('')}
window.ISLANDS = { ${Object.keys(islandPathToMap).join(', ')} };
window.ISLAND_PROPS = JSON.parse(
  document.getElementById('island-props').textContent
);
  `;
  const injectId = 'island:inject';
  return viteBuild({
    mode: 'production',
    esbuild: {
      jsx: 'automatic'
    },
    build: {
      outDir: path.join(root, '.temp'),
      rollupOptions: {
        input: injectId,
        external: EXTERNALS
      }
    },
    plugins: [
      {
        name: 'island:inject',
        enforce: 'post',
        resolveId(id) {
          if (id.includes(MASK_SPLITTER)) {
            const [originId, importer] = id.split(MASK_SPLITTER);
            return this.resolve(originId, importer, { skipSelf: true });
          }

          if (id === injectId) {
            return id;
          }
        },
        load(id) {
          if (id === injectId) {
            return islandsInjectCode;
          }
        },
        generateBundle(_, bundle) {
          for (const name in bundle) {
            if (bundle[name].type === 'asset') {
              delete bundle[name];
            }
          }
        }
      }
    ]
  });
}

export async function renderPages(
  render: (pagePath: string, helmetContext: object) => RenderResult,
  root: string,
  clientBundle: RollupOutput,
  routes: Route[]
) {
  const clientChunk = clientBundle.output.find(
    (chunk) => chunk.type === 'chunk' && chunk.isEntry
  );

  const normalizeVendorFileName = (filename: string) => {
    return filename.replace(/\//g, '_') + '.js';
  };

  await Promise.all(
    [...routes, { path: '/404' }].map(async (route) => {
      const routePath = route.path;
      const helmetContext = {
        context: {}
      } as HelmetData;
      const { appHtml, islandToPathMap, islandProps } = await render(
        routePath,
        helmetContext.context
      );
      const styleAssets = clientBundle.output.filter(
        (chunk) => chunk.type === 'asset' && chunk.fileName.endsWith('css')
      );
      const islandBundle = await buildIslands(root, islandToPathMap);
      const islandCode = (islandBundle as RollupOutput).output[0].code;

      const { helmet } = helmetContext.context;
      console.log('helmet:', helmet?.title.toString());
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${helmet?.title?.toString() || ''}
          ${helmet?.meta?.toString() || ''}
          ${helmet?.link?.toString() || ''}
          ${helmet?.style?.toString() || ''}
          <meta name="description" content="island ssg framework">
          ${styleAssets
            .map((item) => `<link rel="stylesheet" href="/${item.fileName}">`)
            .join('\n')}
      </head>
      <body>
          <div id="root">${appHtml}</div>
          <script type="importmap">
            {
              "imports": {
                ${EXTERNALS.map(
                  (name) => `"${name}": "/${normalizeVendorFileName(name)}"`
                ).join(',')}
              }
            }
          </script>
          <script type="module">${islandCode}</script>
          <script src="/${clientChunk.fileName}" type="module"></script>
          <script id="island-props">${JSON.stringify(islandProps)}</script>
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
