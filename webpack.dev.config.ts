/* eslint-disable @typescript-eslint/ban-ts-comment */
import CopyPlugin from 'copy-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import HappyPack from 'happypack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';

import { ModifySrcPlugin } from './plugins/ModifySrcPlugin';

const config: webpack.Configuration = {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    path: path.resolve('build', 'client'),
    filename: 'static/js/[name].bundle.js',
    publicPath: '/',
  },
  entry: {
    app: ['./src/index.tsx'],
    private: ['./pak-player/index.ts'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        use: 'happypack/loader?id=js',
      },
      {
        test: /\.(ts|js)x?$/i,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/img/[hash][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[hash][ext]',
        },
      },
      {
        test: /\.css$/i,
        exclude: /\.module\.css$/i,
        use: ['style-loader', { loader: 'css-loader', options: { sourceMap: true } }, 'postcss-loader'],
      },
      {
        test: /\.module\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[path][name]__[local]',
              },
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.pug$/,
        loader: 'pug-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      crypto: 'crypto-browserify',
      stream: false,
      buffer: 'buffer',
    },
    plugins: [new TsconfigPathsPlugin()],
  },
  plugins: [
    // @ts-ignore
    new HappyPack({
      id: 'js',
      threads: 4,
      loaders: ['babel-loader'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve('server', 'templates', 'index.pug'),
      filename: path.resolve('build', 'server', 'views', 'index.ejs'),
      inject: 'body',
      chunks: ['app'],
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: path.resolve('server', 'templates', 'pak_player.pug'),
      filename: path.resolve('build', 'server', 'views', 'pak_player.ejs'),
      chunks: ['private'],
    }),
    new ForkTsCheckerWebpackPlugin({
      async: false,
    }),
    new ESLintPlugin({
      extensions: ['js', 'jsx', 'ts', 'tsx'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new CopyPlugin({
      patterns: [{ from: path.resolve('src', 'static'), to: path.resolve('build', 'client') }],
    }),
    new ModifySrcPlugin(),
  ],
};

export default config;
