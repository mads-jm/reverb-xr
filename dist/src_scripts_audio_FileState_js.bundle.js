/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
export const __webpack_id__ = "src_scripts_audio_FileState_js";
export const __webpack_ids__ = ["src_scripts_audio_FileState_js"];
export const __webpack_modules__ = {

/***/ "./src/scripts/audio/FileState.js":
/*!****************************************!*\
  !*** ./src/scripts/audio/FileState.js ***!
  \****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   FileState: () => (/* binding */ FileState)\n/* harmony export */ });\n/* harmony import */ var _InitializedState_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./InitializedState.js */ \"./src/scripts/audio/InitializedState.js\");\n\n\n/**\r\n * State for handling audio file playback\r\n * Extends the base InitializedState to inherit common functionality\r\n */\nclass FileState extends _InitializedState_js__WEBPACK_IMPORTED_MODULE_0__.InitializedState {\n  /**\r\n   * @param {AudioContext} audioContext - The audio context\r\n   * @param {AnalyserNode} analyser - The analyzer node\r\n   * @param {AudioBuffer} audioBuffer - The decoded audio buffer\r\n   */\n  constructor(audioContext, analyser, audioBuffer) {\n    super(audioContext, analyser);\n    this.audioBuffer = audioBuffer;\n    this.source = audioContext.createBufferSource();\n    this.source.buffer = audioBuffer;\n\n    // source -> analyser -> gainNode -> destination\n    this.source.connect(this.analyser);\n    this.source.start(0);\n    this.startTime = this.audioContext.currentTime;\n    this.isPlaying = true;\n    console.log('File playback started');\n  }\n\n  /**\r\n   * Stops audio playback\r\n   * @returns {FileState} This state instance\r\n   */\n  stop() {\n    if (this.source) {\n      this.source.stop(0);\n      this.source.disconnect();\n      this.source = null;\n      this.isPlaying = false;\n    }\n    return this;\n  }\n\n  /**\r\n   * Pauses audio playback\r\n   */\n  pause() {\n    if (this.isPlaying && this.source) {\n      this.stop();\n      // Store current position for resuming later\n      this.pauseTime = this.audioContext.currentTime - this.startTime;\n      this.isPlaying = false;\n    }\n  }\n\n  /**\r\n   * Resumes audio playback from paused position\r\n   */\n  play() {\n    if (!this.isPlaying && this.audioBuffer) {\n      this.source = this.audioContext.createBufferSource();\n      this.source.buffer = this.audioBuffer;\n\n      // IMPORTANT: This was the key issue - when resuming playback, we were only\n      // connecting source->analyser but not ensuring the analyzer was\n      // connected to the gainNode, which is needed for volume control.\n\n      // First disconnect any existing connections to ensure clean routing\n      try {\n        this.analyser.disconnect();\n      } catch (e) {\n        // Ignore disconnect errors\n      }\n\n      // Reconnect the full audio path:\n      // 1. Connect source to analyzer\n      this.source.connect(this.analyser);\n\n      // 2. Connect analyzer to gain node\n      this.analyser.connect(this.gainNode);\n\n      // 3. Ensure gain node is connected to destination\n      if (!this.gainNode.numberOfOutputs) {\n        this.gainNode.connect(this.audioContext.destination);\n      }\n\n      // 4. Apply the current volume setting again to ensure it takes effect\n      console.log('Reapplying current gain value:', this.gainNode.gain.value);\n\n      // Start playback from the saved position\n      const offset = this.pauseTime || 0;\n      this.source.start(0, offset);\n      this.startTime = this.audioContext.currentTime - offset;\n      this.isPlaying = true;\n      console.log('File playback resumed at', offset, 'seconds');\n    }\n  }\n}\n\n//# sourceURL=webpack://reverb-xr/./src/scripts/audio/FileState.js?");

/***/ })

};
