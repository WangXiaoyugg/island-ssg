import { SiteConfig } from 'shared/types';
import { pluginIndexHtml } from './plugin-island/indexHtml';
import { pluginConfig } from './plugin-island/config';
import { pluginRoutes } from './plugin-routes';
import pluginReact from '@vitejs/plugin-react';
import { Plugin } from 'vite';
import { createMdxPlugin } from './plugin-mdx/index';
import pluginUnocss from 'unocss/vite';
import unocssOpitons from './unocssOptions';
import { PACKAGE_ROOT } from './constants';
import path from 'path';
import babelPluginIsland from './babel-plugin-island';

export async function createVitePlugins(
  config: SiteConfig,
  restartServer?: () => Promise<void>,
  isSSR = false
) {
  return [
    pluginUnocss(unocssOpitons),
    pluginIndexHtml(),
    pluginReact({
      jsxRuntime: 'automatic',
      jsxImportSource: isSSR
        ? path.join(PACKAGE_ROOT, 'src', 'runtime')
        : 'react',
      babel: {
        plugins: [babelPluginIsland]
      }
    }),
    pluginConfig(config, restartServer),
    pluginRoutes({ root: config.root, isSSR }),
    await createMdxPlugin()
  ] as Plugin[];
}
