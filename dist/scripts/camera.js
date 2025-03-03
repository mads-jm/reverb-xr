// // scripts/camera.js
// // Camera component for A-Frame visualization scenes

// /**
//  * Custom camera component with cursor and flight controls
//  */
// AFRAME.registerComponent('custom-camera', {
//   init: function () {
//     // Create camera entity
//     const camera = document.createElement('a-camera');
//     camera.setAttribute('wasd-controls', 'fly: true');

//     // Create cursor entity
//     const cursor = document.createElement('a-cursor');
//     cursor.setAttribute('id', 'cursor');
//     cursor.setAttribute('animation__click', 'property: scale; from: 0.1 0.1 0.1; to: 0.5 0.5 0.5; easing: easeInCubic; dur: 150; startEvents: click');
//     cursor.setAttribute('animation__clickreset', 'property: scale; to: 0.1 0.1 0.1; dur: 1; startEvents: animationcomplete__click');
//     cursor.setAttribute('animation__fusing', 'property: scale; from: 1 1 1; to: 0.5 0.5 0.5; easing: easeInCubic; dur: 150; startEvents: fusing');

//     // Append cursor to camera
//     camera.appendChild(cursor);

//     // Append camera to the current entity
//     this.el.appendChild(camera);
//   }
// });
