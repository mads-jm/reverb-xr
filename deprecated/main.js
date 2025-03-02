// First import the path resolver
import { resolvePath } from './scripts/utils/pathResolver.js';

// Then import other modules using the resolver (but keep relative paths in the import statements)
import { GPUAudioProcessor } from './scripts/audio/GPUAudioProcessor.js';
import { AudioProcessor } from './scripts/audio/AudioProcessor.js';
import { SpotifyProcessor } from './scripts/audio/SpotifyProcessor.js';

/**
 * Main application controller for audio visualization
 * Handles UI interactions, audio source selection, and visualization data processing
 */
document.addEventListener('DOMContentLoaded', () => {
  // Make path resolver globally available
  window.resolvePath = resolvePath;
  
  // ====== INITIALIZATION ======
  
  /**
   * Initialize the audio processor with configuration
   * @type {GPUAudioProcessor}
   */
  const audioProcessor = new GPUAudioProcessor({
    debugMode: true, // Enable debugging initially
    fftSize: 1024,   // Reduced size for better performance
    smoothingTimeConstant: 0.6 // Less smoothing for more responsive visuals
  });

  // DOM element references
  const micOption = document.getElementById('mic-option');
  const fileOption = document.getElementById('file-option');
  const urlOption = document.getElementById('url-option');
  const spotifyOption = document.getElementById('spotify-option');
  const systemAudioOption = document.getElementById('system-audio-option');
  const systemAudioContainer = document.getElementById('system-audio-container');
  const startMicButton = document.getElementById('start-mic');
  const startSystemAudioButton = document.getElementById('start-system-audio');
  const fileInput = document.getElementById('file-input');
  const openUrlModalButton = document.getElementById('open-url-modal');
  const urlModal = document.getElementById('url-modal');
  const urlInput = document.getElementById('url-input');
  const playUrlButton = document.getElementById('play-url-button');
  const cancelUrlButton = document.getElementById('cancel-url-button');
  const closeModalButton = document.querySelector('.close-modal');
  const demoTrackButton = document.getElementById('demo-track-button');
  const playPauseButton = document.getElementById('play-pause-button');
  const playbackControls = document.getElementById('playback-controls');
  const dataOutput = document.getElementById('data-output');
  const aframeIframe = document.getElementById('aframe-iframe');
  const spotifyControls = document.getElementById('spotify-controls');
  const spotifyLogin = document.getElementById('spotify-login');
  const nowPlaying = document.getElementById('now-playing');

  // Lazy loading variables for Spotify
  let spotifyProcessor = null;
  let spotifySDKLoaded = false;

  // Track current audio state
  let isAudioPlaying = false;
  let currentAudioType = null; // 'demo', 'file', 'url', 'mic', etc.
  let currentUrlAudio = null;

  // Demo track URL
  const DEMO_TRACK_URL = 'https://cdn.pixabay.com/audio/2025/01/09/audio_ebb251db8d.mp3';
  
  // ====== AUDIO SOURCE SELECTION ======
  
  /**
   * Handle microphone selection
   */
  micOption.addEventListener('change', () => {
    if (micOption.checked) {
      switchAudioSource('mic');
    }
  });

  /**
   * Handle file input selection
   */
  fileOption.addEventListener('change', () => {
    if (fileOption.checked) {
      switchAudioSource('file');
    }
  });

  /**
   * Handle URL input selection
   */
  urlOption.addEventListener('change', () => {
    if (urlOption.checked) {
      switchAudioSource('url');
    }
  });

  /**
   * Handle Spotify selection
   */
  spotifyOption.addEventListener('change', () => {
    if (spotifyOption.checked) {
      switchAudioSource('spotify');
    }
  });

  /**
   * Handle system audio selection
   */
  systemAudioOption.addEventListener('change', () => {
    if (systemAudioOption.checked) {
      switchAudioSource('system');
    }
  });

  /**
   * Handle opening URL modal
   */
  openUrlModalButton.addEventListener('click', () => {
    urlModal.style.display = 'block';
    urlInput.focus();
  });

  /**
   * Handle URL modal close button
   */
  closeModalButton.addEventListener('click', () => {
    urlModal.style.display = 'none';
  });

  /**
   * Handle URL modal cancel button
   */
  cancelUrlButton.addEventListener('click', () => {
    urlModal.style.display = 'none';
  });

  /**
   * Close the modal when clicking outside of it
   */
  window.addEventListener('click', (event) => {
    if (event.target === urlModal) {
      urlModal.style.display = 'none';
    }
  });

  // ====== AUDIO CONTROL BUTTONS ======
  
  /**
   * Handle microphone start button click
   */
  startMicButton.addEventListener('click', async () => {
    try {
      await audioProcessor.initMicrophone();
      nowPlaying.textContent = 'Microphone (Visualization Only)';
      currentAudioType = 'mic';
      // Microphone doesn't need play/pause control
      removePlayPauseControl();
      console.log("Microphone initialized for visualization only");
      
      // Optionally alert the user that the microphone is for visualization only
      if (!localStorage.getItem('micAlertShown')) {
        alert('Microphone is used for visualization only. Audio output is muted to prevent feedback.');
        localStorage.setItem('micAlertShown', 'true');
      }
    } catch (error) {
      console.error('Error initializing microphone:', error);
      nowPlaying.textContent = 'Microphone error';
      alert('Could not access microphone: ' + error.message);
    }
  });

  /**
   * Handle system audio start button click
   */
  startSystemAudioButton.addEventListener('click', async () => {
    try {
      showSystemAudioInstructions();
      await audioProcessor.initMicrophone();
      nowPlaying.textContent = 'System Audio (Visualization Only)';
      currentAudioType = 'system';
      // System audio doesn't need play/pause control
      removePlayPauseControl();
      console.log("System audio capture initialized for visualization only");
      
      // Make it clear that this is for visualization only
      alert('System audio capture is enabled for visualization only. The audio from your system will not be played back through the browser to prevent feedback.');
    } catch (error) {
      console.error('Error starting system audio capture:', error);
      nowPlaying.textContent = 'System Audio error';
      alert('Error: ' + error.message);
    }
  });

  /**
   * Handle file selection
   */
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (file) {
      // Stop previous source first
      if (audioProcessor.isActive) {
        audioProcessor.stop();
      }
      
      await audioProcessor.initFile(file);
      nowPlaying.textContent = file.name;
      
      // Update audio state
      isAudioPlaying = true;
      currentAudioType = 'file';
      
      // Add play/pause control
      addPlayPauseControl();
      
      console.log("File initialized:", file.name);
    }
  });

  /**
   * Handle demo track button click
   */
  demoTrackButton.addEventListener('click', () => {
    switchAudioSource('demo');
  });

  /**
   * Handle URL play button click
   */
  playUrlButton.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (url) {
      // Stop previous source first
      if (audioProcessor.isActive) {
        audioProcessor.stop();
      }
      
      try {
        // For URL audio, we need to create a File object from the URL
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: response.headers.get('content-type') });
        const file = new File([blob], url.split('/').pop(), { type: blob.type });
        
        await audioProcessor.initFile(file);
        urlModal.style.display = 'none';
        nowPlaying.textContent = 'URL: ' + url.substring(0, 30) + (url.length > 30 ? '...' : '');
        
        // Update audio state
        isAudioPlaying = true;
        currentAudioType = 'url';
        currentUrlAudio = url;
        
        // Add play/pause control
        addPlayPauseControl();
        
        console.log("URL audio initialized:", url);
      } catch (error) {
        console.error('Error playing audio from URL:', error);
        alert('Error loading audio: ' + error.message);
      }
    }
  });

  // ====== AUDIO DATA PROCESSING ======
  
  /**
   * Continuously send audio data to A-Frame for visualization
   * Called recursively with requestAnimationFrame
   */
  function sendAudioDataToAFrame() {
    // Force the analyzer to update data by calling these methods
    const frequencyData = audioProcessor.getFrequencyDataForAPI();
    const timeDomainData = audioProcessor.getTimeDomainDataForAPI();
    
    // Print summary stats occasionally
    if (Math.random() < 0.01) { // ~1% of frames
      const freqStats = calculateStats(frequencyData);
      console.log("Sending frequency data stats:", freqStats);
    }
    
    // Send to iframe if it's loaded
    if (aframeIframe.contentWindow) {
      aframeIframe.contentWindow.postMessage({ type: 'frequencyData', data: frequencyData }, '*');
      aframeIframe.contentWindow.postMessage({ type: 'timeDomainData', data: timeDomainData }, '*');
    }
    
    requestAnimationFrame(sendAudioDataToAFrame);
  }
  
  /**
   * Calculate statistics for audio data arrays
   * @param {Uint8Array} data - The audio data array
   * @returns {Object} Object containing min, max, avg, and nonZeroPercent stats
   */
  function calculateStats(data) {
    if (!data || data.length === 0) return { min: 0, max: 0, avg: 0 };
    
    let min = 255, max = 0, sum = 0;
    for (let i = 0; i < data.length; i++) {
      min = Math.min(min, data[i]);
      max = Math.max(max, data[i]);
      sum += data[i];
    }
    
    return {
      min,
      max,
      avg: (sum / data.length).toFixed(2),
      nonZeroPercent: ((data.filter(v => v > 0).length / data.length) * 100).toFixed(1) + '%'
    };
  }

  // ====== UI MANAGEMENT HELPERS ======
  
  /**
   * Update UI for microphone mode
   */
  function updateUIForMicrophoneMode() {
    startMicButton.disabled = false;
    startSystemAudioButton.disabled = true;
    fileInput.disabled = true;
    openUrlModalButton.disabled = true;
    spotifyControls.style.display = 'none';
    systemAudioContainer.style.display = 'none';
    
    // Stop any currently active audio
    if (audioProcessor.isActive) {
      audioProcessor.stop();
    }
    
    // Show the now playing container
    document.querySelector('.now-playing-container').style.display = 'flex';
    
    // Microphone input doesn't use play/pause control
    removePlayPauseControl();
    
    // Reset audio state
    isAudioPlaying = false;
    currentAudioType = null;
  }
  
  /**
   * Update UI for file input mode
   */
  function updateUIForFileMode() {
    fileInput.disabled = false;
    openUrlModalButton.disabled = true;
    startMicButton.disabled = true;
    startSystemAudioButton.disabled = true;
    spotifyControls.style.display = 'none';
    systemAudioContainer.style.display = 'none';
    
    // If audio is currently playing, stop it
    if (audioProcessor.isActive) {
      audioProcessor.stop();
      isAudioPlaying = false;
      currentAudioType = null;
    }
    
    // Show the now playing container
    document.querySelector('.now-playing-container').style.display = 'flex';
    
    // File mode starts with no file, so no play/pause control initially
    removePlayPauseControl();
  }
  
  /**
   * Update UI for URL input mode
   */
  function updateUIForUrlMode() {
    openUrlModalButton.disabled = false;
    startMicButton.disabled = true;
    startSystemAudioButton.disabled = true;
    fileInput.disabled = true;
    spotifyControls.style.display = 'none';
    systemAudioContainer.style.display = 'none';
    
    // If audio is currently playing and not URL, stop it
    if (audioProcessor.isActive && currentAudioType !== 'url') {
      audioProcessor.stop();
      isAudioPlaying = false;
    }
    
    // Show the now playing container
    document.querySelector('.now-playing-container').style.display = 'flex';
    
    // If we have a URL loaded and that was our previous source, restore the play/pause button
    if (currentUrlAudio && currentAudioType === 'url') {
      addPlayPauseControl();
    } else {
      removePlayPauseControl();
      currentAudioType = null;
    }
  }
  
  /**
   * Update UI for Spotify mode
   */
  function updateUIForSpotifyMode() {
    // Only load Spotify components when needed
    loadSpotifyComponents();
    showSpotifyControls();
    
    // Show system audio option when Spotify is selected but hide the radio button
    systemAudioContainer.style.display = 'flex';
    systemAudioOption.style.display = 'none'; // Hide the radio button
    systemAudioOption.disabled = true; // Disable it to prevent interactions
    startSystemAudioButton.disabled = false; // Enable the start button
    
    // Make the label text clearer since there's no radio button
    const systemAudioLabel = document.querySelector('label[for="system-audio-option"]');
    if (systemAudioLabel) {
      systemAudioLabel.textContent = "Capture System Audio:";
    }
    
    startMicButton.disabled = true;
    fileInput.disabled = true;
    openUrlModalButton.disabled = true;
    
    // If audio is currently playing, stop it
    if (audioProcessor.isActive) {
      audioProcessor.stop();
      isAudioPlaying = false;
      currentAudioType = null;
    }
    
    // Hide the now playing container
    document.querySelector('.now-playing-container').style.display = 'none';
    
    // Spotify has its own controls
    removePlayPauseControl();
  }
  
  /**
   * Update UI for system audio mode
   */
  function updateUIForSystemAudioMode() {
    startSystemAudioButton.disabled = false;
    startMicButton.disabled = true;
    fileInput.disabled = true;
    openUrlModalButton.disabled = true;
    
    // If audio is currently playing, stop it
    if (audioProcessor.isActive) {
      audioProcessor.stop();
      isAudioPlaying = false;
      currentAudioType = null;
    }
    
    // System audio doesn't need play/pause control
    removePlayPauseControl();
  }
  
  /**
   * Show instructions for system audio capture
   */
  function showSystemAudioInstructions() {
    alert('Please play music on Spotify and make sure your microphone can capture system audio.\n\n' +
          'On Windows: Enable "Stereo Mix" in sound settings\n' +
          'On Mac: Use Soundflower or BlackHole\n' +
          'On mobile: Place device near speakers');
  }

  // ====== VISUALIZATION CONTROLS ======
  
  /**
   * Set up toggle controls for visualization elements
   */
  function setupToggleControls() {
    // Function to send toggle commands to iframe
    function toggleElement(elementType, visible) {
      aframeIframe.contentWindow.postMessage({
        type: 'toggle',
        element: elementType,
        visible: visible
      }, '*');
    }
    
    // Set up event listeners for toggle controls
    document.querySelectorAll('.toggle-control').forEach(control => {
      control.addEventListener('change', function() {
        toggleElement(this.dataset.element, this.checked);
      });
    });
  }

  // ====== SPOTIFY INTEGRATION ======

  /**
   * Load Spotify SDK and initialize components
   */
  function loadSpotifyComponents() {
    // Only load the SDK once
    if (!spotifySDKLoaded) {
      // Load Spotify SDK dynamically
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
      
      // Set up SDK ready callback
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('Spotify Web Playback SDK is ready');
        spotifySDKLoaded = true;
        initializeSpotifyProcessor();
      };
    } else if (!spotifyProcessor) {
      // SDK already loaded, just initialize the processor
      initializeSpotifyProcessor();
    }
  }

  /**
   * Initialize the Spotify processor and UI elements
   */
  function initializeSpotifyProcessor() {
    // Only create the processor if it doesn't exist
    if (!spotifyProcessor) {
      // Get the singleton instance
      spotifyProcessor = SpotifyProcessor.getInstance();
      
      // Get references to DOM elements
      const spotifyLogin = document.getElementById('spotify-login');
      const spotifyPlayerContainer = document.getElementById('spotify-player-container');
      
      // Check if elements exist before trying to access them
      if (!spotifyLogin || !spotifyPlayerContainer) {
        console.error('Spotify UI elements not found in the DOM');
        return;
      }
      
      // Check if we have a valid token
      if (spotifyProcessor.checkAuth()) {
        spotifyLogin.style.display = 'none';
        spotifyPlayerContainer.style.display = 'block';
        
        // Connect to Spotify (initializes audio context)
        spotifyProcessor.connectToSpotify();
      } else {
        spotifyLogin.style.display = 'block';
        spotifyPlayerContainer.style.display = 'none';
      }
      
      // Set up event listeners
      setupSpotifyEventListeners();
      
      // Update the note about audio visualization
      const spotifyNote = document.querySelector('.spotify-note p');
      if (spotifyNote) {
        spotifyNote.innerHTML = 'Start playing in your Spotify app, then control here!<br>' +
                               '<strong>For visualization:</strong> Select "System Audio" option and click Start.';
      }
    }
  }

  /**
   * Set up event listeners for Spotify controls
   */
  function setupSpotifyEventListeners() {
    console.log('Setting up Spotify event listeners');
    
    // Login button
    const loginButton = document.getElementById('spotify-login');
    if (loginButton) {
      loginButton.removeEventListener('click', spotifyLoginHandler); // Remove any existing listeners
      loginButton.addEventListener('click', spotifyLoginHandler);
      console.log('Spotify login button listener attached');
    }
    
    // Play/Pause button
    const playPauseButton = document.getElementById('spotify-play-pause');
    if (playPauseButton) {
      playPauseButton.addEventListener('click', () => {
        console.log('Play/Pause clicked');
        if (spotifyProcessor) {
          spotifyProcessor.togglePlayback();
        }
      });
    }
    
    // Next track button
    const nextButton = document.getElementById('spotify-next');
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        console.log('Next track clicked');
        if (spotifyProcessor) {
          spotifyProcessor.nextTrack();
        }
      });
    }
    
    // Previous track button
    const prevButton = document.getElementById('spotify-prev');
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        console.log('Previous track clicked');
        if (spotifyProcessor) {
          spotifyProcessor.previousTrack();
        }
      });
    }
  }

  /**
   * Handle Spotify login button click
   */
  function spotifyLoginHandler() {
    console.log('Spotify login button clicked');
    if (spotifyProcessor) {
      spotifyProcessor.authorize();
    } else {
      console.error('Spotify processor not initialized');
    }
  }

  /**
   * Show Spotify control UI
   */
  function showSpotifyControls() {
    // Hide other controls
    startMicButton.disabled = true;
    fileInput.disabled = true;
    
    // Show Spotify controls
    spotifyControls.style.display = 'block';
  }

  /**
   * Search for tracks on Spotify
   * @returns {Promise<void>}
   */
  async function searchSpotify() {
    if (!spotifyProcessor) return;
    
    const query = document.getElementById('spotify-search').value.trim();
    if (!query) return;
    
    try {
      const results = await spotifyProcessor.searchTracks(query);
      displaySearchResults(results.tracks.items);
    } catch (error) {
      console.error('Error searching Spotify:', error);
    }
  }

  /**
   * Display Spotify search results
   * @param {Array} tracks - Array of track objects from Spotify API
   */
  function displaySearchResults(tracks) {
    const spotifyResults = document.getElementById('spotify-results');
    const spotifyTrackName = document.getElementById('spotify-track-name');
    
    spotifyResults.innerHTML = '';
    
    tracks.forEach(track => {
      const trackElement = document.createElement('div');
      trackElement.className = 'track-result';
      trackElement.innerHTML = `
        <div class="track-info">
          <div class="track-name">${track.name}</div>
          <div class="track-artist">${track.artists[0].name}</div>
        </div>
      `;
      
      trackElement.addEventListener('click', () => {
        spotifyProcessor.playTrack(track.uri);
        spotifyTrackName.textContent = `${track.name} - ${track.artists[0].name}`;
      });
      
      spotifyResults.appendChild(trackElement);
    });
  }

  // ====== APPLICATION STARTUP ======
  
  // Start sending data
  sendAudioDataToAFrame();
  
  // Disable debug mode after 10 seconds to avoid console spam
  setTimeout(() => {
    audioProcessor.setDebugMode(false);
    console.log("Debug mode disabled to reduce console output");
  }, 10000);
  
  // Set up toggle controls
  setupToggleControls();

  // Set up event listener for play/pause button
  playPauseButton.addEventListener('click', togglePlayPause);

  /**
   * Toggle play/pause for current audio
   */
  function togglePlayPause() {
    console.log("Toggle play/pause clicked, current state:", isAudioPlaying);
    
    if (isAudioPlaying) {
      audioProcessor.pause();
      isAudioPlaying = false;
    } else {
      audioProcessor.play();
      isAudioPlaying = true;
    }
    
    updatePlayPauseButton();
  }
  
  /**
   * Update the play/pause button appearance
   */
  function updatePlayPauseButton() {
    if (playPauseButton) {
      playPauseButton.textContent = isAudioPlaying ? '⏸' : '▶';
      console.log("Updated play/pause button to:", playPauseButton.textContent);
    }
  }
  
  /**
   * Add play/pause control to the UI
   */
  function addPlayPauseControl() {
    // Show the playback controls
    playbackControls.style.display = 'block';
    
    // Update button state
    updatePlayPauseButton();
  }
  
  /**
   * Remove play/pause control from the UI
   */
  function removePlayPauseControl() {
    playbackControls.style.display = 'none';
  }

  // Get reference to volume slider
  const volumeSlider = document.getElementById('volume-slider');

  /**
   * Handle volume slider changes
   */
  volumeSlider.addEventListener('input', () => {
    // Get volume from slider (0-100) and normalize to 0-1
    const rawVolume = parseFloat(volumeSlider.value);
    const volume = rawVolume / 100;
    
    // Set volume on audio processor (which sets volume on its internal gain node)
    audioProcessor.setVolume(volume);
    
    // Update volume icon based on level
    const volumeIcon = document.querySelector('.volume-icon');
    if (volume === 0) {
      volumeIcon.textContent = '🔇';
    } else if (volume < 0.5) {
      volumeIcon.textContent = '🔉';
    } else {
      volumeIcon.textContent = '🔊';
    }
    
    console.log("Volume changed to:", volume, "(raw slider value:", rawVolume, ")");
  });

  /**
   * Set initial volume on audio processor
   */
  audioProcessor.setVolume(1.0); // Set default volume

  /**
   * Switch to a new audio source, properly cleaning up the previous one
   * @param {string} sourceType - Type of source to switch to ('mic', 'file', 'url', 'spotify', 'system', 'demo')
   */
  function switchAudioSource(sourceType) {
    console.log(`Switching audio source to: ${sourceType}`);
    
    // Stop the current source first
    if (audioProcessor.isActive) {
      audioProcessor.stop();
    }
    
    // Reset audio state
    isAudioPlaying = false;
    
    // Update current audio type
    currentAudioType = sourceType;
    
    // Reset UI elements based on new source type
    resetUIForSourceSwitch();
    
    // Apply source-specific UI updates
    switch (sourceType) {
      case 'mic':
        updateUIForMicrophoneMode();
        break;
      case 'file':
        updateUIForFileMode();
        break;
      case 'url':
        updateUIForUrlMode();
        break;
      case 'spotify':
        updateUIForSpotifyMode();
        break;
      case 'system':
        updateUIForSystemAudioMode();
        break;
      case 'demo':
        // Demo is a special case, we actually start playback immediately
        playDemoTrack();
        break;
    }
    
    // Ensure volume is set correctly
    const volume = parseFloat(volumeSlider.value);
    audioProcessor.setVolume(volume);
    
    console.log(`Audio source switched to ${sourceType}`);
  }

  /**
   * Reset all UI elements to a default state before switching sources
   */
  function resetUIForSourceSwitch() {
    // Hide the playback controls by default
    playbackControls.style.display = 'none';
    
    // Reset the now playing text
    nowPlaying.textContent = 'None';
    
    // Ensure all input controls are disabled by default
    startMicButton.disabled = true;
    startSystemAudioButton.disabled = true;
    fileInput.disabled = true;
    openUrlModalButton.disabled = true;
    
    // Hide Spotify controls
    spotifyControls.style.display = 'none';
    
    // Hide system audio container
    systemAudioContainer.style.display = 'none';
    
    // Show all radio buttons by default (we'll hide specific ones later if needed)
    systemAudioOption.style.display = 'inline-block';
    
    // Reset any custom label text
    const systemAudioLabel = document.querySelector('label[for="system-audio-option"]');
    if (systemAudioLabel) {
      systemAudioLabel.textContent = "System Audio (via Mic)";
    }
    
    // Show the now playing container
    document.querySelector('.now-playing-container').style.display = 'flex';
  }

  /**
   * Play the demo track
   */
  async function playDemoTrack() {
    // Show that we're loading
    nowPlaying.textContent = 'Loading Demo Track...';
    
    try {
      // For demo track, fetch the file and create a File object
      const response = await fetch(DEMO_TRACK_URL);
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: response.headers.get('content-type') });
      const file = new File([blob], 'demo-track.mp3', { type: 'audio/mpeg' });
      
      await audioProcessor.initFile(file);
      nowPlaying.textContent = 'Demo Track';
      
      // Update audio state
      isAudioPlaying = true;
      currentAudioType = 'demo';
      
      // Add play/pause control
      addPlayPauseControl();
      
      console.log("Demo track initialized");
    } catch (error) {
      console.error('Error playing demo track:', error);
      alert('Error playing demo track: ' + error.message);
      nowPlaying.textContent = 'Error: Demo Track Failed';
    }
  }

  /**
   * Restart the current audio source
   * Useful when something breaks and you need to reset the audio system
   */
  function restartCurrentSource() {
    // Only if we have an active audio type
    if (currentAudioType) {
      // Save the current type
      const savedType = currentAudioType;
      
      // Stop everything
      if (audioProcessor.isActive) {
        audioProcessor.stop();
      }
      
      // Wait a tiny bit for the audio context to reset
      setTimeout(() => {
        // Restart with the same source type
        switchAudioSource(savedType);
      }, 100);
    }
  }
});
