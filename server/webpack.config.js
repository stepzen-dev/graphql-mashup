const path = require('path');
const slsw = require('serverless-webpack');

module.exports = {
  entry: slsw.lib.entries,
  mode: 'production',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.resolve('.webpack'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.mjs'],
  },
};