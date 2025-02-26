class SpotifyProcessor {
  constructor(audioProcessor) {
    this.audioProcessor = audioProcessor;
    this.player = null;
    this.deviceId = null;
    this.isAuthorized = false;
    
    // Get client ID from the generated config
    this.clientId = window.APP_CONFIG?.SPOTIFY_CLIENT_ID || '';
    
    // Set redirect URI based on current domain
    this.redirectUri = window.location.origin + '/callback.html';
    this.analyserNode = null;
    this.audioCtx = null;
    this.currentTrack = null;
    this.playbackInterval = null;
    
    // Validate configuration
    if (!this.clientId) {
      console.error('Spotify Client ID not configured. Spotify integration will not work.');
    } else {
      console.log('Spotify Client ID loaded successfully');
    }
  }

  // Authorization method
  authorize() {
    // Generate a random state value for security
    const state = this.generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);

    // Define the scopes needed for your application
    // Note: we're using user-read-playback-state instead of streaming
    const scope = 'user-read-playback-state user-read-currently-playing user-modify-playback-state';

    // Redirect to Spotify authorization page
    window.location.href = 'https://accounts.spotify.com/authorize' +
      '?response_type=token' +
      '&client_id=' + encodeURIComponent(this.clientId) +
      '&scope=' + encodeURIComponent(scope) +
      '&redirect_uri=' + encodeURIComponent(this.redirectUri) +
      '&state=' + encodeURIComponent(state);
  }

  // Check if we have a valid token
  checkAuth() {
    const params = this.getHashParams();
    const storedState = localStorage.getItem('spotify_auth_state');
    
    if (params.access_token && (params.state == null || params.state === storedState)) {
      this.accessToken = params.access_token;
      this.isAuthorized = true;
      
      // Clear the hash parameters from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Start monitoring current playback
      this.startPlaybackMonitoring();
      
      return true;
    } else {
      return false;
    }
  }

  // Start monitoring the user's current Spotify playback
  startPlaybackMonitoring() {
    // Check immediately
    this.getCurrentPlayback();
    
    // Then check every 3 seconds
    this.playbackInterval = setInterval(() => {
      this.getCurrentPlayback();
    }, 3000);
  }

  // Stop monitoring
  stopPlaybackMonitoring() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  // Get the user's current playback state
  async getCurrentPlayback() {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.status === 204) {
        // No active device
        this.updateNowPlaying(null, 'No active Spotify playback');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.item) {
        this.updateNowPlaying(null, 'Nothing playing');
        return;
      }
      
      // Update the current track info
      this.currentTrack = {
        name: data.item.name,
        artist: data.item.artists.map(a => a.name).join(', '),
        album: data.item.album.name,
        albumArt: data.item.album.images[0]?.url,
        isPlaying: data.is_playing
      };
      
      // Update the UI
      this.updateNowPlaying(
        this.currentTrack,
        this.currentTrack.isPlaying ? 'Now Playing' : 'Paused'
      );
      
    } catch (error) {
      console.error('Error fetching current playback:', error);
      this.updateNowPlaying(null, 'Error fetching playback');
    }
  }

  // Update the UI with current playback info
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

  // Play/Pause the current track
  async togglePlayback() {
    if (!this.isAuthorized) return;
    
    try {
      // Get current state first
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.status === 204) {
        alert('No active Spotify device found. Start playing in your Spotify app first.');
        return;
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
      this.getCurrentPlayback();
      
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }

  // Skip to next track
  async nextTrack() {
    if (!this.isAuthorized) return;
    
    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      // Wait a moment for Spotify to update
      setTimeout(() => this.getCurrentPlayback(), 500);
      
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  }

  // Skip to previous track
  async previousTrack() {
    if (!this.isAuthorized) return;
    
    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      // Wait a moment for Spotify to update
      setTimeout(() => this.getCurrentPlayback(), 500);
      
    } catch (error) {
      console.error('Error skipping to previous track:', error);
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

  // Clean up when done
  cleanup() {
    this.stopPlaybackMonitoring();
  }
} 