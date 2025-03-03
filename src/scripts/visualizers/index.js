// Main visualizer registration module
import { registerWave3Visualizer } from './wave3-script.js';
import { registerCircularWaveform } from './circular-waveform.js';
import { registerFrequencyBars } from './frequency-bars.js';

export function registerVisualizers() {
    console.log('Registering visualizer components...');
    
    // Register each visualizer
    registerWave3Visualizer();
    registerCircularWaveform();
    registerFrequencyBars();
    
    console.log('All visualizer components registered');
} 