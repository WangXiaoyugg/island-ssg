import { SiteConfig } from 'shared/types';
import { pluginIndexHtml } from './plugin-island/indexHtml';
import { pluginConfig } from './plugin-island/config';
import { pluginRoutes } from './plugin-routes';
import pluginReact from '@vitejs/plugin-react';
import { Plugin } from 'vite';
import { pluginMdxRollup } from './plugin-mdx/pluginMdxRollup';

export function createVitePlugins(
  config: SiteConfig,
  restartServer?: () => Promise<void>
) {
  return [
    pluginIndexHtml(),
    pluginReact({
      jsxRuntime: 'automatic'
    }),
    pluginConfig(config, restartServer),
    pluginRoutes({ root: config.root }),
    pluginMdxRollup()
  ] as Plugin[];
}
