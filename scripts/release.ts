// 发布流程编排
// 1. 确定变动版本级别 patch | minor | major, 遵循 semver 规范
// 2. 执行测试
// 3. 自动修改包版本
// 4. 执行 pnpm build
// 5. 生成 CHANGELOG.md
// 6. release commit
// 7. 执行 npm publish
// 8. git push 并打tag
import chalk from 'chalk';
import execa from 'execa';
import { prompt } from 'enquirer';
import semver from 'semver';
import minimist from 'minimist';
import { createRequire } from 'module';
import fs from 'fs-extra';
import path from 'path';

// 解析命令行参数
const args = minimist(process.argv.slice(2));
// 是否是 dry 模式。dry 模式下只会展示命令，不会真正执行命令，用来测试。
const isDry = args.dry;

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const currentVersion = pkg.version;
const versionIncrements = ['patch', 'minor', 'major'] as const;

const step = (msg) => console.log(chalk.cyan(msg));

const directRun = (bin: string, args: string[]) => {
  return execa(bin, args, { stdio: 'inherit' });
};

const dryRun = (bin: string, args: string[]) => {
  console.log(chalk.blue(`[dryrun] ${bin} ${args.join(' ')}`));
  return;
};

const run = isDry ? dryRun : directRun;

const updateVersion = (version: string) => {
  pkg.version = version;
  fs.writeFileSync(
    path.resolve(__dirname, '../package.json'),
    JSON.stringify(pkg, null, 2)
  );
};

async function main() {
  //1. 确定变动版本级别 patch | minor | major, 遵循 semver 规范
  const { release } = await prompt<{ release: string }>({
    type: 'select',
    name: 'release',
    message: 'Select release type',
    choices: versionIncrements.map(
      (i) => `${i}(${semver.inc(currentVersion, i)})`
    )
  });

  // release: major(2.0.0)
  const targetVersion = release.match(/\((.*)\)/)?.[1];

  console.log('targetVersion: ', targetVersion);

  const { confirm } = await prompt<{ confirm: boolean }>({
    type: 'confirm',
    name: 'confirm',
    message: `Releasing ${targetVersion}. Confirm?`
  });

  if (!confirm) {
    return;
  }

  // 执行测试
  step('\nRunning tests...');
  await run('pnpm', ['test:unit']);
  await run('pnpm', ['test:e2e']);

  if (!isDry) {
    step('\nUpdate version...');
    updateVersion(targetVersion);
  }

  // 执行build;
  step('\nBuilding package...');
  await run('pnpm', ['build']);

  // 生成changelog.md;
  step('\nGenerating changelog...');
  await run('pnpm', ['changelog']);

  // 生成release commit
  step('\nCommitting changes...');
  await run('git', ['add', '-A']);
  await run('git', ['commit', '-m', `'release: v${targetVersion}'`]);

  // 执行npm publish
  step('\nPublishing packages...');
  await run('pnpm', ['publish', '--access', 'public']);

  // 执行git push 并打tag;
  step('\nPushing to Github...');
  await run('git', ['tag', `v${targetVersion}`]);
  await run('git', ['push', 'origin', `refs/tags/v${targetVersion}`]);
  await run('git', ['push']);
}

main().catch((e) => {
  // 错误兜底处理，回退版本
  console.log(e);
  updateVersion(currentVersion);
});
