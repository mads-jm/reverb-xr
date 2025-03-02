uniform sampler2D audioData;
uniform float time;
uniform float dataLength;

varying vec2 vUv;

vec3 hsvToRgb(float h, float s, float v) {
  // HSV to RGB conversion
  float c = v * s;
  float h2 = h * 6.0;
  float x = c * (1.0 - abs(mod(h2, 2.0) - 1.0));
  vec3 rgb;
  
  if (h2 < 1.0) rgb = vec3(c, x, 0.0);
  else if (h2 < 2.0) rgb = vec3(x, c, 0.0);
  else if (h2 < 3.0) rgb = vec3(0.0, c, x);
  else if (h2 < 4.0) rgb = vec3(0.0, x, c);
  else if (h2 < 5.0) rgb = vec3(x, 0.0, c);
  else rgb = vec3(c, 0.0, x);
  
  return rgb + vec3(v - c);
}

void main() {
  // Sample audio data based on x position
  float index = vUv.x * dataLength;
  float value = texture2D(audioData, vec2(vUv.x, 0.5)).r;
  
  // Normalize the value (frequency data is usually in decibels, -100 to 0)
  float normalizedValue = (value + 100.0) / 100.0;
  
  // Calculate bar visualization
  float barHeight = normalizedValue;
  float inBar = step(1.0 - barHeight, vUv.y);
  
  // Color based on frequency (position in spectrum)
  vec3 color = hsvToRgb(vUv.x, 0.8, 1.0) * inBar;
  
  // Add time-based effects (optional)
  float pulse = sin(time * 2.0) * 0.1 + 0.9;
  color *= pulse;
  
  gl_FragColor = vec4(color, 1.0);
}