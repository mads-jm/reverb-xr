/**
 * Webpack Build and Run Script
 * Provides commands to build and run the Reverb XR Audio Visualizer
 */
import { exec } from 'child_process';
import { access, mkdir } from 'fs/promises';
import path from 'path';

// Check if chalk is installed and use it, otherwise fallback to console methods
let chalk;
try {
  chalk = require('chalk');
} catch (e) {
  // If chalk is not available, create a simple polyfill
  chalk = {
    blue: (str) => str,
    green: (str) => str,
    yellow: (str) => str,
    red: (str) => str,
    cyan: (str) => str
  };
}

// Check if required dependencies are installed
const dependencies = ['webpack', 'webpack-cli', 'webpack-dev-server'];
const missingDeps = [];

// Helper to run shell commands
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`> ${command}`));
    const process = exec(command);
    
    process.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    process.stderr.on('data', (data) => {
      console.error(chalk.yellow(data.toString()));
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
  });
};

// Check if directories exist
const checkDirectories = async () => {
  try {
    // Check if src directory exists
    await access('./src');
    
    // Check if dist directory exists, create if it doesn't
    try {
      await access('./dist');
    } catch (err) {
      console.log(chalk.yellow('dist directory not found, creating it...'));
      await mkdir('./dist');
    }
    
    // Check if public directory exists
    try {
      await access('./public');
    } catch (err) {
      console.log(chalk.yellow('public directory not found, make sure you have static assets if needed'));
    }
    
    return true;
  } catch (err) {
    console.error(chalk.red('Error checking directories:'), err.message);
    return false;
  }
};

// Development build and serve
const devBuild = async () => {
  console.log(chalk.green('📦 Starting development build...'));
  
  try {
    const dirsOk = await checkDirectories();
    if (!dirsOk) return;
    
    await runCommand('npx webpack --mode development');
    console.log(chalk.green('✅ Development build completed!'));
  } catch (err) {
    console.error(chalk.red('❌ Development build failed:'), err.message);
  }
};

// Production build
const prodBuild = async () => {
  console.log(chalk.green('📦 Starting production build...'));
  
  try {
    const dirsOk = await checkDirectories();
    if (!dirsOk) return;
    
    await runCommand('npx webpack --mode production');
    console.log(chalk.green('✅ Production build completed!'));
  } catch (err) {
    console.error(chalk.red('❌ Production build failed:'), err.message);
  }
};

// Run development server
const devServer = async () => {
  console.log(chalk.green('🚀 Starting development server...'));
  
  try {
    await runCommand('npx webpack serve --mode development --open');
  } catch (err) {
    console.error(chalk.red('❌ Development server failed:'), err.message);
  }
};

// Build and run development server
const buildAndServe = async () => {
  await devBuild();
  await devServer();
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'dev':
    devBuild();
    break;
  case 'prod':
    prodBuild();
    break;
  case 'serve':
    devServer();
    break;
  case 'start':
    buildAndServe();
    break;
  default:
    console.log(`
${chalk.cyan('Reverb XR Webpack Build Script')}

Usage:
  ${chalk.yellow('node webpack-scripts.js <command>')}

Commands:
  ${chalk.green('dev')}    - Build for development
  ${chalk.green('prod')}   - Build for production
  ${chalk.green('serve')}  - Start development server
  ${chalk.green('start')}  - Build for development and start server

Examples:
  ${chalk.blue('node webpack-scripts.js dev')}    - Build project for development
  ${chalk.blue('node webpack-scripts.js prod')}   - Build project for production
  ${chalk.blue('node webpack-scripts.js serve')}  - Start webpack-dev-server
  ${chalk.blue('node webpack-scripts.js start')}  - Build and start server
    `);
} 