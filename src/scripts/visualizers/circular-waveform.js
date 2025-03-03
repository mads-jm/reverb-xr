// Circular Waveform Visualizer
// Creates a circular waveform that responds to audio amplitude

/**
 * Register the circular waveform visualizer component
 */
export function registerCircularWaveform() {
    if (AFRAME.components['circular-waveform']) {
        console.log('circular-waveform already registered');
        return;
    }

    AFRAME.registerComponent('circular-waveform', {
        schema: {
            analyserNode: { type: 'selector' },
            radius: { type: 'number', default: 5 },
            height: { type: 'number', default: 2 },
            color: { type: 'color', default: '#FFF' },
            segments: { type: 'int', default: 128 }
        },
        
        init: function() {
            console.log('Circular waveform initialized');
            this.analyserNode = this.data.analyserNode;
            
            // Create geometry
            this.createGeometry();
            
            // Listen for audio data updates
            this.analyserNode.addEventListener('audiodata-updated', this.updateWaveform.bind(this));
        },
        
        createGeometry: function() {
            // Create a circle of points
            const segments = this.data.segments;
            const radius = this.data.radius;
            
            // Create geometry
            const geometry = new THREE.BufferGeometry();
            
            // Create positions array
            const positions = new Float32Array(segments * 3);
            const colors = new Float32Array(segments * 3);
            
            // Initialize positions in a circle
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const y = 0;
                const z = Math.sin(angle) * radius;
                
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;
                
                // Rainbow colors
                const hue = i / segments;
                const color = new THREE.Color().setHSL(hue, 1, 0.5);
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            // Create material
            const material = new THREE.LineBasicMaterial({
                color: this.data.color,
                vertexColors: true,
                linewidth: 2
            });
            
            // Create line
            this.line = new THREE.LineLoop(geometry, material);
            this.el.setObject3D('mesh', this.line);
            
            // Store reference to position attribute for updates
            this.positions = geometry.attributes.position;
        },
        
        updateWaveform: function(event) {
            if (!this.positions) return;
            
            const timeDomainData = event.detail.timeDomainData;
            const segments = this.data.segments;
            const radius = this.data.radius;
            const height = this.data.height;
            
            // Update positions based on audio data
            for (let i = 0; i < segments; i++) {
                const dataIndex = Math.floor((i / segments) * timeDomainData.length);
                const value = timeDomainData[dataIndex] / 128.0 - 1.0; // Convert to -1 to 1 range
                
                const angle = (i / segments) * Math.PI * 2;
                const amplifiedValue = value * height;
                
                // Calculate new position
                const newRadius = radius + amplifiedValue;
                const x = Math.cos(angle) * newRadius;
                const y = amplifiedValue * 0.5; // Add some vertical movement
                const z = Math.sin(angle) * newRadius;
                
                // Update position
                this.positions.array[i * 3] = x;
                this.positions.array[i * 3 + 1] = y;
                this.positions.array[i * 3 + 2] = z;
            }
            
            // Mark positions for update
            this.positions.needsUpdate = true;
        },

        remove: function() {
            if (this.analyserNode) {
                this.analyserNode.removeEventListener('audiodata-updated', this.updateWaveform);
            }
            
            if (this.line) {
                if (this.line.geometry) this.line.geometry.dispose();
                if (this.line.material) this.line.material.dispose();
            }
            
            this.el.removeObject3D('mesh');
        }
    });
} 