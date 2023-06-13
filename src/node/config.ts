import { resolve } from 'path';
import fse from 'fs-extra';
import { loadConfigFromFile } from 'vite';
import { UserConfig } from '../shared/types';

export type RawConfig =
  | UserConfig
  | Promise<UserConfig>
  | (() => UserConfig)
  | (() => Promise<UserConfig>);

export function getUserConfigPath(root: string) {
  try {
    const supportConfigFiles = ['config.ts', 'config.js'];
    const configPath = supportConfigFiles
      .map((file) => resolve(root, file))
      .find(fse.pathExistsSync);
    return configPath;
  } catch (e) {
    console.log('Failed to load user config.');
    throw e;
  }
}

export async function resolveConfig(
  root: string,
  command: 'serve' | 'build',
  mode: 'production' | 'development'
) {
  // 获取配置文件路径， 支持ts, js格式
  const configPath = getUserConfigPath(root);

  // 解析配置文件
  const result = await loadConfigFromFile(
    {
      command,
      mode
    },
    configPath,
    root
  );

  if (result) {
    const { config: rawConfig = {} as RawConfig } = result;
    // rawConfig 有三种形式 object, promise, function
    const userConfig = await (typeof rawConfig === 'function'
      ? rawConfig()
      : rawConfig);
    return [configPath, userConfig] as const;
  } else {
    return [configPath, {} as UserConfig] as const;
  }
}
