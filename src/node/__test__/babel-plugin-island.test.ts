import { expect, describe, test } from 'vitest';
import babelPluginIsland from '../babel-plugin-island';
import os from 'os';
import { TransformOptions, transformAsync } from '@babel/core';
import { MASK_SPLITTER } from '../constants';

const isWindows = os.platform() === 'win32';

describe('babel-plugin-island', () => {
  const ISLAND_PATH = '../Comp/index';
  const prefix = isWindows ? 'C:' : '';
  const IMPORTER_PATH = prefix + '/User/project/test.tsx';
  const babelOptions: TransformOptions = {
    filename: IMPORTER_PATH,
    presets: ['@babel/preset-react'],
    plugins: [babelPluginIsland]
  };

  test('Should compile jsx identifier', async () => {
    const code = `import Aside from '${ISLAND_PATH}'; export default function App() { return <Aside __island/>; }`;

    const result = await transformAsync(code, babelOptions);
    const targetCode = `__island: "${ISLAND_PATH}${MASK_SPLITTER}${IMPORTER_PATH}"`;
    expect(result?.code).toContain(targetCode);
  });

  test('Should compile jsx member expression', async () => {
    const code = `import A from '${ISLAND_PATH}'; export default function App() { return <A.B __island/>; }`;

    const result = await transformAsync(code, babelOptions);
    const targetCode = `__island: "${ISLAND_PATH}${MASK_SPLITTER}${IMPORTER_PATH}"`;
    expect(result?.code).toContain(targetCode);
  });
});
