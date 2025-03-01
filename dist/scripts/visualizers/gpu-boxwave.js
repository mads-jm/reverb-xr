/**
 * GPU-accelerated BoxWave visualizer
 * Adapts boxwave-script.js to use the GPUAudioProcessor for better performance
 */
import { GPUAudioProcessor } from '../audio/GPUAudioProcessor.js';

// Create the component for A-Frame integration
AFRAME.registerComponent('gpu-boxwave', {
    schema: {
        analyserNode: { type: 'selector' },
        width: { type: 'number', default: 5 },
        height: { type: 'number', default: 3 },
        depth: { type: 'number', default: 0.1 },
        mirror: { type: 'boolean', default: true },
        startColor: { type: 'color', default: '#ff0000' },
        endColor: { type: 'color', default: '#0000ff' },
        useReflection: { type: 'boolean', default: true }
    },
    
    init: function() {
        console.log('GPU BoxWave visualizer initializing...');
        this.initialized = false;
        this.hasRealData = false;
        
        // Method bindings to preserve context
        this.updateVisualization = this.updateVisualization.bind(this);
        this.drawWaveform = this.drawWaveform.bind(this);
        
        // Store draw function reference for updateVisualization
        this.drawFunction = this.drawWaveform;
        
        // Setup canvas
        this.setupCanvas();
        
        // Create material and geometry
        this.setupMaterial();
        
        // Create mesh
        this.setupMesh();
        
        // Create mirrored planes
        this.createMirrorPlanes(this.data.width, this.data.height, this.data.depth);
        
        // Set initialized flag
        this.initialized = true;
        
        // Listen for audio data updates
        this.el.sceneEl.addEventListener('audiodata-updated', this.updateVisualization);
        
        console.log('GPU BoxWave visualizer initialized');
    },
    
    // Create a canvas for rendering the waveform
    createCanvas: function() {
        // Create canvas for 2D drawing
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 256;
        this.ctx = this.canvas.getContext('2d');
        
        // Clear with transparent background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Create canvas texture
        this.canvasTexture = new THREE.CanvasTexture(this.canvas);
        this.canvasTexture.wrapS = THREE.RepeatWrapping;
        this.canvasTexture.wrapT = THREE.RepeatWrapping;
        this.canvasTexture.repeat.set(1, 1);
    },
    
    // Setup the material for the visualizer
    setupMaterial: function() {
        console.log('Setting up material for BoxWave');
        
        // Create material with canvas texture
        this.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            map: this.canvasTexture,
            emissiveMap: this.canvasTexture
        });
    },
    
    // Setup the mesh for the visualizer
    setupMesh: function() {
        console.log('Setting up mesh for BoxWave');
        
        // Create geometry
        const geometry = new THREE.BoxGeometry(
            this.data.width, 
            this.data.height, 
            this.data.depth
        );
        
        // Create mesh with material
        this.mesh = new THREE.Mesh(geometry, this.material);
        
        // Add mesh to entity
        this.el.object3D.add(this.mesh);
    },
    
    // Create the mirrored planes for the boxwave effect
    createMirrorPlanes: function(width, height, depth) {
        // Create mirrored planes
        const mirrorGeometry = new THREE.PlaneGeometry(width, depth);
        const mirrorMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x222222,
            metalness: 0.8,
            roughness: 0.2,
            flatShading: false
        });
        
        // Bottom mirrored plane
        this.bottomMesh = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        this.bottomMesh.rotation.x = Math.PI / 2; // Rotate to face up
        // Position at the bottom of the box wave
        this.bottomMesh.position.y = -height - depth/2;
        this.bottomMesh.position.z = 0;
        
        // If using reflection, add to the scene
        if (this.data.useReflection) {
            this.el.object3D.add(this.bottomMesh);
        }
        
        // Store materials for updates
        this.materials = [this.material];
        if (this.bottomMesh) this.materials.push(this.bottomMesh.material);
        
        // Ensure all materials use the same canvasTexture
        this.materials.forEach(material => {
            material.map = this.canvasTexture;
            material.emissiveMap = this.canvasTexture;
            material.needsUpdate = true;
        });
    },
    
    // Update the visualizer with new audio data
    updateVisualization: function(evt) {
        if (!this.initialized) return;
        
        // Determine whether to use real data or generate mock data
        let timeDomainData;
        if (evt && evt.detail && evt.detail.timeDomainData) {
            // Use real audio data
            timeDomainData = evt.detail.timeDomainData;
            this.lastDataUpdate = Date.now();
            this.hasRealData = true;
        } else {
            // Use mock data if no real data or if real data is outdated
            if (!this.mockData) {
                // Initialize mock data array if it doesn't exist
                this.mockData = new Array(128).fill(0);
                this.mockTime = 0;
            }
            
            const currentTime = Date.now();
            const dataAge = currentTime - (this.lastDataUpdate || 0);
            
            // If we haven't received real data for 2 seconds, show flat line with small blip
            if (!this.hasRealData || dataAge > 2000) {
                // Reset to all zeros (flat line)
                this.mockData.fill(0);
                
                // Add a small blip to show the system is still active
                const blipPosition = Math.floor((this.mockTime * 10) % this.mockData.length);
                this.mockData[blipPosition] = 0.1; // Small blip
                
                if (dataAge > 5000) {
                    console.warn('BoxWave: No audio data for 5+ seconds, using flat line');
                }
            } else {
                // Generate a simple sine wave for visualization if we had real data recently
                for (let i = 0; i < this.mockData.length; i++) {
                    this.mockData[i] = Math.sin(this.mockTime + i * 0.2) * 0.5;
                }
            }
            
            // Increment mock time
            this.mockTime += 0.05;
            timeDomainData = this.mockData;
        }
        
        // Update drawing with the available data
        if (this.drawFunction) {
            this.drawFunction(timeDomainData);
        }
    },
    
    // Draw waveform to canvas
    drawWaveform: function(audioData) {
        if (!this.ctx || !audioData) return;
        
        const { width, height } = this.canvas;
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw debug info if there's no real data
        if (!this.hasRealData) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('NO REAL AUDIO DATA', 10, 30);
        }
        
        // Calculate bar metrics
        const barCount = Math.min(128, audioData.length);
        const barWidth = width / barCount;
        
        // Create gradient for visualization
        const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, this.data.startColor);
        gradient.addColorStop(1, this.data.endColor);
        this.ctx.fillStyle = gradient;
        
        // Draw each bar
        for (let i = 0; i < barCount; i++) {
            let value;
            
            // Normalize the audio data based on type
            if (audioData instanceof Uint8Array) {
                // 8-bit data (0-255) - normalize to 0-1
                value = (audioData[i] - 128) / 128;
            } else {
                // Assume float data (-1 to 1)
                value = audioData[i];
            }
            
            // Scale to fit canvas
            const barHeight = Math.abs(value) * height * 0.5;
            
            // Calculate bar position
            const x = i * barWidth;
            const y = height / 2 - (value >= 0 ? barHeight : 0);
            
            // Draw bar
            this.ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
        
        // Update the texture
        if (this.canvasTexture) {
            this.canvasTexture.needsUpdate = true;
        }
        
        // Update materials
        if (this.materials) {
            this.materials.forEach(material => {
                if (material.map) material.map.needsUpdate = true;
                if (material.emissiveMap) material.emissiveMap.needsUpdate = true;
            });
        }
    },
    
    // Update all the textures
    updateTextures: function() {
        // Mark texture as needing update
        this.canvasTexture.needsUpdate = true;
        
        // Update all materials
        if (this.materials && this.materials.length) {
            this.materials.forEach(material => {
                if (material) {
                    material.needsUpdate = true;
                }
            });
        } else {
            // Fallback to individual updates if materials array not available
            if (this.mesh && this.mesh.material) {
                this.mesh.material.needsUpdate = true;
            }
            
            if (this.bottomMesh && this.bottomMesh.material) {
                this.bottomMesh.material.needsUpdate = true; 
            }
            
            if (this.frontMesh && this.frontMesh.material) {
                this.frontMesh.material.needsUpdate = true;
            }
            
            if (this.backMesh && this.backMesh.material) {
                this.backMesh.material.needsUpdate = true;
            }
        }
        
        // Force Three.js to recognize the texture update
        this.canvasTexture.dispose();
        this.canvasTexture = new THREE.CanvasTexture(this.canvas);
        
        // Update all materials with the new texture
        if (this.materials && this.materials.length) {
            this.materials.forEach(material => {
                material.map = this.canvasTexture;
                material.emissiveMap = this.canvasTexture;
            });
        }
    },
    
    // Convert HSV to RGB (same as original boxwave-script)
    hsvToRgb: function(h, s = 1.0, v = 1.0) {
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const q = 1 - f;
        const t = f;
        
        switch (i % 6) {
            case 0: (r = 1), (g = t), (b = 0); break;
            case 1: (r = q), (g = 1), (b = 0); break;
            case 2: (r = 0), (g = 1), (b = t); break;
            case 3: (r = 0), (g = q), (b = 1); break;
            case 4: (r = t), (g = 0), (b = 1); break;
            case 5: (r = 1), (g = 0), (b = q); break;
        }
        
        return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
    },
    
    // Tick function called every frame
    tick: function() {
        // If we have direct access to the GPU processor, update every frame
        if (this.gpuProcessor) {
            this.updateVisualization();
        }
    },
    
    // Handle component removal
    remove: function() {
        console.log('Removing GPU BoxWave visualizer');
        
        // Remove event listeners
        this.el.sceneEl.removeEventListener('audiodata-updated', this.updateVisualization);
        
        // Dispose of textures
        if (this.canvasTexture) {
            this.canvasTexture.dispose();
        }
        
        // Dispose of materials
        if (this.materials) {
            this.materials.forEach(material => {
                if (material) material.dispose();
            });
        }
        
        // Remove meshes
        if (this.mesh) {
            this.el.object3D.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
        }
        
        if (this.bottomMesh) {
            this.el.object3D.remove(this.bottomMesh);
            if (this.bottomMesh.geometry) this.bottomMesh.geometry.dispose();
        }
    }
}); 