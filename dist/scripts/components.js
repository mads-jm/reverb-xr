var zOffset = 0;
var yOffset = 0;
var showPosition = "0 -0.41 -0.4";
window.addEventListener("enter-vr", (e) => {
  if (AFRAME.utils.device.checkHeadsetConnected()) {
    // TODO: Set yOffset, zOffset, and showPosition based on VR display
    zOffset = 0.5;
    yOffset = 0.2;
    showPosition = "0 -0.41 -0.4";
    console.log("VR headset connected");
  }
});

const curvedImages = [
  {
    id: "menuBackground",
    radius: "2.25",
    thetaLength: "42",
    height: "0.2",
    position: "0 -0.67" + yOffset + " 1.1" + zOffset,
    rotation: "0 159 0",
  },
  {
    id: "subMenuBackground1",
    radius: "2.25",
    thetaLength: "42",
    height: "0.2",
    position: "0 -0.67" + yOffset + " 1.1" + zOffset,
    rotation: "0 159 0",
  },
  {
    id: "subMenuBackground2",
    radius: "2.25",
    thetaLength: "42",
    height: "0.2",
    position: "0 -0.67" + yOffset + " 1.1" + zOffset,
    rotation: "0 159 0",
  },
  {
    id: "subMenuBackground3",
    radius: "2.25",
    thetaLength: "42",
    height: "0.2",
    position: "0 -0.67" + yOffset + " 1.1" + zOffset,
    rotation: "0 159 0",
  },
  {
    id: "subMenuBackground4",
    radius: "2.25",
    thetaLength: "42",
    height: "0.2",
    position: "0 -0.67" + yOffset + " 1.1" + zOffset,
    rotation: "0 159 0",
  },
];
var visibility = "false";
var sub1Text = "Dual";
var sub2Text = "Start";
var sub3Text = "Particle";
var sub4Text = "Bars";
var sub5Text = "Wave";
console.log(window.location.href);
if (window.location.href.indexOf("stage-dualwave") !== -1) {
  sub1Text = "Back";
  console.log("in dualwave");
  // } else if (window.location.href.indexOf("") !== -1) {
  // 	sub2Text = "Back";
  // 	console.log('in start');
} else if (window.location.href.indexOf("stage-particle") !== -1) {
  sub3Text = "Back";
  console.log("in particle");
} else if (window.location.href.indexOf("stage-bars") !== -1) {
  sub4Text = "Back";
  console.log("in bars");
} else if (window.location.href.indexOf("stage-wave") !== -1) {
  sub5Text = "Back";
  console.log("in wave");
}
const subMenu = [
  {
    position: "-0.33 -0.4" + yOffset + " -1.13" + zOffset,
    rotation: "0 8.5 0",
    id: "sub1",
    text: sub1Text,
    width: "0.31",
    visible: visibility,
  },
  {
    position: "0 -0.4" + yOffset + " -1.155" + zOffset,
    rotation: "0 0 0",
    id: "sub2",
    text: sub2Text,
    width: "0.33",
  },
  {
    position: "0.33 -0.4" + yOffset + " -1.13" + zOffset,
    rotation: "0 -8.5 0",
    id: "sub3",
    text: sub3Text,
    width: "0.31",
  },
  {
    position: "0.64 -0.4" + yOffset + " -1.063" + zOffset,
    rotation: "0 -16.2 0",
    id: "sub4",
    text: sub4Text,
    width: "0.3",
  },
  {
    position: "-0.64 -0.4" + yOffset + " -1.063" + zOffset,
    rotation: "0 16 0",
    id: "sub5",
    text: sub5Text,
    width: "0.3",
  },
];

const menuItems = [
  {
    position: "-0.33 -0.67" + yOffset + " -1.13" + zOffset,
    rotation: "0 8.5 0",
    id: "menu5",
    text: "",
    width: "0.31",
  },
  {
    position: "0 -0.67" + yOffset + " -1.155" + zOffset,
    rotation: "0 0 0",
    id: "playPause",
    text: "Play",
    width: "0.33",
  },
  {
    position: "0.33 -0.67" + yOffset + " -1.13" + zOffset,
    rotation: "0 -8.5 0",
    id: "menu3",
    text: "",
    width: "0.31",
  },
  {
    position: "0.64 -0.67" + yOffset + " -1.063" + zOffset,
    rotation: "0 -16.2 0",
    id: "settings",
    text: "Rooms",
    width: "0.3",
  },
  {
    position: "-0.64 -0.67" + yOffset + " -1.063" + zOffset,
    rotation: "0 16.2 0",
    id: "hideShow",
    text: "Hide",
    width: "0.3",
  },
  {
    position: showPosition,
    rotation: "-45 0 45",
    id: "show",
    text: "",
    width: "0.1",
    height: "0.1",
    depth: "0.1",
    visible: "false",
    color: "white",
    transparency: "true",
  },
];

AFRAME.registerComponent("button", {
  schema: {
    position: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    text: { type: "string", default: "" },
    clickAction: { type: "string", default: "" },
  },

  init: function () {
    console.log("Initializing button component...");

    const button = document.createElement("a-entity");

    // Create the box
    const box = document.createElement("a-box");
    box.setAttribute("width", this.width || "1");
    box.setAttribute("height", this.height || "1");
    box.setAttribute("depth", this.depth || "0.2");
    box.setAttribute("color", "#7D7B7B");

    // Create the text
    const buttonText = document.createElement("a-text");
    buttonText.setAttribute("value", this.data.text);
    buttonText.setAttribute("align", "center");
    buttonText.setAttribute("position", "0 0 0.1"); // Adjust position as needed
    buttonText.setAttribute("scale", "0.7 0.7 1");
    buttonText.setAttribute("color", "white");
    buttonText.setAttribute("align", "center");
    // Append box and text to the button entity
    button.appendChild(box);
    button.appendChild(buttonText);

    // Set the position of the button
    button.setAttribute("position", this.data.position);

    // Append the button entity to the component's element
    this.el.appendChild(button);

    // Add interaction listeners
    this.addInteractionListeners(button, box);

    console.log("Button appended to:", this.el);
  },

  addInteractionListeners: function (button, box) {
    const el = this.el;

    el.addEventListener("mouseenter", function () {
      box.setAttribute("color", "white");
    });

    el.addEventListener("mouseleave", function () {
      box.setAttribute("color", "#7D7B7B");
    });

    el.addEventListener("click", function () {
      button.setAttribute("animation", {
        property: "scale",
        to: "1.1 1.1 1.1",
        dur: 300,
        easing: "easeInCubic",
      });

      button.addEventListener("animationcomplete", function () {
        button.setAttribute("animation", {
          property: "scale",
          to: "1 1 1",
          dur: 200,
          easing: "easeOutCubic",
        });
      });

      if (el.dataset.clickAction) {
        el.emit(el.dataset.clickAction);
      }
    });
  },

  update: function () {
    // Do something when component's data is updated.
  },
});

AFRAME.registerComponent("point-light", {
  init: function () {
    const light = document.createElement("a-light");
    light.setAttribute("type", "point");
    light.setAttribute("intensity", "2");
    light.setAttribute("color", "white");
    light.setAttribute("castShadow", "true");
    this.el.appendChild(light);
  },
});

AFRAME.registerComponent("custom-camera", {
  init: function () {
    //rig entity
    const rig = document.createElement("a-entity");
    rig.setAttribute("id", "rig");
    rig.setAttribute("position", "0 1.6 0");
    rig.setAttribute("movement-controls", "speed: 0.1");
    rig.setAttribute("thumbstick-logging", " ");

    // Create camera entity
    const camera = document.createElement("a-camera");
    camera.setAttribute("look-controls", "enabled: true");
    camera.setAttribute("cursor", "rayOrigin: mouse");
    rig.appendChild(camera);

    // No flight in lobby pls :)
    if (window.location.href.includes("stage-lobby.html")) {
      camera.setAttribute("wasd-controls", "acceleration: 10; fly: false");
    } else {
      camera.setAttribute("wasd-controls", "acceleration: 100; fly: true");
    }

    //left hand controller
    const leftHand = document.createElement("a-entity");
    leftHand.setAttribute("id", "leftHand");
    leftHand.setAttribute(
      "hand-controls",
      "hand: left; handModelStyle: highPoly;");
    rig.appendChild(leftHand);

    //right hand controller
    const rightHand = document.createElement("a-entity");
    rightHand.setAttribute("id", "rightHand");
    rightHand.setAttribute(
      "hand-controls",
      "hand: right; handModelStyle: highPoly;");
    rightHand.setAttribute("laser-controls", "hand: right;");
    rig.appendChild(rightHand);

    const rightLaser = document.createElement("a-entity");
    rightLaser.setAttribute(
      "raycaster",
      "objects: .interactable; showLine: true;"
    );
    rightLaser.setAttribute("line", "color: red; opacity: 0.75");
    rightHand.appendChild(rightLaser);

    menuItems.forEach((item) => {
      const menuItem = document.createElement("a-entity");
      menuItem.setAttribute("position", item.position);
      menuItem.setAttribute("rotation", item.rotation);
      menuItem.setAttribute("class", "menuItem");

      const box = document.createElement("a-box");
      box.setAttribute("id", item.id);
      box.setAttribute("position", "0 0 0");
      box.setAttribute("depth", item.depth || "0.033");
      box.setAttribute("height", item.height || "0.16");
      box.setAttribute("width", item.width);
      box.setAttribute("color", "grey");
      box.setAttribute("shadow", "cast: false; receive: false;");
      box.setAttribute("material", "flatShading: false;");
      box.setAttribute("onClick", "handleClick(this.id)");
      box.setAttribute("onmousedown", "handleMouseDown(this)");
      box.setAttribute("onmouseup", "handleMouseUp(this)");
      box.setAttribute("visible", item.visible || "true");

      const text = document.createElement("a-text");
      text.setAttribute("width", item.textwidth || item.width * 5 || "1");
      text.setAttribute("value", item.text);
      text.setAttribute("align", "center");
      text.setAttribute("color", item.color || "blue");
      text.setAttribute("position", "0 0.015 0.05");

      box.appendChild(text);
      menuItem.appendChild(box);
      camera.appendChild(menuItem);
    });

    subMenu.forEach((item) => {
      const subMenu = document.createElement("a-entity");
      subMenu.setAttribute("position", item.position);
      subMenu.setAttribute("rotation", item.rotation);
      subMenu.setAttribute("class", "subMenu");

      const box = document.createElement("a-box");
      box.setAttribute("id", item.id);
      box.setAttribute("position", "0 0 0");
      box.setAttribute("depth", "0.033");
      box.setAttribute("height", item.height || "0.16");
      box.setAttribute("width", item.width);
      box.setAttribute("color", "grey");
      box.setAttribute("shadow", "cast: false; receive: false;");
      box.setAttribute("material", "flatShading: false;");
      box.setAttribute("onClick", "handleClick(this.id)");
      box.setAttribute("onmousedown", "handleMouseDown(this)");
      box.setAttribute("onmouseup", "handleMouseUp(this)");
      box.setAttribute("visible", item.visible || "false");

      const text = document.createElement("a-text");
      text.setAttribute("width", item.width * 5 || "1");
      text.setAttribute("value", item.text);
      text.setAttribute("align", "center");
      text.setAttribute("color", this.color || "blue");
      text.setAttribute("position", "0 0.015 0.05");

      box.appendChild(text);
      subMenu.appendChild(box);
      camera.appendChild(subMenu);
    });

    curvedImages.forEach((image) => {
      const curvedImage = document.createElement("a-curvedimage");
      curvedImage.setAttribute("id", image.id);
      curvedImage.setAttribute("src", "assets/grey.png");
      curvedImage.setAttribute("radius", image.radius);
      curvedImage.setAttribute("theta-length", image.thetaLength);
      curvedImage.setAttribute("height", image.height);
      curvedImage.setAttribute("position", image.position);
      curvedImage.setAttribute("rotation", image.rotation);

      camera.appendChild(curvedImage);
    });

    // Append rig entity to the current entity
    this.el.appendChild(rig);
  },
});

AFRAME.registerComponent("thumbstick-logging", {
  init: function () {
    this.el.addEventListener("thumbstickmoved", this.logThumbstick.bind(this));
  },
  logThumbstick: function (evt) {
    var rig = document.querySelector("#rig");
    var camera = rig.querySelector("a-camera");
    var position = rig.getAttribute("position");
    var rotation = camera.object3D.rotation;
    var moveSpeed = 0.1; 

    //calculate the forward vector based on the camera's rotation
    var forward = new THREE.Vector3(0,0,-1);
    forward.applyQuaternion(camera.object3D.quaternion);
    forward.y = 0;
    forward.normalize();

    //calculate the right vector
    var right = new THREE.Vector3(1,0,0);
    right.applyQuaternion(camera.object3D.quaternion);
    right.y = 0;
    right.normalize();

    // Update position based on thumbstick input
    if (evt.target.id === "leftHand") {
      if (evt.detail.y > 0.1) {
        position.x -= forward.x * moveSpeed;
        position.z -= forward.z * moveSpeed;
      }
      if (evt.detail.y < -0.1) {
        position.x += forward.x * moveSpeed;
        position.z += forward.z * moveSpeed;
      }
      if (evt.detail.x < -0.1) {
        position.x -= right.x * moveSpeed;
        position.z -= right.z * moveSpeed;
      }
      if (evt.detail.x > 0.1) {
        position.x += right.x * moveSpeed;
        position.z += right.z * moveSpeed;
      }
      rig.setAttribute("position", position);
    }
    if ( evt.target.id === "rightHand" && (evt.detail.x < -0.1 || evt.detail.x > 0.1)) {
      var rotationSpeed = 2;
      rotation.y -= evt.detail.x * rotationSpeed;
      rig.setAttribute("rotation", {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
      });
    }
  },
});
