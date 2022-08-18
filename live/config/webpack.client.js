/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const path = require('path');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const { extendDefaultPlugins } = require('svgo');

const isDev = process.env.NODE_ENV !== 'production';
const isProd = process.env.NODE_ENV !== 'development';

const cfg = require('./../../package.json');
const APP_VERSION = cfg.version || new Date().getUTCDate();

const ENV = process.env.NODE_ENV || 'production';
const USE_MOCKS = process.env.USE_MOCKS === '1';
const USE_DEV_TOOLS = process.env.DEV_TOOLS === 'enabled';

const config = {
  mode: isDev ? 'development' : 'production',
  entry: {
    app: [path.resolve('live', 'src', 'js', 'index.js')],
  },
  output: {
    path: path.resolve('build', 'client-vitrina'),
    filename: isProd ? 'static/js/[name].[contenthash].live.js' : 'static/js/[name].live.bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.ts', '.json'],
    modules: [path.resolve('client-vitrina'), path.resolve('node_modules')],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: isDev ? 'static/icons/[path][name][ext]' : 'static/icons/[name].[contenthash:8][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: isDev ? 'static/fonts/[path][name][ext]' : 'static/fonts/[name].[contenthash:8][ext]',
        },
      },
      {
        test: /\.svg$/,
        type: 'asset/resource',
        generator: {
          filename: isDev ? 'static/icons/[path][name][ext]' : 'static/fonts/[name].[contenthash:8][ext]',
        },
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            options: {},
          },
          { loader: 'css-loader', options: { sourceMap: isDev } },
        ],
      },
      {
        test: /\.pug$/,
        loader: 'pug-loader',
      },
    ],
  },
  plugins: [
    isProd &&
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            plugins: [
              ['gifsicle', { interlaced: true }],
              ['jpegtran', { progressive: true }],
              ['optipng', { optimizationLevel: 5 }],
              [
                'svgo',
                {
                  plugins: extendDefaultPlugins([
                    {
                      name: 'removeViewBox',
                      active: false,
                    },
                  ]),
                },
              ],
            ],
          },
        },
      }),
    new MiniCssExtractPlugin({
      filename: isDev ? 'static/css/[name].css' : 'static/css/[name].[contenthash:8].css',
      chunkFilename: isDev ? 'static/css/[id].css' : 'static/css/[id].[contenthash:8].css',
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: 'live/src/index.pug',
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: 'live/src/index.pug',
      filename: './../server/views/live.ejs',
      env: {
        isProduction: true,
        useDevTools: false,
        isExpress: true,
      },
    }),
    new webpack.DefinePlugin({
      appVersion: JSON.stringify(APP_VERSION),
      'process.env.NODE_ENV': JSON.stringify(ENV),
      'process.env.USE_MOCKS': JSON.stringify(USE_MOCKS),
      'process.env.DEV_TOOLS': JSON.stringify(USE_DEV_TOOLS),
    }),
  ].filter(Boolean),
};

if (isProd) {
  config.optimization = {
    ...config.optimization,
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
  };

  config.performance = {
    ...config.performance,
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  };
}

module.exports = config;
