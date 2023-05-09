const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'web',

  entry: path.resolve(__dirname, 'src/index.ts'),
  output: {
    filename: 'webview.js',
    path: path.resolve(__dirname, '../extension/dist/'),
    library: {
      type: 'commonjs'
    }
  },
  devtool: 'eval-source-map',
  mode: 'development',

  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader']
      },
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
      },
      {
        test: /\.css$/,
        exclude: /(codicon|\.useable)\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /codicon.css$/,
        use: ['ignore-loader']
      }
    ]
  },
  ignoreWarnings: [/Failed to parse source map/, /Can't resolve .* in '.*ws\/lib'/]
};

module.exports = config;
