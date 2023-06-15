import { pluginMdxRollup } from './pluginMdxRollup';

export async function createMdxPlugin() {
  return [await pluginMdxRollup()];
}
