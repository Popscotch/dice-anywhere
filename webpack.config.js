const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {

  mode: 'development',

  performance: {
    maxAssetSize: 1048576,
    maxEntrypointSize: 1048576,
  },

  entry: './src/app.ts',

  plugins: [
    new HtmlWebpackPlugin({
      title: 'Dice Anywhere',
    }),
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },

  // file resolutions
  resolve: {
    extensions: [ '.ts', '.js' ],
    fallback: { 
      "path": false,
      "fs": false
    }
  },

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.tsx?/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  
  devServer: {
    static: './dist',
    allowedHosts: 'auto'
  },

};