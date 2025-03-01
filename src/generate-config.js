import fs from 'fs';

// Create a config object with your environment variables
const config = {
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || ''
};

// Write the config to a JavaScript file
fs.writeFileSync(
  'config.js',
  `window.APP_CONFIG = ${JSON.stringify(config)};`
);

console.log('Config file generated with environment variables'); 