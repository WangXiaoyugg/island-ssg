import cac from 'cac';
import { build } from './build';

const cli = cac('island').version('0.0.1').help();

cli.command('dev [root]', 'start dev server').action(async (root: string) => {
  console.log('start dev server');
  const createServer = async () => {
    const { createDevServer } = await import('./dev.js');
    const server = await createDevServer(root, async () => {
      await server.close();
      await createServer();
    });
    await server.listen();
    server.printUrls();
  };

  await createServer();
});

cli
  .command('build [root]', 'build a production')
  .action(async (root: string) => {
    console.log('start building');
    await build(root);
  });

cli.parse();
