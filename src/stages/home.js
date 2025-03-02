// Import AFrame if it's not loaded via CDN
// import 'aframe';

// Import path resolver utility
import { resolvePath } from '../scripts/utils/pathResolver.js';
import { GPUAudioProcessor } from '../scripts/audio/GPUAudioProcessor.js';
import { AudioProcessor } from '../scripts/audio/AudioProcessor.js';

/**
 * Home visualizer entry point
 * Handles loading and initializing A-Frame components and communication with parent window
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Home visualizer initializing...');
  
  // Make path resolver globally available
  window.resolvePath = resolvePath;
  
  // Wait for A-Frame to be ready before initializing components
  if (typeof AFRAME !== 'undefined') {
    initializeVisualizers();
  } else {
    console.warn('A-Frame not found. Waiting for it to load...');
    // Wait for A-Frame to load
    document.addEventListener('aframe-loaded', initializeVisualizers);
  }
  
  /**
   * Initialize the GPU audio processor and set up communication with parent window
   */
  async function initializeAudioProcessor() {
    // Create a global reference to the processor
    window.gpuAudioProcessor = new GPUAudioProcessor({
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      debugMode: true
    });
    
    // Initialize the audio processor with mock data for testing
    // await window.gpuAudioProcessor.initMockData();
    
    console.log('GPUAudioProcessor initialized');
    
    // Set up communication with parent window
    window.addEventListener('message', handleMessage);
    
    // Signal to parent that we're ready
    window.parent.postMessage({ type: 'visualizer-ready' }, '*');
  }
  
  /**
   * Handle messages from parent window
   * @param {MessageEvent} event - Message event from window.postMessage
   */
  function handleMessage(event) {
    // Make sure message is from parent window
    if (event.source !== window.parent) return;
    
    const message = event.data;
    
    // Handle different message types
    switch (message.type) {
      case 'frequencyData':
      case 'timeDomainData':
        if (window.gpuAudioProcessor) {
          // Update the audio processor with data from parent
          updateProcessorData(message.type, message.data);
        }
        break;
        
      case 'init-audio':
        // Parent is telling us to initialize audio
        if (window.gpuAudioProcessor) {
          // Stop any current processing
          window.gpuAudioProcessor.stop();
          
          // Tell the processor entity to use the GPU processor
          const processorEntity = document.getElementById('audio-processor');
          processorEntity.gpuAudioProcessor = window.gpuAudioProcessor;
          
          // Emit event that the processor is ready
          processorEntity.emit('audio-processor-ready');
        }
        break;
        
      case 'toggle':
        // Toggle visibility of visualization elements
        const elementType = message.element;
        const visible = message.visible;
        toggleElement(elementType, visible);
        break;
    }
  }
  
  /**
   * Toggle visibility of visualization elements
   * @param {string} elementType - Type of element to toggle (waveform, bars, etc.)
   * @param {boolean} visible - Whether the element should be visible
   */
  function toggleElement(elementType, visible) {
    console.log(`Toggle ${elementType}: ${visible}`);
    
    const elements = {
      wave3: document.querySelector('[wave3-visualizer]'),
      waveform: document.querySelector('[circular-waveform]'),
      bars: document.querySelector('[frequency-bars]'),
      skybox: document.querySelector('a-sky'),
      lights: Array.from(document.querySelectorAll('a-light')),
      ground: document.querySelector('#ground-plane')
    };
    
    const element = elements[elementType];
    
    if (!element) {
      console.warn(`Element ${elementType} not found`);
      return;
    }
    
    if (Array.isArray(element)) {
      // Handle arrays of elements (e.g. lights)
      element.forEach(el => el.setAttribute('visible', visible));
    } else {
      // Handle single elements
      element.setAttribute('visible', visible);
    }
    
    console.log(`Set visibility of ${elementType} to ${visible}`);
  }
  
  /**
   * Update processor data with audio data from parent window
   * @param {string} type - Type of data ('frequencyData' or 'timeDomainData')
   * @param {Uint8Array} data - Audio data array
   */
  function updateProcessorData(type, data) {
    if (!window.gpuAudioProcessor) return;
    
    // Map the data to the appropriate texture in the GPU processor
    if (type === 'frequencyData') {
      // Convert Uint8Array to Float32Array for GPU processing
      const floatData = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) {
        // Convert from 0-255 to -100-0 dB range
        floatData[i] = (data[i] / 255.0 * 100.0) - 100.0;
      }
      
      // Update frequency data in GPU processor
      const frequencyData = window.gpuAudioProcessor.getFrequencyData();
      frequencyData.set(floatData);
    } else if (type === 'timeDomainData') {
      // Convert Uint8Array to Float32Array for GPU processing
      const floatData = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) {
        // Convert from 0-255 to -1.0-1.0 range
        floatData[i] = (data[i] / 128.0) - 1.0;
      }
      
      // Update time domain data in GPU processor
      const timeDomainData = window.gpuAudioProcessor.getTimeDomainData();
      timeDomainData.set(floatData);
    }
    
    // Force update on the textures
    window.gpuAudioProcessor.updateTextureData();
    
    // Also update the audio-processor entity for components that use the old system
    const processorEntity = document.getElementById('audio-processor');
    if (processorEntity) {
      processorEntity.emit('audiodata-updated', {
        frequencyData: data,
        timeDomainData: type === 'frequencyData' ? 
          window.gpuAudioProcessor.getTimeDomainDataForAPI() : data
      });
    }
  }
  
  /**
   * Initialize the visualizers
   */
  function initializeVisualizers() {
    console.log('Initializing visualizers');
    
    // Initialize audio processor
    initializeAudioProcessor();
    
    // Initialize with a small delay to ensure everything is ready
    setTimeout(() => {
      // Ensure the wave3 component is properly initialized
      const wave3Entity = document.getElementById('wave3-visualizer');
      if (wave3Entity) {
        if (AFRAME.components['wave3-visualizer']) {
          try {
            // Store the component data 
            const componentData = wave3Entity.getAttribute('wave3-visualizer');
            
            // Remove the component
            wave3Entity.removeAttribute('wave3-visualizer');
            
            // Add it back after a short delay
            setTimeout(() => {
              wave3Entity.setAttribute('wave3-visualizer', componentData);
              console.log('Wave3 visualizer re-initialized');
            }, 300);
          } catch (error) {
            console.error('Error re-initializing wave3 visualizer:', error);
          }
        } else {
          console.error('Wave3 visualizer component not registered!');
          // Try to register it if available globally
          if (window.registerWave3Visualizer) {
            window.registerWave3Visualizer();
          }
        }
      } else {
        console.warn('Wave3 visualizer entity not found in the DOM');
      }
    }, 500);
  }
  
  // Make functions available globally for HTML to access
  window.initializeVisualizers = initializeVisualizers;
  window.handleMessage = handleMessage;
  window.updateProcessorData = updateProcessorData;
  window.toggleElement = toggleElement;
  
  // Track when visualizers are loaded
  window.visualizersLoaded = true;
  console.log('Visualizer scripts loaded');
});

// These A-Frame components must be registered outside any function so they're available immediately

// Register circular waveform component if not already registered by imported scripts
if (typeof AFRAME !== 'undefined' && !AFRAME.components['circular-waveform']) {
  AFRAME.registerComponent('circular-waveform', {
    schema: {
      analyserNode: { type: 'selector' },
      radius: { type: 'number', default: 5 },
      height: { type: 'number', default: 2 },
      color: { type: 'color', default: '#FFF' },
      segments: { type: 'int', default: 128 }
    },
    
    // Component implementation
    // ...
  });
}

// Register frequency bars component if not already registered by imported scripts
if (typeof AFRAME !== 'undefined' && !AFRAME.components['frequency-bars']) {
  AFRAME.registerComponent('frequency-bars', {
    schema: {
      analyserNode: { type: 'selector' },
      radius: { type: 'number', default: 8 },
      height: { type: 'number', default: 3 },
      color: { type: 'color', default: '#FFF' },
      segments: { type: 'int', default: 64 },
      smoothing: { type: 'number', default: 0.8 }
    },
    
    // Component implementation
    // ...
  });
}

// Add toggle handler component to scene if not already registered by imported scripts
if (typeof AFRAME !== 'undefined' && !AFRAME.components['toggle-handler']) {
  AFRAME.registerComponent('toggle-handler', {
    init: function() {
      console.log('Toggle handler initializing...');
      // Listen for messages from parent window
      window.addEventListener('message', this.handleMessage.bind(this));
      
      // Wait for DOM to be fully loaded
      setTimeout(() => {
        // Store references to elements
        this.elements = {
          wave3: document.querySelector('[wave3-visualizer]'),
          waveform: document.querySelector('[circular-waveform]'),
          bars: document.querySelector('[frequency-bars]'),
          skybox: document.querySelector('a-sky'),
          lights: Array.from(document.querySelectorAll('a-light')),
          ground: document.querySelector('#ground-plane')
        };
      }, 500);
    },
    
    // Handle messages from parent
    handleMessage: function(event) {
      // Use global handler if available, otherwise handle locally
      if (window.handleMessage) {
        window.handleMessage(event);
      }
    }
  });
} 