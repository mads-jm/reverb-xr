// Import all visualizer components and processors
import { registerVisualizers } from '../scripts/visualizers/index.js';
import { GPUAudioProcessor } from '../scripts/audio/GPUAudioProcessor.js';
import { AudioProcessor } from '../scripts/audio/AudioProcessor.js';

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Register all visualizers
        console.log('Registering visualizer components...');
        registerVisualizers();
        
        // Initialize GPU Audio Processor
        window.gpuAudioProcessor = new GPUAudioProcessor({
            fftSize: 2048,
            smoothingTimeConstant: 0.8
        });
        
        // Set up message handling
        window.addEventListener('message', handleMessage);
        window.parent.postMessage({ type: 'visualizer-ready' }, '*');
    } catch (error) {
        console.error('Error initializing visualizers:', error);
    }
});

// Message handling functions
function handleMessage(event) {
    if (event.source !== window.parent) return;
    
    const message = event.data;
    switch (message.type) {
        case 'frequencyData':
        case 'timeDomainData':
            if (window.gpuAudioProcessor) {
                updateProcessorData(message.type, message.data);
            }
            break;
        case 'toggle':
            toggleElement(message.element, message.visible);
            break;
    }
}

function updateProcessorData(type, data) {
    if (!window.gpuAudioProcessor) return;
    
    try {
        if (type === 'frequencyData') {
            const floatData = new Float32Array(data.length);
            for (let i = 0; i < data.length; i++) {
                floatData[i] = (data[i] / 255.0 * 100.0) - 100.0;
            }
            window.gpuAudioProcessor.getFrequencyData().set(floatData);
        } else if (type === 'timeDomainData') {
            const floatData = new Float32Array(data.length);
            for (let i = 0; i < data.length; i++) {
                floatData[i] = (data[i] / 128.0) - 1.0;
            }
            window.gpuAudioProcessor.getTimeDomainData().set(floatData);
        }
        
        window.gpuAudioProcessor.updateTextureData();
        
        // Update audio-processor entity
        const processorEntity = document.getElementById('audio-processor');
        if (processorEntity) {
            processorEntity.emit('audiodata-updated', {
                frequencyData: data,
                timeDomainData: type === 'timeDomainData' ? data : window.gpuAudioProcessor.getTimeDomainDataForAPI()
            });
        }
    } catch (error) {
        console.error('Error updating processor data:', error);
    }
}

function toggleElement(elementType, visible) {
    const elements = {
        wave3: document.querySelector('[wave3-visualizer]'),
        waveform: document.querySelector('[circular-waveform]'),
        bars: document.querySelector('[frequency-bars]'),
        skybox: document.querySelector('a-sky'),
        lights: Array.from(document.querySelectorAll('a-light')),
        ground: document.querySelector('#ground-plane')
    };
    
    const element = elements[elementType];
    if (!element) return;
    
    if (Array.isArray(element)) {
        element.forEach(el => el.setAttribute('visible', visible));
    } else {
        element.setAttribute('visible', visible);
    }
} 