document.addEventListener('DOMContentLoaded', () => {
  // Initialize with debug mode
  const audioProcessor = new GPUAudioProcessor({
    debugMode: true, // Enable debugging initially
    fftSize: 1024,   // Reduced size for better performance
    smoothingTimeConstant: 0.6 // Less smoothing for more responsive visuals
  });

  const micOption = document.getElementById('mic-option');
  const fileOption = document.getElementById('file-option');
  const startMicButton = document.getElementById('start-mic');
  const fileInput = document.getElementById('file-input');
  const dataOutput = document.getElementById('data-output');
  const aframeIframe = document.getElementById('aframe-iframe');

  micOption.addEventListener('change', () => {
    if (micOption.checked) {
      startMicButton.disabled = false;
      fileInput.disabled = true;
      audioProcessor.stopCurrentSource();
    }
  });

  fileOption.addEventListener('change', () => {
    if (fileOption.checked) {
      fileInput.disabled = false;
      startMicButton.disabled = true;
      audioProcessor.stopCurrentSource();
    }
  });

  startMicButton.addEventListener('click', () => {
    audioProcessor.initMicrophone();
    console.log("Microphone initialized");
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      audioProcessor.initFile(file);
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
});
