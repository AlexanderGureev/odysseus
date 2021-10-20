import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import pkg from './package.json';

const IS_DEV = process.env.NODE_ENV !== 'production';
const ENTRY = path.resolve('server');
const DEV_SERVER_PATH = path.join(ENTRY, 'devServer.ts');

const config: webpack.Configuration = {
  target: 'node',
  mode: IS_DEV ? 'development' : 'production',
  entry: './server/index.ts',
  output: {
    path: path.resolve('build', 'server'),
    filename: 'index.js',
    publicPath: '/',
  },
  module: {
    rules: [
      // {
      //   test: /\.ts$/,
      //   use: ['ts-loader'],
      // },
      {
        test: /\.ts$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: IS_DEV
      ? undefined
      : {
          [DEV_SERVER_PATH]: false,
        },
  },
  externals: IS_DEV ? [nodeExternals()] : [],
  plugins: [
    new webpack.DefinePlugin({
      APP_VERSION: JSON.stringify(pkg.version),
    }),
  ],
};

export default config;
