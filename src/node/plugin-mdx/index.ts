import { pluginMdxHMR } from './pluginMdxHrm';
import { pluginMdxRollup } from './pluginMdxRollup';

// Vite 热更新机制
// 1. 监听到文件变动
// 2. 定位到热更新边界模块
// 3. 执行更新逻辑

// React 的组件的热更新方式，依赖react-fresh
export async function createMdxPlugin() {
  return [await pluginMdxRollup(), pluginMdxHMR()];
}
