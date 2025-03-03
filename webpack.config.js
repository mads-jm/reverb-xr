/**
 * Webpack configuration for the Reverb XR Audio Visualizer
 * Handles bundling for both main application and A-Frame visualizer
 */
import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: argv.mode || 'development',
    entry: {
      main: './src/main.js',
      visualizer: './src/stages/visualizer.js'
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      publicPath: '/',
      module: true,
      library: {
        type: 'module'
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  modules: false,
                  targets: {
                    browsers: ['last 2 versions', 'not dead']
                  }
                }]
              ]
            }
          },
          type: 'javascript/esm'
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        chunks: ['main']
      }),
      new HtmlWebpackPlugin({
        template: './src/stages/home.html',
        filename: 'stages/home.html',
        chunks: ['visualizer']
      }),
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: 'src/scripts',
            to: 'scripts'
          },
          { 
            from: 'src/assets',
            to: 'assets',
            noErrorOnMissing: true
          },
          {
            from: 'favicon.ico',
            to: 'favicon.ico',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    resolve: {
      extensions: ['.js', '.json'],
      modules: [path.resolve(__dirname, 'src'), 'node_modules']
    },
    experiments: {
      topLevelAwait: true,
      outputModule: true
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
        publicPath: '/'
      },
      compress: true,
      port: 8080,
      hot: true,
      historyApiFallback: true
    }
  };
};