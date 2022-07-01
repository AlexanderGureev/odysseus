import { Application,NextFunction } from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

export const createDevServer = async (app: Application) => {
  let isBuilding = true;
  let waitRequests: NextFunction[] = [];

  const { default: playerConfig } = await import('../webpack.dev.config');
  //   const { default: livePlayerConfig }: any = await import('../vitrina-config/client/webpack.client.js');

  if (playerConfig.entry) {
    const entry = playerConfig.entry as Record<string, string[]>;
    entry.app.unshift(`webpack-hot-middleware/client?reload=true&timeout=1000`);
  }

  playerConfig.plugins?.push(new webpack.HotModuleReplacementPlugin());

  const mainPlayerCompiler = webpack(playerConfig);

  //   const livePlayerCompiler = webpack(livePlayerConfig);
  //   livePlayerCompiler.run((err) => {
  //     if (err) console.error(err);
  //     else {
  //       console.log('live player successfully compiled');
  //     }
  //   });

  mainPlayerCompiler.hooks.done.tap('DevServer', () => {
    isBuilding = false;
    waitRequests.forEach((cb) => cb());
    waitRequests = [];
  });

  mainPlayerCompiler.hooks.invalid.tap('DevServer', () => {
    isBuilding = true;
  });

  app.use(
    webpackDevMiddleware(mainPlayerCompiler, {
      publicPath: playerConfig.output?.publicPath as string,
      writeToDisk: (filePath: string) => {
        return ['.ejs', '.html'].some((path) => filePath.includes(path));
      },
    })
  );

  app.use(webpackHotMiddleware(mainPlayerCompiler));
  app.use((req, res, next) => {
    if (isBuilding) waitRequests.push(next);
    else next();
  });
};
