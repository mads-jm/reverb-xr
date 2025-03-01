/**
 * Spotify SDK Loader
 * This module ensures the Spotify Web Playback SDK is properly loaded
 * and the callback function is correctly exposed in a webpack environment
 */

/**
 * Load the Spotify Web Playback SDK
 * @returns {Promise} Promise that resolves when the SDK is ready
 */
export function loadSpotifySDK() {
  return new Promise((resolve, reject) => {
    // Check if SDK is already loaded
    if (window.Spotify) {
      console.log('Spotify SDK already loaded');
      resolve(window.Spotify);
      return;
    }

    // Define the callback function that Spotify SDK will call when ready
    // Explicitly attach to window to ensure it's globally accessible in webpack
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify Web Playback SDK is ready');
      if (window.Spotify) {
        resolve(window.Spotify);
      } else {
        reject(new Error('Spotify SDK loaded but Spotify object not found'));
      }
    };

    // Load the SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    
    // Handle load errors
    script.onerror = () => {
      reject(new Error('Failed to load Spotify SDK'));
    };

    // Append the script to the document
    document.body.appendChild(script);
  });
}

/**
 * Initialize a Spotify Player instance
 * @param {string} token - Spotify access token
 * @returns {Object} Spotify Player instance
 */
export function createSpotifyPlayer(token) {
  if (!window.Spotify) {
    throw new Error('Spotify SDK not loaded');
  }
  
  return new window.Spotify.Player({
    name: 'Reverb XR Audio Visualizer',
    getOAuthToken: cb => cb(token)
  });
} 