import { relative } from 'path';
import { SiteConfig } from '../../shared/types';
import { Plugin } from 'vite';

const SITE_DATA_ID = 'island:site-data';

export function pluginConfig(
  config: SiteConfig,
  restart: () => Promise<void>
): Plugin {
  return {
    name: 'island:site-data',
    resolveId(id) {
      if (id === SITE_DATA_ID) {
        return '\0' + SITE_DATA_ID;
      }
    },
    load(id) {
      if (id === '\0' + SITE_DATA_ID) {
        return `export default ${JSON.stringify(config.siteData)}`;
      }
    },
    async handleHotUpdate(ctx) {
      console.log('ctx: ', ctx.file);
      const customWatchedFiles = [config.configPath.replaceAll('\\', '/')];
      console.log('customWatchedFiles: ', customWatchedFiles);
      const include = (id: string) =>
        customWatchedFiles.some((file) => id.includes(file));
      console.log('include: ', include(ctx.file));
      if (include(ctx.file)) {
        console.log(
          `\n${relative(config.root, ctx.file)} changed, restarting server...`
        );

        // 重启 devServer
        // 方案讨论
        // 1. 手动调用 dev.ts 的 createDevServer
        await restart();
      }
    }
  };
}