document.addEventListener('DOMContentLoaded', () => {
  // Initialize with debug mode
  const audioProcessor = new GPUAudioProcessor({
    debugMode: true, // Enable debugging initially
    fftSize: 1024,   // Reduced size for better performance
    smoothingTimeConstant: 0.6 // Less smoothing for more responsive visuals
  });

  const micOption = document.getElementById('mic-option');
  const fileOption = document.getElementById('file-option');
  const spotifyOption = document.getElementById('spotify-option');
  const systemAudioOption = document.getElementById('system-audio-option');
  const systemAudioContainer = document.getElementById('system-audio-container');
  const startMicButton = document.getElementById('start-mic');
  const startSystemAudioButton = document.getElementById('start-system-audio');
  const fileInput = document.getElementById('file-input');
  const dataOutput = document.getElementById('data-output');
  const aframeIframe = document.getElementById('aframe-iframe');
  const spotifyControls = document.getElementById('spotify-controls');
  const spotifyLogin = document.getElementById('spotify-login');
  const nowPlaying = document.getElementById('now-playing');

  // Lazy loading variables
  let spotifyProcessor = null;
  let spotifySDKLoaded = false;

  // Set up audio source option event listeners
  micOption.addEventListener('change', () => {
    if (micOption.checked) {
      startMicButton.disabled = false;
      startSystemAudioButton.disabled = true;
      fileInput.disabled = true;
      spotifyControls.style.display = 'none';
      systemAudioContainer.style.display = 'none';
      audioProcessor.stopCurrentSource();
      
      // Show the now playing container
      document.querySelector('.now-playing-container').style.display = 'flex';
    }
  });

  fileOption.addEventListener('change', () => {
    if (fileOption.checked) {
      fileInput.disabled = false;
      startMicButton.disabled = true;
      startSystemAudioButton.disabled = true;
      spotifyControls.style.display = 'none';
      systemAudioContainer.style.display = 'none';
      audioProcessor.stopCurrentSource();
      
      // Show the now playing container
      document.querySelector('.now-playing-container').style.display = 'flex';
    }
  });

  spotifyOption.addEventListener('change', () => {
    if (spotifyOption.checked) {
      // Only load Spotify components when needed
      loadSpotifyComponents();
      showSpotifyControls();
      // Show system audio option when Spotify is selected
      systemAudioContainer.style.display = 'flex';
      systemAudioOption.disabled = false;
      startMicButton.disabled = true;
      fileInput.disabled = true;
      audioProcessor.stopCurrentSource();
      
      // Hide the now playing container
      document.querySelector('.now-playing-container').style.display = 'none';
    } else {
      spotifyControls.style.display = 'none';
      systemAudioContainer.style.display = 'none';
      
      // Show the now playing container again
      document.querySelector('.now-playing-container').style.display = 'flex';
    }
  });

  systemAudioOption.addEventListener('change', () => {
    if (systemAudioOption.checked) {
      startSystemAudioButton.disabled = false;
      startMicButton.disabled = true;
      fileInput.disabled = true;
      audioProcessor.stopCurrentSource();
    }
  });

  // Start microphone button
  startMicButton.addEventListener('click', () => {
    audioProcessor.initMicrophone();
    nowPlaying.textContent = 'Microphone';
    console.log("Microphone initialized");
  });

  // Start system audio button
  startSystemAudioButton.addEventListener('click', async () => {
    try {
      // Show instructions to the user
      alert('Please play music on Spotify and make sure your microphone can capture system audio.\n\n' +
            'On Windows: Enable "Stereo Mix" in sound settings\n' +
            'On Mac: Use Soundflower or BlackHole\n' +
            'On mobile: Place device near speakers');
            
      await audioProcessor.initMicrophone();
      nowPlaying.textContent = 'System Audio (via Mic)';
      console.log("System audio capture initialized");
    } catch (error) {
      console.error('Error starting system audio capture:', error);
      dataOutput.textContent = 'Error: ' + error.message;
    }
  });

  // File input handler
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      audioProcessor.initFile(file);
      nowPlaying.textContent = file.name;
      console.log("Audio file initialized:", file.name);
    }
  });

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
  
  // Helper to calculate data statistics
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

  // Start sending data
  sendAudioDataToAFrame();
  
  // Disable debug mode after 10 seconds to avoid console spam
  setTimeout(() => {
    audioProcessor.setDebugMode(false);
    console.log("Debug mode disabled to reduce console output");
  }, 10000);
  
  // Set up toggle controls
  setupToggleControls();
  
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

  spotifyOption.addEventListener('change', () => {
    if (spotifyOption.checked) {
      // Only load Spotify components when needed
      loadSpotifyComponents();
      showSpotifyControls();
      audioProcessor.stopCurrentSource();
    } else {
      spotifyControls.style.display = 'none';
    }
  });

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

  function spotifyLoginHandler() {
    console.log('Spotify login button clicked');
    if (spotifyProcessor) {
      spotifyProcessor.authorize();
    } else {
      console.error('Spotify processor not initialized');
    }
  }

  function showSpotifyControls() {
    // Hide other controls
    startMicButton.disabled = true;
    fileInput.disabled = true;
    
    // Show Spotify controls
    spotifyControls.style.display = 'block';
  }

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
});
