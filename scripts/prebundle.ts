import path from 'path';
import fs from 'fs-extra';
import resolve from 'resolve';
import { normalizePath } from 'vite';
import { build } from 'esbuild';

const PRE_BUNDLE_DIR = 'vendors';

async function prebundle(deps: string[]) {
  const flattenDepMap = {} as Record<string, string>;
  deps.map((item) => {
    const flattedName = item.replace(/\//g, '_');
    flattenDepMap[flattedName] = item;
  });

  const outputAbsolutePath = path.join(process.cwd(), PRE_BUNDLE_DIR);

  if (await fs.pathExists(outputAbsolutePath)) {
    await fs.remove(outputAbsolutePath);
  }

  await build({
    entryPoints: flattenDepMap,
    outdir: PRE_BUNDLE_DIR,
    bundle: true,
    minify: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    plugins: [
      {
        name: 'pre-bundle',
        setup(build) {
          // bare import
          build.onResolve({ filter: /^[\w@][^:]/ }, async (args) => {
            if (!deps.includes(args.path)) {
              return;
            }
            const isEntry = !args.importer;
            const resolved = resolve.sync(args.path, {
              basedir: args.importer || process.cwd()
            });
            return isEntry
              ? { path: resolved, namespace: 'dep' }
              : { path: resolved };
          });

          build.onLoad({ filter: /.*/, namespace: 'dep' }, async (args) => {
            const entryPath = normalizePath(args.path);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const res = require(entryPath);
            // 获取所有具名导出
            const specifiers = Object.keys(res);
            // 导出esm 格式的入口代码
            return {
              contents: `export { ${specifiers.join(
                ','
              )} } from "${entryPath}"; export default require("${entryPath}")`,
              loader: 'js',
              resolveDir: process.cwd()
            };
          });
        }
      }
    ]
  });
}

prebundle(['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime']);
