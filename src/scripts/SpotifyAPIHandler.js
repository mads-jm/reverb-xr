/**
 * Handles all Spotify API interactions
 * Separates API concerns from audio processing
 */
export class SpotifyAPIHandler {
  constructor() {
    // Get client ID from various sources
    this.clientId = this.getClientId();
                    
    this.redirectUri = window.location.origin + '/callback.html';
    this.accessToken = null;
    this.isAuthorized = false;
    this.currentTrack = null;
    this.playbackInterval = null;
    this.playbackCallback = null;
    
    // Validate configuration
    if (!this.clientId) {
      console.error('Spotify Client ID not configured. Spotify integration will not work.');
      console.log('Please set SPOTIFY_CLIENT_ID in your Vercel environment variables.');
    } else {
      console.log('Spotify Client ID loaded successfully:', this.clientId.substring(0, 5) + '...');
    }
    
    // Check if we're returning from an auth flow
    this.checkAuth();
  }
  
  /**
   * Get the Spotify client ID from available sources
   * @returns {string} The client ID if found, empty string otherwise
   */
  getClientId() {
    // First check APP_CONFIG
    if (window.APP_CONFIG && window.APP_CONFIG.SPOTIFY_CLIENT_ID) {
      console.log('Found Spotify Client ID in APP_CONFIG');
      return window.APP_CONFIG.SPOTIFY_CLIENT_ID;
    }
    
    // Then check global variable from webpack injection
    if (typeof SPOTIFY_CLIENT_ID !== 'undefined' && SPOTIFY_CLIENT_ID) {
      console.log('Found Spotify Client ID from webpack injection');
      return SPOTIFY_CLIENT_ID;
    }
    
    // Then check process.env (though this rarely works client-side)
    if (typeof process !== 'undefined' && process.env && process.env.SPOTIFY_CLIENT_ID) {
      console.log('Found Spotify Client ID in process.env');
      return process.env.SPOTIFY_CLIENT_ID;
    }
    
    console.warn('No Spotify Client ID found from any source');
    return '';
  }
  
  /**
   * Start the Spotify authorization flow
   */
  authorize() {
    // Generate a random state value for security
    const state = this.generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);

    // Define the scopes needed for your application
    const scope = 'user-read-playback-state user-read-currently-playing user-modify-playback-state';

    // Redirect to Spotify authorization page
    window.location.href = 'https://accounts.spotify.com/authorize' +
      '?response_type=token' +
      '&client_id=' + encodeURIComponent(this.clientId) +
      '&scope=' + encodeURIComponent(scope) +
      '&redirect_uri=' + encodeURIComponent(this.redirectUri) +
      '&state=' + encodeURIComponent(state);
  }

  /**
   * Check if user is authenticated with Spotify
   * @returns {boolean} True if authenticated, false otherwise
   */
  checkAuth() {
    // First check for token in localStorage (set by callback.html)
    const storedToken = localStorage.getItem('spotify_access_token');
    const tokenExpires = localStorage.getItem('spotify_token_expires');
    
    if (storedToken) {
      // Check if token is expired
      if (tokenExpires && parseInt(tokenExpires) > Date.now()) {
        this.accessToken = storedToken;
        this.isAuthorized = true;
        console.log('Using Spotify token from localStorage');
        return true;
      } else {
        // Token expired
        console.log('Spotify token expired, clearing');
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_type');
        localStorage.removeItem('spotify_token_expires');
      }
    }
    
    // Fallback to checking URL hash params (legacy method)
    const params = this.getHashParams();
    const storedState = localStorage.getItem('spotify_auth_state');
    
    if (params.access_token && (params.state == null || params.state === storedState)) {
      this.accessToken = params.access_token;
      this.isAuthorized = true;
      
      // Clear the hash parameters from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Register a callback to receive track updates
   * @param {Function} callback Function to call with track updates
   */
  onPlaybackUpdate(callback) {
    this.playbackCallback = callback;
  }

  /**
   * Begin monitoring Spotify playback
   */
  startPlaybackMonitoring() {
    // Check immediately
    this.getCurrentPlayback();
    
    // Then check every 3 seconds
    this.playbackInterval = setInterval(() => {
      this.getCurrentPlayback();
    }, 3000);
  }

  /**
   * Stop monitoring playback state
   */
  stopPlaybackMonitoring() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  /**
   * Check if Spotify has an active device
   * @returns {Promise<boolean>} Whether a device is active
   */
  async hasActiveDevice() {
    if (!this.isAuthorized) return false;
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      return response.status !== 204;
    } catch (error) {
      console.error('Error checking for active device:', error);
      return false;
    }
  }

  /**
   * Get the current playback state from Spotify
   */
  async getCurrentPlayback() {
    if (!this.isAuthorized) {
      return this.notifyPlaybackUpdate(null, 'Not authorized');
    }
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.status === 204) {
        // No active device
        return this.notifyPlaybackUpdate(null, 'No active Spotify playback');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.item) {
        return this.notifyPlaybackUpdate(null, 'Nothing playing');
      }
      
      // Update the current track info
      this.currentTrack = {
        name: data.item.name,
        artist: data.item.artists.map(a => a.name).join(', '),
        album: data.item.album.name,
        albumArt: data.item.album.images[0]?.url,
        isPlaying: data.is_playing,
        uri: data.item.uri
      };
      
      // Notify any listeners
      this.notifyPlaybackUpdate(
        this.currentTrack,
        this.currentTrack.isPlaying ? 'Now Playing' : 'Paused'
      );
      
      return this.currentTrack;
    } catch (error) {
      console.error('Error fetching current playback:', error);
      return this.notifyPlaybackUpdate(null, 'Error fetching playback');
    }
  }
  
  /**
   * Notify callback about playback updates
   * @param {Object|null} track Track information
   * @param {string} status Status message
   */
  notifyPlaybackUpdate(track, status) {
    if (this.playbackCallback) {
      this.playbackCallback(track, status);
    }
    return track;
  }

  /**
   * Toggle play/pause state
   */
  async togglePlayback() {
    if (!this.isAuthorized) return false;
    
    try {
      // Get current state first
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.status === 204) {
        alert('No active Spotify device found. Start playing in your Spotify app first.');
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      const isPlaying = data.is_playing;
      
      // Send the opposite command
      await fetch(`https://api.spotify.com/v1/me/player/${isPlaying ? 'pause' : 'play'}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      // Update immediately
      setTimeout(() => this.getCurrentPlayback(), 500);
      
      return !isPlaying; // Return the new state
    } catch (error) {
      console.error('Error toggling playback:', error);
      return false;
    }
  }
  
  /**
   * Resume playback
   */
  async play() {
    if (!this.isAuthorized) return false;
    
    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      // Update immediately
      setTimeout(() => this.getCurrentPlayback(), 500);
      return true;
    } catch (error) {
      console.error('Error resuming Spotify playback:', error);
      return false;
    }
  }
  
  /**
   * Pause playback
   */
  async pause() {
    if (!this.isAuthorized) return false;
    
    try {
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      // Update immediately
      setTimeout(() => this.getCurrentPlayback(), 500);
      return true;
    } catch (error) {
      console.error('Error pausing Spotify playback:', error);
      return false;
    }
  }

  /**
   * Skip to next track
   */
  async nextTrack() {
    if (!this.isAuthorized) return false;
    
    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      // Wait a moment for Spotify to update
      setTimeout(() => this.getCurrentPlayback(), 500);
      return true;
    } catch (error) {
      console.error('Error skipping to next track:', error);
      return false;
    }
  }

  /**
   * Skip to previous track
   */
  async previousTrack() {
    if (!this.isAuthorized) return false;
    
    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      // Wait a moment for Spotify to update
      setTimeout(() => this.getCurrentPlayback(), 500);
      return true;
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      return false;
    }
  }
  
  /**
   * Search for tracks
   * @param {string} query Search term
   * @returns {Promise<Object>} Search results
   */
  async searchTracks(query) {
    if (!this.isAuthorized) return { tracks: { items: [] } };
    
    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching tracks:', error);
      return { tracks: { items: [] } };
    }
  }
  
  /**
   * Play a specific track by URI
   * @param {string} uri Track URI
   */
  async playTrack(uri) {
    if (!this.isAuthorized) return false;
    
    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          uris: [uri]
        })
      });
      
      // Update immediately
      setTimeout(() => this.getCurrentPlayback(), 500);
      return true;
    } catch (error) {
      console.error('Error playing track:', error);
      return false;
    }
  }

  // Helper method to parse hash parameters
  getHashParams() {
    const hashParams = {};
    let e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  // Generate a random string for the state parameter
  generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    this.stopPlaybackMonitoring();
  }
  
  /**
   * Simple hash function to convert a string to a numeric seed
   * @param {string} str Input string
   * @returns {number} Hash value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
} 