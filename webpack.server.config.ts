import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import pkg from './package.json';

const IS_DEV = process.env.NODE_ENV !== 'production';

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
      {
        test: /\.ts$/,
        use: ['ts-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: [nodeExternals()],
  plugins: [
    new webpack.DefinePlugin({
      APP_VERSION: JSON.stringify(pkg.version),
    }),
  ],
};

export default config;
