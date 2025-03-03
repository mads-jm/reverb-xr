/**
 * Environment variables check utility
 * Provides debugging tools for environment variables
 */

/**
 * Check and log the status of environment variables
 * @returns {Object} Status of environment variables
 */
export function checkEnvironmentVariables() {
  console.group('Environment Variables Check');
  
  // Check for direct webpack injection
  const hasWebpackVar = typeof SPOTIFY_CLIENT_ID !== 'undefined';
  console.log('SPOTIFY_CLIENT_ID global variable exists:', hasWebpackVar);
  
  // Check process.env (if available)
  const hasProcessEnv = typeof process !== 'undefined' && 
                       process.env && 
                       typeof process.env.SPOTIFY_CLIENT_ID !== 'undefined';
  console.log('process.env.SPOTIFY_CLIENT_ID exists:', hasProcessEnv);
  
  // Check window.APP_CONFIG
  const hasAppConfig = window.APP_CONFIG && window.APP_CONFIG.SPOTIFY_CLIENT_ID;
  console.log('window.APP_CONFIG.SPOTIFY_CLIENT_ID exists:', hasAppConfig);
  
  // Log the values (first few chars only for security)
  if (hasWebpackVar && SPOTIFY_CLIENT_ID) {
    console.log('SPOTIFY_CLIENT_ID value (first 5 chars):', 
      SPOTIFY_CLIENT_ID.substring(0, 5) + '...');
  }
  
  if (hasAppConfig) {
    console.log('APP_CONFIG.SPOTIFY_CLIENT_ID:', 
      window.APP_CONFIG.SPOTIFY_CLIENT_ID.substring(0, 5) + '...');
  }
  
  console.groupEnd();
  
  return {
    hasWebpackVar,
    hasProcessEnv,
    hasAppConfig
  };
}

/**
 * Initialize environment variables from various sources
 * @returns {Object} Updated APP_CONFIG object
 */
export function initializeEnvironmentVariables() {
  // Ensure APP_CONFIG exists
  window.APP_CONFIG = window.APP_CONFIG || {};
  
  console.log('Initializing environment variables...');
  
  // Try various sources for the Spotify Client ID
  if (typeof SPOTIFY_CLIENT_ID !== 'undefined' && SPOTIFY_CLIENT_ID) {
    window.APP_CONFIG.SPOTIFY_CLIENT_ID = SPOTIFY_CLIENT_ID;
    console.log('Loaded SPOTIFY_CLIENT_ID from webpack injection');
  } 
  else if (typeof process !== 'undefined' && process.env && process.env.SPOTIFY_CLIENT_ID) {
    window.APP_CONFIG.SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    console.log('Loaded SPOTIFY_CLIENT_ID from process.env');
  }
  else {
    window.APP_CONFIG.SPOTIFY_CLIENT_ID = '';
    console.warn('No SPOTIFY_CLIENT_ID found. Spotify integration will not work.');
    console.log('Please set SPOTIFY_CLIENT_ID in your Vercel environment variables.');
  }
  
  return window.APP_CONFIG;
} 