import fastGlob from 'fast-glob';
import { normalizePath } from 'vite';
import path from 'path';
import { PageModule } from 'shared/types';

export interface RouteMeta {
  routePath: string;
  absolutePath: string;
}

export class RouteService {
  #scanDir: string;
  #routeData: RouteMeta[] = [];

  constructor(scanDir: string) {
    this.#scanDir = scanDir;
  }

  generateRoutesCode(ssr = false) {
    console.log('ssr: ', ssr);
    return `
    import React from 'react';
    ${ssr ? '' : 'import loadable from "@loadable/component";'}
    
    ${this.#routeData
      .map((route, index) => {
        return ssr
          ? `import Route${index} from "${route.absolutePath}";`
          : `const Route${index} = loadable(() => import('${route.absolutePath}'));`;
      })
      .join('\n')}
    
    export const routes = [
        ${this.#routeData
          .map((route, index) => {
            return `{path: '${route.routePath}', element: React.createElement(Route${index}), preload: () => import('${route.absolutePath}')}`;
          })
          .join(',\n')}
    ]
    `;
  }

  async init() {
    // todo fastGlob can't ignore files config.ts
    const files = fastGlob
      .sync(['**/*.{js,jsx,ts,tsx,md,mdx}'], {
        cwd: this.#scanDir,
        absolute: true,
        ignore: ['**/node_modules/**', '**/build/**', 'config.ts']
      })
      .sort();
    files.forEach((file) => {
      const fileRelativePath = normalizePath(
        path.relative(this.#scanDir, file)
      );
      const routePath = this.normalizePath(fileRelativePath);
      this.#routeData.push({
        routePath,
        absolutePath: file
      });
    });
  }

  getRouteMeta(): RouteMeta[] {
    return this.#routeData;
  }

  normalizePath(rawPath: string) {
    const routePath = rawPath.replace(/\.(.*)?$/, '').replace(/index$/, '');
    return routePath.startsWith('/') ? routePath : '/' + routePath;
  }
}
