// Frequency Bars Visualizer
// Creates a circular arrangement of bars that respond to audio frequency content

/**
 * Register the frequency bars visualizer component
 */
export function registerFrequencyBars() {
    if (AFRAME.components['frequency-bars']) {
        console.log('frequency-bars already registered');
        return;
    }

    AFRAME.registerComponent('frequency-bars', {
        schema: {
            analyserNode: { type: 'selector' },
            radius: { type: 'number', default: 8 },
            height: { type: 'number', default: 3 },
            color: { type: 'color', default: '#FFF' },
            segments: { type: 'int', default: 64 },
            smoothing: { type: 'number', default: 0.8 },
            minDecibels: { type: 'number', default: -100 },
            maxDecibels: { type: 'number', default: -30 }
        },
        
        init: function() {
            console.log('Frequency bars initialized');
            this.analyserNode = this.data.analyserNode;
            this.averages = new Array(this.data.segments).fill(0);
            this.frequencyRanges = this.calculateFrequencyRanges();
            
            // Create geometry
            this.createGeometry();
            
            // Listen for audio data updates
            this.analyserNode.addEventListener('audiodata-updated', this.updateBars.bind(this));
        },

        calculateFrequencyRanges: function() {
            // Calculate logarithmic frequency ranges for better visualization
            const ranges = [];
            const minFreq = 20;  // Hz
            const maxFreq = 20000; // Hz
            const segments = this.data.segments;
            
            for (let i = 0; i < segments; i++) {
                // Calculate frequency range for each bar using logarithmic scale
                const freq = minFreq * Math.pow(maxFreq/minFreq, i/segments);
                ranges.push(freq);
            }
            return ranges;
        },
        
        createGeometry: function() {
            const segments = this.data.segments;
            const radius = this.data.radius;
            
            // Create a group to hold all the bars
            this.barGroup = new THREE.Group();
            this.el.setObject3D('mesh', this.barGroup);
            
            // Create individual bars
            this.bars = [];
            
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                
                // Create bar geometry
                const barWidth = 2 * Math.PI * radius / segments * 0.9; // 90% of available space
                const barDepth = 0.5;
                const geometry = new THREE.BoxGeometry(barWidth, 1, barDepth);
                
                // Create material with gradient color based on frequency range
                const freqRatio = this.frequencyRanges[i] / 20000; // Normalize to 0-1
                const hue = 0.7 - (freqRatio * 0.5); // Blue to red spectrum
                const color = new THREE.Color().setHSL(hue, 1, 0.5);
                const material = new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.3,
                    roughness: 0.7,
                    emissive: color,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.25
                });
                
                // Create mesh
                const bar = new THREE.Mesh(geometry, material);
                
                // Position the bar at the perimeter, on the ground
                bar.position.set(x, 0, z);
                
                // Rotate to face center
                bar.lookAt(0, 0, 0);
                
                // Set the pivot point to the bottom of the bar
                bar.geometry.translate(0, 0.5, 0);
                
                // Add to group
                this.barGroup.add(bar);
                this.bars.push(bar);
            }
        },
        
        updateBars: function(event) {
            if (!this.bars || !this.bars.length) return;
            
            // Use frequency data for proper spectrum analysis
            const frequencyData = event.detail.frequencyData;
            const segments = this.data.segments;
            const maxHeight = this.data.height;
            const smoothing = this.data.smoothing;
            
            if (!frequencyData || frequencyData.length === 0) return;
            
            // Update each bar based on frequency data
            for (let i = 0; i < segments; i++) {
                // Calculate the frequency range for this bar
                const freq = this.frequencyRanges[i];
                const binIndex = Math.floor((freq / 22050) * frequencyData.length);
                
                // Get normalized value (0-1) from frequency data
                const value = (frequencyData[binIndex] - this.data.minDecibels) / 
                            (this.data.maxDecibels - this.data.minDecibels);
                
                // Apply smoothing
                this.averages[i] = this.averages[i] * smoothing + value * (1 - smoothing);
                
                // Update bar height and material properties
                const height = Math.max(0.01, this.averages[i] * maxHeight);
                this.bars[i].scale.y = height;
                
                // Update emissive intensity based on frequency power
                const material = this.bars[i].material;
                material.emissiveIntensity = 0.3 + this.averages[i] * 0.7;
                
                // Add subtle color shift based on intensity
                const baseHue = 0.7 - ((freq / 20000) * 0.5);
                const intensityShift = this.averages[i] * 0.2; // Shift hue based on intensity
                material.color.setHSL(baseHue + intensityShift, 1, 0.5);
                material.emissive.setHSL(baseHue + intensityShift, 1, 0.5);
            }
        },

        remove: function() {
            if (this.analyserNode) {
                this.analyserNode.removeEventListener('audiodata-updated', this.updateBars);
            }

            if (this.bars) {
                this.bars.forEach(bar => {
                    if (bar.geometry) bar.geometry.dispose();
                    if (bar.material) bar.material.dispose();
                });
                this.bars = [];
            }

            if (this.barGroup) {
                this.el.removeObject3D('mesh');
            }
        }
    });
} 