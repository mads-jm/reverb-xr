# Reverb XR Audio Visualizer Build Guide

This document explains how to build and run the Reverb XR Audio Visualizer using Webpack.

## Prerequisites

Before building the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/) (version 14.x or higher recommended)
- npm (comes with Node.js)
- npx (comes with npm 5.2.0+)

## Build Options

The project can be built in two modes:

- **Development**: Includes source maps, debugging information, and is not minified
- **Production**: Optimized, minified code for deployment

## Building and Running the Project

There are several ways to build and run the project:

### Using npm scripts

The simplest way to build and run the project is using npm scripts defined in `package.json`:

```bash
# Development build
npm run dev

# Production build
npm run build

# Start development server (with hot reloading)
npm start

# Build for development and start the server
npm run build:dev
```

### Using Batch Script (Windows)

For Windows users, a batch script is provided for convenience:

```bash
# Show help
build.bat help

# Development build
build.bat dev

# Production build
build.bat prod

# Start development server
build.bat serve

# Build for development and start server
build.bat start
```

### Using Shell Script (Unix/Mac/Linux)

For Unix-based systems, a shell script is provided:

```bash
# Make the script executable (one-time setup)
chmod +x build.sh

# Show help
./build.sh help

# Development build
./build.sh dev

# Production build
./build.sh prod

# Start development server
./build.sh serve

# Build for development and start server
./build.sh start
```

### Using Node.js Script Directly

You can also use the Node.js script directly:

```bash
# Show help
node webpack-scripts.js

# Development build
node webpack-scripts.js dev

# Production build
node webpack-scripts.js prod

# Start development server
node webpack-scripts.js serve

# Build for development and start server
node webpack-scripts.js start
```

## Build Process Details

### Development Build

The development build process:

1. Checks if required directories exist
2. Compiles the project with webpack in development mode
3. Outputs to the `dist` directory

### Production Build

The production build process:

1. Checks if required directories exist
2. Compiles and optimizes the project with webpack in production mode
3. Outputs minified code to the `dist` directory

### Development Server

The development server:

1. Builds the project in development mode (if using `start` or `build:dev`)
2. Starts webpack-dev-server
3. Opens your default browser automatically
4. Enables hot module replacement for rapid development

## Troubleshooting

### Missing Dependencies

If you encounter errors about missing dependencies, run:

```bash
npm install
```

This will install all dependencies listed in `package.json`.

For specific webpack-related dependencies:

```bash
npm install --save-dev webpack webpack-cli webpack-dev-server
```

### Common Issues

#### Error: 'webpack' is not recognized as an internal or external command

If you see this error, there are two possible solutions:

1. **Install webpack globally** (not recommended for project consistency):
   ```bash
   npm install -g webpack webpack-cli webpack-dev-server
   ```

2. **Use npx** (recommended):
   The build scripts have been updated to use `npx` which will use the local installation of webpack. Make sure you have:
   - npm version 5.2.0 or higher (check with `npm -v`)
   - All webpack dependencies installed locally

If you still encounter this error, ensure webpack is properly installed in your project:
```bash
npm install --save-dev webpack webpack-cli webpack-dev-server
```

#### Error: Module not found

Make sure all import paths in your code are correct and that the files exist.

#### Error: Cannot find module 'chalk'

If you see an error about the chalk module, install it:

```bash
npm install --save-dev chalk
```

#### Module Type Issues with webpack-scripts.js

If you encounter errors related to ES modules vs CommonJS when running `webpack-scripts.js`, the script has been updated to use CommonJS format which is compatible with direct Node.js execution.

## Additional Notes

- The build scripts automatically create the `dist` directory if it doesn't exist
- Static assets from the `public` directory are copied to the `dist` directory during build
- The webpack configuration is defined in `webpack.config.js` and can be modified for custom build needs
- All build scripts now use `npx` to ensure they use the local webpack installation rather than requiring a global installation 