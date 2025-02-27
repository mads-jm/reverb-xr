/**
 * Main application controller for audio visualization
 * Handles UI interactions, audio source selection, and visualization data processing
 */
document.addEventListener('DOMContentLoaded', () => {
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
  const dataOutput = document.getElementById('data-output');
  const aframeIframe = document.getElementById('aframe-iframe');
  const spotifyControls = document.getElementById('spotify-controls');
  const spotifyLogin = document.getElementById('spotify-login');
  const nowPlaying = document.getElementById('now-playing');

  // Lazy loading variables for Spotify
  let spotifyProcessor = null;
  let spotifySDKLoaded = false;

  // Demo track URL
  const DEMO_TRACK_URL = 'https://cdn.pixabay.com/audio/2025/01/09/audio_ebb251db8d.mp3';
  
  // Current URL audio state
  let currentUrlAudio = null;
  let isUrlAudioPlaying = false;

  // ====== AUDIO SOURCE SELECTION ======
  
  /**
   * Handle microphone selection
   */
  micOption.addEventListener('change', () => {
    if (micOption.checked) {
      updateUIForMicrophoneMode();
    }
  });

  /**
   * Handle file input selection
   */
  fileOption.addEventListener('change', () => {
    if (fileOption.checked) {
      updateUIForFileMode();
    }
  });

  /**
   * Handle URL input selection
   */
  urlOption.addEventListener('change', () => {
    if (urlOption.checked) {
      updateUIForUrlMode();
    }
  });

  /**
   * Handle Spotify selection
   */
  spotifyOption.addEventListener('change', () => {
    if (spotifyOption.checked) {
      updateUIForSpotifyMode();
    } else {
      spotifyControls.style.display = 'none';
      systemAudioContainer.style.display = 'none';
      
      // Show the now playing container again
      document.querySelector('.now-playing-container').style.display = 'flex';
    }
  });

  /**
   * Handle system audio selection
   */
  systemAudioOption.addEventListener('change', () => {
    if (systemAudioOption.checked) {
      updateUIForSystemAudioMode();
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
  startMicButton.addEventListener('click', () => {
    audioProcessor.initMicrophone();
    nowPlaying.textContent = 'Microphone';
    console.log("Microphone initialized");
  });

  /**
   * Handle system audio start button click
   */
  startSystemAudioButton.addEventListener('click', async () => {
    try {
      showSystemAudioInstructions();
      await audioProcessor.initMicrophone();
      nowPlaying.textContent = 'System Audio (via Mic)';
      console.log("System audio capture initialized");
    } catch (error) {
      console.error('Error starting system audio capture:', error);
      dataOutput.textContent = 'Error: ' + error.message;
    }
  });

  /**
   * Handle file selection
   */
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      audioProcessor.initFile(file);
      nowPlaying.textContent = file.name;
      console.log("Audio file initialized:", file.name);
    }
  });

  /**
   * Handle demo track button click
   */
  demoTrackButton.addEventListener('click', () => {
    audioProcessor.stopCurrentSource();
    audioProcessor.initFromUrl(DEMO_TRACK_URL)
      .then(() => {
        nowPlaying.textContent = 'Demo Track';
        console.log("Demo track initialized");
      })
      .catch(error => {
        console.error('Error playing demo track:', error);
        dataOutput.textContent = 'Error: ' + error.message;
      });
  });

  /**
   * Handle URL play button click
   */
  playUrlButton.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
      audioProcessor.stopCurrentSource();
      audioProcessor.initFromUrl(url)
        .then(() => {
          urlModal.style.display = 'none';
          nowPlaying.textContent = 'URL: ' + url.substring(0, 30) + (url.length > 30 ? '...' : '');
          isUrlAudioPlaying = true;
          updatePlayPauseButton();
          console.log("URL audio initialized:", url);
          // Store the URL as current audio source
          currentUrlAudio = url;
          // Add play/pause control to the UI after successfully loading the URL
          addPlayPauseControl();
        })
        .catch(error => {
          console.error('Error playing audio from URL:', error);
          alert('Error loading audio: ' + error.message);
        });
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
    audioProcessor.stopCurrentSource();
    
    // Show the now playing container
    document.querySelector('.now-playing-container').style.display = 'flex';
    
    // Remove the play/pause control if it exists
    const audioControls = document.querySelector('.audio-controls');
    if (audioControls) {
      audioControls.remove();
    }
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
    audioProcessor.stopCurrentSource();
    
    // Show the now playing container
    document.querySelector('.now-playing-container').style.display = 'flex';
    
    // Remove the play/pause control if it exists
    const audioControls = document.querySelector('.audio-controls');
    if (audioControls) {
      audioControls.remove();
    }
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
    audioProcessor.stopCurrentSource();
    
    // Show the now playing container
    document.querySelector('.now-playing-container').style.display = 'flex';
    
    // If we have a URL stored, add the play/pause control
    if (currentUrlAudio) {
      addPlayPauseControl();
    }
  }
  
  /**
   * Update UI for Spotify mode
   */
  function updateUIForSpotifyMode() {
    // Only load Spotify components when needed
    loadSpotifyComponents();
    showSpotifyControls();
    // Show system audio option when Spotify is selected
    systemAudioContainer.style.display = 'flex';
    systemAudioOption.disabled = false;
    startMicButton.disabled = true;
    fileInput.disabled = true;
    openUrlModalButton.disabled = true;
    audioProcessor.stopCurrentSource();
    
    // Hide the now playing container
    document.querySelector('.now-playing-container').style.display = 'none';
    
    // Remove the play/pause control if it exists
    const audioControls = document.querySelector('.audio-controls');
    if (audioControls) {
      audioControls.remove();
    }
  }
  
  /**
   * Update UI for system audio mode
   */
  function updateUIForSystemAudioMode() {
    startSystemAudioButton.disabled = false;
    startMicButton.disabled = true;
    fileInput.disabled = true;
    openUrlModalButton.disabled = true;
    audioProcessor.stopCurrentSource();
    
    // Remove the play/pause control if it exists
    const audioControls = document.querySelector('.audio-controls');
    if (audioControls) {
      audioControls.remove();
    }
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
      // Create the processor directly
      spotifyProcessor = new SpotifyProcessor(audioProcessor);
      
      // Get references to DOM elements
      const spotifyLogin = document.getElementById('spotify-login');
      const spotifyPlayerContainer = document.getElementById('spotify-player-container');
      
      // Check if elements exist before trying to access them
      if (!spotifyLogin) {
        console.error('Element with ID "spotify-login" not found in the DOM');
        return;
      }
      
      if (!spotifyPlayerContainer) {
        console.error('Element with ID "spotify-player-container" not found in the DOM');
        return;
      }
      
      // Check if we have a valid token
      if (spotifyProcessor.checkAuth()) {
        spotifyLogin.style.display = 'none';
        spotifyPlayerContainer.style.display = 'block';
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

  /**
   * Add play/pause control to the UI
   */
  function addPlayPauseControl() {
    // Check if control already exists
    if (!document.querySelector('.audio-controls')) {
      const nowPlayingContainer = document.querySelector('.now-playing-container');
      
      // Create audio controls container
      const audioControls = document.createElement('div');
      audioControls.className = 'audio-controls';
      
      // Create play/pause button
      const playPauseButton = document.createElement('button');
      playPauseButton.className = 'play-pause-button';
      playPauseButton.textContent = isUrlAudioPlaying ? '⏸' : '▶'; 
      playPauseButton.addEventListener('click', togglePlayPause);
      
      // Add to container
      audioControls.appendChild(playPauseButton);
      nowPlayingContainer.appendChild(audioControls);
    } else {
      updatePlayPauseButton();
    }
  }
  
  /**
   * Toggle play/pause for current audio
   */
  function togglePlayPause() {
    if (isUrlAudioPlaying) {
      audioProcessor.pauseCurrentSource();
      isUrlAudioPlaying = false;
    } else if (currentUrlAudio) {
      audioProcessor.resumeCurrentSource();
      isUrlAudioPlaying = true;
    }
    updatePlayPauseButton();
  }
  
  /**
   * Update the play/pause button appearance
   */
  function updatePlayPauseButton() {
    const playPauseButton = document.querySelector('.play-pause-button');
    if (playPauseButton) {
      playPauseButton.textContent = isUrlAudioPlaying ? '⏸' : '▶';
    }
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
});
