import cac from 'cac';
import { createDevServer } from './dev';
import { build } from './build';

const cli = cac('island').version('0.0.1').help();

cli.command('dev [root]', 'start dev server').action(async (root: string) => {
  console.log('start dev server');
  const server = await createDevServer(root);
  await server.listen();
  server.printUrls();
});

cli
  .command('build [root]', 'build a production')
  .action(async (root: string) => {
    console.log('start building');
    await build(root);
  });

cli.parse();
