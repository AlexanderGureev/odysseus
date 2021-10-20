import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

const ATTR_BY_TAG_NAME: Record<string, string> = {
  script: 'src',
  link: 'href',
};

class ModifySrcPlugin {
  options: Record<string, any>;

  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap('ModifySrcPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync('ModifySrcPlugin', (data, cb) => {
        if (!data.outputName.match(/\.ejs$/i)) {
          cb(null, data);
          return;
        }

        data.assetTags.styles.concat(data.assetTags.scripts).forEach((tag) => {
          const attrName = ATTR_BY_TAG_NAME[tag.tagName];

          if (tag.attributes[attrName]) {
            tag.attributes[attrName] = `<%= env.CDN_HOSTNAME + "${tag.attributes[attrName]}" %>`;
          }
        });

        cb(null, data);
      });
    });
  }
}

export { ModifySrcPlugin };
