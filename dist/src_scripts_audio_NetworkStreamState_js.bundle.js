/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
export const __webpack_id__ = "src_scripts_audio_NetworkStreamState_js";
export const __webpack_ids__ = ["src_scripts_audio_NetworkStreamState_js"];
export const __webpack_modules__ = {

/***/ "./src/scripts/audio/NetworkStreamState.js":
/*!*************************************************!*\
  !*** ./src/scripts/audio/NetworkStreamState.js ***!
  \*************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   NetworkStreamState: () => (/* binding */ NetworkStreamState)\n/* harmony export */ });\n/* harmony import */ var _InitializedState_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./InitializedState.js */ \"./src/scripts/audio/InitializedState.js\");\n\n\n/**\r\n * State for handling network audio streaming\r\n * Extends the base InitializedState to inherit common functionality\r\n */\nclass NetworkStreamState extends _InitializedState_js__WEBPACK_IMPORTED_MODULE_0__.InitializedState {\n  /**\r\n   * @param {AudioContext} audioContext - The audio context\r\n   * @param {AnalyserNode} analyser - The analyzer node\r\n   * @param {string} streamUrl - URL of the audio stream\r\n   */\n  constructor(audioContext, analyser, streamUrl) {\n    super(audioContext, analyser);\n    this.streamUrl = streamUrl;\n    this.isPlaying = false;\n    this.initStream();\n  }\n\n  /**\r\n   * Initialize the audio stream\r\n   * @private\r\n   */\n  async initStream() {\n    try {\n      // Create an audio element to fetch and decode the stream\n      this.audioElement = new Audio();\n      this.audioElement.crossOrigin = 'anonymous';\n      this.audioElement.src = this.streamUrl;\n      this.audioElement.load();\n\n      // Connect the audio element to the audio context\n      this.source = this.audioContext.createMediaElementSource(this.audioElement);\n\n      // source -> analyser -> gainNode -> destination\n      this.source.connect(this.analyser);\n      console.log('Network stream initialized');\n    } catch (err) {\n      console.error('Error initializing network stream', err);\n      throw err;\n    }\n  }\n\n  /**\r\n   * Start playing the network stream\r\n   */\n  play() {\n    if (!this.isPlaying && this.audioElement) {\n      this.audioElement.play().then(() => {\n        this.isPlaying = true;\n        console.log('Network stream playback started');\n      }).catch(err => {\n        console.error('Error playing network stream', err);\n      });\n    }\n  }\n\n  /**\r\n   * Pause the network stream\r\n   */\n  pause() {\n    if (this.isPlaying && this.audioElement) {\n      this.audioElement.pause();\n      this.isPlaying = false;\n      console.log('Network stream playback paused');\n    }\n  }\n\n  /**\r\n   * Stop and clean up the network stream\r\n   * @returns {NetworkStreamState} This state instance\r\n   */\n  stop() {\n    if (this.audioElement) {\n      this.audioElement.pause();\n      this.audioElement.src = '';\n      this.audioElement.load();\n    }\n    if (this.source) {\n      this.source.disconnect();\n      this.source = null;\n    }\n    this.isPlaying = false;\n    console.log('Network stream stopped');\n    return this;\n  }\n}\n\n//# sourceURL=webpack://reverb-xr/./src/scripts/audio/NetworkStreamState.js?");

/***/ })

};
