/**
 * Webpack configuration for the Reverb XR Audio Visualizer
 * Handles bundling for both main application and A-Frame visualizer
 */
import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import dotenv from 'dotenv';

// Load environment variables
const env = dotenv.config().parsed || {};

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  // Determine if we're in production mode
  const isProduction = argv.mode === 'production';
  
  // Base configuration
  const config = {
    mode: argv.mode || 'development',
    entry: {
      main: './src/main.js',
      home: './src/stages/home.js'
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      publicPath: '/',
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        }
      ]
    },
    plugins: [
      // Main application HTML
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        chunks: ['main'],
        inject: true,
        favicon: 'favicon.ico'
      }),
      
      // A-Frame visualizer HTML - Use a specific option to handle existing scripts
      new HtmlWebpackPlugin({
        template: './src/stages/home.html',
        filename: 'stages/home.html',
        chunks: ['home'],
        inject: 'body',
        scriptLoading: 'blocking',
      }),
      
      // Spotify callback HTML
      new HtmlWebpackPlugin({
        template: './src/callback.html',
        filename: 'callback.html',
        chunks: [],
        inject: false,
      }),
      
      // Copy static assets with proper MIME types
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: 'src/scripts',
            to: 'scripts',
            noErrorOnMissing: true,
            transform(content, path) {
              // Ensure JavaScript files have proper MIME type
              if (path.endsWith('.js')) {
                return content;
              }
              return content;
            },
            info: { 
              minimized: true,
              javascriptModule: true 
            }
          },
          { 
            from: 'src/assets',
            to: 'assets',
            noErrorOnMissing: true
          },
          {
            from: 'src/favicon.ico',
            to: 'favicon.ico',
            noErrorOnMissing: true
          }
        ]
      }),
      
      // Inject environment variables
      new webpack.DefinePlugin({
        'process.env': JSON.stringify({
          ...env,
          NODE_ENV: process.env.NODE_ENV || argv.mode || 'development'
        }),
        // Explicitly expose SPOTIFY_CLIENT_ID to the client-side code as a global variable
        'SPOTIFY_CLIENT_ID': JSON.stringify(process.env.SPOTIFY_CLIENT_ID || ''),
        // Add a debug flag to help with troubleshooting
        '__ENV_DEBUG__': JSON.stringify({
          NODE_ENV: process.env.NODE_ENV || argv.mode || 'development',
          HAS_SPOTIFY_ID: !!process.env.SPOTIFY_CLIENT_ID,
          BUILD_TIME: new Date().toISOString()
        })
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
        publicPath: '/',
        watch: true,
        serveIndex: true
      },
      devMiddleware: {
        writeToDisk: true
      },
      compress: true,
      port: 8080,
      hot: true,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
      }
    },
    resolve: {
      extensions: ['.js', '.json'],
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        scripts: path.resolve(__dirname, 'src/scripts/'),
        assets: path.resolve(__dirname, 'src/assets/'),
      },
    },
    // External dependencies loaded via CDN
    externals: {
      'three': 'THREE',
      'aframe': 'AFRAME'
    }
  };

  // Development server configuration - only applied in development
  if (!isProduction) {
    config.devServer = {
      static: {
        directory: path.join(__dirname, 'dist'),
        publicPath: '/',
        watch: true,
      },
      compress: true,
      port: 8080,
      hot: true,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
      }
    };
  }
  
  return config;
}; 