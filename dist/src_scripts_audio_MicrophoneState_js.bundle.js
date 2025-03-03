/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
export const __webpack_id__ = "src_scripts_audio_MicrophoneState_js";
export const __webpack_ids__ = ["src_scripts_audio_MicrophoneState_js"];
export const __webpack_modules__ = {

/***/ "./src/scripts/audio/MicrophoneState.js":
/*!**********************************************!*\
  !*** ./src/scripts/audio/MicrophoneState.js ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   MicrophoneState: () => (/* binding */ MicrophoneState)\n/* harmony export */ });\n/* harmony import */ var _InitializedState_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./InitializedState.js */ \"./src/scripts/audio/InitializedState.js\");\n\n\n/**\r\n * State for handling microphone input\r\n * Extends the base InitializedState to inherit common functionality\r\n */\nclass MicrophoneState extends _InitializedState_js__WEBPACK_IMPORTED_MODULE_0__.InitializedState {\n  /**\r\n   * @param {AudioContext} audioContext - The audio context\r\n   * @param {AnalyserNode} analyser - The analyzer node\r\n   * @param {MediaStreamAudioSourceNode} source - The audio source node\r\n   * @param {MediaStream} stream - The microphone media stream\r\n   */\n  constructor(audioContext, analyser, source, stream) {\n    super(audioContext, analyser);\n    this.stream = stream;\n    this.source = source;\n\n    // For microphone input, we need to break the output connection\n    // to prevent feedback loops (the mic picking up its own output)\n\n    // First disconnect any existing connections from analyzer to prevent feedback\n    try {\n      this.analyser.disconnect();\n    } catch (e) {\n      // Ignore disconnect errors\n    }\n\n    // For visualization only: reconnect analyzer to gain node, but keep gain at 0\n    // This ensures we can visualize the audio without creating feedback\n    if (this.gainNode) {\n      this.analyser.connect(this.gainNode);\n      // Set gain to 0 to prevent any sound output and feedback\n      this.gainNode.gain.value = 0;\n    }\n  }\n\n  /**\r\n   * Override setVolume to prevent accidental unmuting of microphone\r\n   * For microphone input, we always keep the gain at 0 to prevent feedback\r\n   * @param {number} volume - Volume level (ignored for mic input)\r\n   */\n  setVolume(volume) {\n    // Always keep mic input volume at 0 to prevent feedback\n    if (this.gainNode) {\n      this.gainNode.gain.value = 0;\n    }\n    console.log('Microphone input volume is always muted to prevent feedback');\n  }\n\n  /**\r\n   * Stops microphone input and returns to initialized state\r\n   * @returns {InitializedState} Base initialized state\r\n   */\n  stop() {\n    if (this.source) {\n      this.source.disconnect();\n    }\n\n    // Stop all tracks in the stream\n    if (this.stream && this.stream.getTracks) {\n      this.stream.getTracks().forEach(track => track.stop());\n    }\n\n    // No need to create a new InitializedState since we already extend it\n    this.source = null;\n    return this;\n  }\n}\n\n//# sourceURL=webpack://reverb-xr/./src/scripts/audio/MicrophoneState.js?");

/***/ })

};
