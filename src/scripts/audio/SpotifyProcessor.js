// Import required modules
import { AudioProcessor } from './AudioProcessor.js';
import { SpotifyAPIHandler } from '../SpotifyAPIHandler.js';

/**
 * Audio processor with Spotify integration
 * Handles audio processing aspects while delegating API interactions to SpotifyAPIHandler
 */
export class SpotifyProcessor extends AudioProcessor {
  constructor() {
    // Create a new instance instead of reusing the AudioProcessor singleton
    super(); // Initialize AudioProcessor
    this.enhanceWithSpotify(this);
    
    // Store the Spotify-enhanced singleton
    SpotifyProcessor.instance = this;
  }
  
  /**
   * Add Spotify capabilities to an AudioProcessor instance
   * @param {AudioProcessor} instance The instance to enhance
   */
  enhanceWithSpotify(instance) {
    // Create SpotifyAPIHandler instance directly
    try {
      instance.spotifyAPI = new SpotifyAPIHandler();
      console.log('SpotifyAPIHandler initialized successfully');
      
      // Set up event handler for track changes
      instance.spotifyAPI.onPlaybackUpdate((track, status) => {
        instance.updateNowPlaying(track, status);
      });
    } catch (error) {
      console.error('Error initializing SpotifyAPIHandler:', error);
    }
    
    // Register event handlers
    instance.onTrackChange = null;
    instance.isPlaying = false;
    
    // Flag to track Spotify integration
    instance.hasSpotifyCapabilities = true;
  }
  
  /**
   * Get the singleton instance of SpotifyProcessor
   * @returns {SpotifyProcessor} The singleton instance
   */
  static getInstance() {
    if (!SpotifyProcessor.instance) {
      console.log('Creating new SpotifyProcessor instance in getInstance()');
      SpotifyProcessor.instance = new SpotifyProcessor();
      
      // Verify that SpotifyAPIHandler was created
      if (!SpotifyProcessor.instance.spotifyAPI) {
        console.warn('SpotifyAPIHandler not created in getInstance() - creating now');
        try {
          SpotifyProcessor.instance.spotifyAPI = new SpotifyAPIHandler();
          console.log('SpotifyAPIHandler created in getInstance()');
        } catch (error) {
          console.error('Failed to create SpotifyAPIHandler in getInstance():', error);
        }
      }
    }
    return SpotifyProcessor.instance;
  }

  /**
   * Start the Spotify authorization flow
   */
  authorize() {
    // Check if spotifyAPI is available
    if (!this.spotifyAPI) {
      console.error('SpotifyAPI not initialized');
      
      // Create it directly
      try {
        this.spotifyAPI = new SpotifyAPIHandler();
        console.log('SpotifyAPIHandler initialized on demand');
        
        // Now authorize
        this.spotifyAPI.authorize();
      } catch (error) {
        console.error('Failed to create SpotifyAPIHandler:', error);
        alert('Failed to initialize Spotify integration. Please reload the page.');
      }
      return;
    }
    
    // If we have the API handler, use it
    try {
      this.spotifyAPI.authorize();
    } catch (error) {
      console.error('Error during authorization:', error);
      alert('Error authorizing with Spotify: ' + error.message);
    }
  }

  /**
   * Check if we have a valid token
   * @returns {boolean} Whether we're authorized
   */
  checkAuth() {
    return this.spotifyAPI.isAuthorized;
  }

  /**
   * Connect to current Spotify playback
   */
  async connectToSpotify() {
    if (!this.spotifyAPI.isAuthorized) {
      console.error('Not authorized with Spotify');
      return;
    }
    
    try {
      // Check if there's an active device
      const hasDevice = await this.spotifyAPI.hasActiveDevice();
      
      if (!hasDevice) {
        alert('No active Spotify device found. Start playing in your Spotify app first.');
        return;
      }
      
      // Set our state to active
      if (!this.isActive) {
        this.isActive = true;
        this.audioContext.resume();
        
        // Start polling for current track info
        this.spotifyAPI.startPlaybackMonitoring();
        
        console.log('Connected to Spotify playback');
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
    }
  }
  
  /**
   * Override stop to handle Spotify cleanup
   */
  stop() {
    // Call the parent class stop method
    super.stop();
    
    // Add Spotify-specific cleanup
    if (this.spotifyAPI) {
      this.spotifyAPI.stopPlaybackMonitoring();
    }
    
    console.log('Spotify processor stopped');
  }

  /**
   * Update the UI with current playback info
   * @param {Object|null} track Track information
   * @param {string} status Status message
   */
  updateNowPlaying(track, status) {
    const trackNameElement = document.getElementById('spotify-track-name');
    const trackArtistElement = document.getElementById('spotify-track-artist');
    const trackAlbumArtElement = document.getElementById('spotify-album-art');
    const trackStatusElement = document.getElementById('spotify-status');
    const nowPlayingElement = document.getElementById('now-playing');
    
    if (trackNameElement) {
      trackNameElement.textContent = track ? track.name : 'No track';
    }
    
    if (trackArtistElement) {
      trackArtistElement.textContent = track ? track.artist : '';
    }
    
    if (trackAlbumArtElement) {
      if (track && track.albumArt) {
        trackAlbumArtElement.src = track.albumArt;
        trackAlbumArtElement.style.display = 'block';
      } else {
        trackAlbumArtElement.style.display = 'none';
      }
    }
    
    if (trackStatusElement) {
      trackStatusElement.textContent = status;
    }
    
    // Also update the main "Now Playing" display if system audio is not active
    const systemAudioOption = document.getElementById('system-audio-option');
    if (nowPlayingElement && track && (!systemAudioOption || !systemAudioOption.checked)) {
      nowPlayingElement.textContent = `Spotify: ${track.name} - ${track.artist}`;
    }
  }

  /**
   * Overrides the play method from AudioProcessor
   */
  async play() {
    await super.play();
    
    // If we have Spotify integration, also try to resume Spotify playback
    if (this.spotifyAPI && this.spotifyAPI.isAuthorized && 
        this.spotifyAPI.currentTrack && !this.spotifyAPI.currentTrack.isPlaying) {
      await this.spotifyAPI.play();
    }
  }

  /**
   * Overrides the pause method from AudioProcessor
   */
  async pause() {
    await super.pause();
    
    // If we have Spotify integration, also try to pause Spotify playback
    if (this.spotifyAPI && this.spotifyAPI.isAuthorized && 
        this.spotifyAPI.currentTrack && this.spotifyAPI.currentTrack.isPlaying) {
      await this.spotifyAPI.pause();
    }
  }

  /**
   * Play/Pause the current track (Toggle)
   */
  async togglePlayback() {
    if (!this.spotifyAPI || !this.spotifyAPI.isAuthorized) return;
    
    const newIsPlaying = await this.spotifyAPI.togglePlayback();
    
    // Also update our AudioProcessor state
    if (newIsPlaying) {
      await this.play();
    } else {
      await this.pause();
    }
  }

  /**
   * Skip to next track
   */
  async nextTrack() {
    if (this.spotifyAPI) {
      await this.spotifyAPI.nextTrack();
    }
  }

  /**
   * Skip to previous track
   */
  async previousTrack() {
    if (this.spotifyAPI) {
      await this.spotifyAPI.previousTrack();
    }
  }
  
  /**
   * Search for tracks
   * @param {string} query Search term
   * @returns {Promise<Object>} Search results
   */
  async searchTracks(query) {
    if (this.spotifyAPI) {
      return await this.spotifyAPI.searchTracks(query);
    }
    return { tracks: { items: [] } };
  }
  
  /**
   * Play a specific track by URI
   * @param {string} uri Track URI
   */
  async playTrack(uri) {
    if (this.spotifyAPI) {
      await this.spotifyAPI.playTrack(uri);
    }
  }

  /**
   * Clean up when done
   */
  cleanup() {
    if (this.spotifyAPI) {
      this.spotifyAPI.cleanup();
    }
    this.stop();
  }
  
  /**
   * Get frequency data for API
   * @returns {Uint8Array} Frequency data array
   */
  getFrequencyDataForAPI() {
    // If we're connected to Spotify and have a current track
    if (this.spotifyAPI && this.spotifyAPI.isAuthorized && 
        this.spotifyAPI.currentTrack && this.spotifyAPI.currentTrack.isPlaying) {
      // Generate placeholder data based on the track info
      this.generateMockAudioData();
    }
    
    // Call the base class method to get the data
    return super.getFrequencyDataForAPI();
  }
  
  /**
   * Method to create interesting visualization data
   */
  generateMockAudioData() {
    // Create a pseudo-random but consistent pattern for the currently playing track
    if (!this.spotifyAPI || !this.spotifyAPI.currentTrack) return;
    
    const trackId = this.spotifyAPI.currentTrack.name + this.spotifyAPI.currentTrack.artist;
    const seed = this.spotifyAPI.hashString(trackId);
    
    // Generate frequency data that looks somewhat musical
    for (let i = 0; i < this.dataArray.length; i++) {
      // Create a value based on index, seed, and some oscillations
      const time = Date.now() / 1000;
      const value = Math.abs(
        Math.sin(i * 0.01 + seed * 0.1) * 0.5 + 
        Math.sin(i * 0.05 + time) * 0.3 + 
        Math.sin(time * 2 + i * 0.01) * 0.2
      );
      
      // Scale to 0-255 range
      this.dataArray[i] = Math.floor(value * 255);
    }
  }
} 