/**
 * Path resolver utility for managing URLs in development and production
 * Helps with resolving correct paths for assets and pages
 */

/**
 * Resolves a relative path to handle both development and production environments
 * In development, might need to handle paths differently than in production
 * 
 * @param {string} path - The relative path to resolve
 * @returns {string} - The resolved path
 */
export function resolvePath(path) {
  // Remove leading slash if it exists
  if (path.startsWith('/')) {
    path = path.substring(1);
  }

  // In production, paths will be relative to the root
  // In development with webpack-dev-server, paths are also relative to root
  // This function could be expanded to handle CDN paths or other scenarios
  
  return path;
}

/**
 * Resolves an asset path (images, sounds, etc)
 * 
 * @param {string} path - The relative path to the asset
 * @returns {string} - The resolved asset path
 */
export function resolveAssetPath(path) {
  // For assets, we may want different handling
  return 'assets/' + path.replace(/^assets\//, '');
}

/**
 * Detects if the app is running in development or production mode
 * 
 * @returns {boolean} - True if running in development
 */
export function isDevelopment() {
  // Check if webpack's development flag is set
  // For webpack 5, we need to check if the process object exists first
  try {
    // This will be replaced by webpack's DefinePlugin
    return typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
  } catch (e) {
    // If process is not defined (or some other error), assume development
    return true;
  }
}

// Export a default object with all utilities
export default {
  resolvePath,
  resolveAssetPath,
  isDevelopment
}; 