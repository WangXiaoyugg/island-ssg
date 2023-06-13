import path from 'path';
import fse from 'fs-extra';
import * as execa from 'execa';

const exampleDir = path.resolve(__dirname, '../e2e/playground/basic');

const ROOT_DIR = path.join(__dirname, '..');

const defaultOptions = {
  stdout: process.stdout,
  stdin: process.stdin,
  stderr: process.stderr
};

async function prepareE2E() {
  if (!fse.existsSync(path.resolve(__dirname, '../dist'))) {
    // pnpm build
    execa.execaCommandSync('pnpm build', {
      cwd: ROOT_DIR,
      ...defaultOptions
    });
  }

  execa.execaCommandSync('npx playwright install', {
    cwd: ROOT_DIR,
    ...defaultOptions
  });

  execa.execaCommandSync('pnpm dev', {
    cwd: exampleDir,
    ...defaultOptions
  });
}

prepareE2E();
