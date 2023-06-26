// 发布流程编排
// 1. 确定变动版本级别 patch | minor | major, 遵循 semver 规范
// 2. 执行测试
// 3. 自动修改包版本
// 4. 执行 pnpm build
// 5. 生成 CHANGELOG.md
// 6. release commit
// 7. 执行 npm publish
// 8. git push 并打tag

async function main() {
  //
}

main();
