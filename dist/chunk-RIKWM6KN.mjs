// src/node/config.ts
import { resolve } from "path";
import fse from "fs-extra";
import { loadConfigFromFile } from "vite";
function getUserConfigPath(root) {
  try {
    const supportConfigFiles = ["config.ts", "config.js"];
    const configPath = supportConfigFiles.map((file) => resolve(root, file)).find(fse.pathExistsSync);
    return configPath;
  } catch (e) {
    console.log("Failed to load user config.");
    throw e;
  }
}
function resolveSiteData(userConfig) {
  return {
    title: userConfig.title || "Island.js",
    description: userConfig.description || "SSG framework",
    themeConfig: userConfig.themeConfig || {},
    vite: userConfig.vite || {}
  };
}
async function resolveUserConfig(root, command, mode) {
  const configPath = getUserConfigPath(root);
  const result = await loadConfigFromFile(
    {
      command,
      mode
    },
    configPath,
    root
  );
  if (result) {
    const { config: rawConfig = {} } = result;
    const userConfig = await (typeof rawConfig === "function" ? rawConfig() : rawConfig);
    return [configPath, userConfig];
  } else {
    return [configPath, {}];
  }
}
async function resolveConfig(root, command, mode) {
  const [configPath, userConfig] = await resolveUserConfig(root, command, mode);
  const siteConfig = {
    root,
    configPath,
    siteData: resolveSiteData(userConfig)
  };
  return siteConfig;
}
function defineConfig(config) {
  return config;
}

export {
  resolveConfig,
  defineConfig
};
