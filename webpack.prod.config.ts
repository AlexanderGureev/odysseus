import CopyPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';

import { ModifySrcPlugin } from './plugins/ModifySrcPlugin';

const config: webpack.Configuration = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve('build', 'client'),
    filename: 'static/js/[name].[contenthash:8].player.js',
    publicPath: '/',
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
    splitChunks: {
      chunks: 'all',
      name: false,
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  module: {
    rules: [
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
        test: /fonts.css/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.css$/i,
        exclude: [/\.module\.css$/i, /fonts.css/],
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.module\.css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:5]',
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
    new HtmlWebpackPlugin({
      template: path.resolve('server', 'templates', 'index.pug'),
      filename: path.resolve('build', 'server', 'views', 'index.ejs'),
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[id].[contenthash:8].css',
    }),
    new CopyPlugin({
      patterns: [{ from: path.resolve('src', 'static'), to: path.resolve('build', 'client') }],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new ModifySrcPlugin(),
  ],
};

export default config;
