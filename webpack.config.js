const fs = require('fs');
const path = require("path");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const RemovePlugin = require("remove-files-webpack-plugin");
const globule = require("globule");
const webpack = require("webpack");
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");

const listFiles = dir => {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(dirent =>
    dirent.isFile() ? [`${dir}/${dirent.name}`] : listFiles(`${dir}/${dirent.name}`)
  )
}

const js_dir = './dev/js/scripts',
  js_entries = {},
  scss_dir = './dev/sass/',
  scss_dir_regexp = new RegExp(scss_dir),
  scss_entries = {};

listFiles(scss_dir).forEach(file => {
  const filename = path.basename(file, '.scss');

  if (!filename.match(/^(_|\.)/)) {
    const dist_dir = file.replace(scss_dir_regexp, ''),
      dist_file = dist_dir.replace(/\.scss/, '.css');

    scss_entries[dist_file.slice(1)] = [path.resolve(__dirname, file)];
  }
});

const js_files = fs.readdirSync(js_dir);
js_files.forEach(file => {
  if (file.match(/(js|ts)$/)) {
    const dist_file = file.replace(/\.ts$/, '');

    js_entries[dist_file] = [path.resolve(__dirname, `${js_dir}/${file}`)];
  }
});


module.exports = {
  entry: {
    ...js_entries, ...scss_entries
  },
  output: {
    filename: "js/[name].js",
    path: path.resolve(__dirname, "./build"),
    publicPath: "./dev",
  },
  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  },
  mode: "production",
  optimization: {
    chunkIds: "named",
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/].*\.js$/,
          name: "vendor",
          chunks: "all",
        },
      },
    },
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.(j|t)s(|x)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                },
              },
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              importLoaders: 1,
              url: false,
            }
          },
          {
            loader: "postcss-loader",
            options: {
              sourceMap: true,
              postcssOptions: {
                plugins: [
                  require("autoprefixer")(),
                  require("cssnano"),
                  require("postcss-assets")({
                    loadPaths: ["dev/images/"],
                    relative: true
                  }),
                ],
              },
            },
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              sassOptions: {
                includePaths: [path.resolve(__dirname, './dev/sass')],
              },
            },
          },
        ],
      }
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new RemovePlugin({
      after: {
        test: [
          {
            folder: "build/css",
            method: (absoluteItemPath) => {
              return new RegExp(/bundle$/, "m").test(absoluteItemPath);
            },
            recursive: true,
          },
        ],
      },
    }),
    new RemoveEmptyScriptsPlugin(),
    new MiniCssExtractPlugin({
      filename: "css/[name]",
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
    }),
  ],
  externals: {
    jquery: "jQuery",
  },
  resolve: {
    modules: ["node_modules", "dev/js/scripts"],
    extensions: [".js", ".jsx", ".ts", ".css"],
  },
  performance: {hints: false},
};
