AFRAME.registerComponent("button", {
  schema: {
    position: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    text: { type: "string", default: "Click Me" },
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
    // Create camera entity
    const camera = document.createElement("a-camera");
    camera.setAttribute("wasd-controls", "fly: true");
    camera.setAttribute("look-controls", "enabled: true");
    camera.setAttribute("cursor", "rayOrigin: mouse");

    // Create cursor entity
    // const cursor = document.createElement('a-cursor');
    // cursor.setAttribute('id', 'cursor');
    // cursor.setAttribute(
    // 	'animation__click',
    // 	'property: scale; from: 0.1 0.1 0.1; to: 0.5 0.5 0.5; easing: easeInCubic; dur: 150; startEvents: click'
    // );
    // cursor.setAttribute(
    // 	'animation__clickreset',
    // 	'property: scale; to: 0.1 0.1 0.1; dur: 1; startEvents: animationcomplete__click'
    // );
    // cursor.setAttribute(
    // 	'animation__fusing',
    // 	'property: scale; from: 1 1 1; to: 0.5 0.5 0.5; easing: easeInCubic; dur: 150; startEvents: fusing'
    // );

    // // Append cursor to camera
    // camera.appendChild(cursor);

    const menuItems = [
      {
        position: "-1 -1.5 -4",
        rotation: "0 16.4 0",
        id: "hideShow",
        text: "Hide",
        width: "0.95",
      },
      {
        position: "0 -1.5 -4.15",
        rotation: "0 0 0",
        id: "playPause",
        text: "Play",
        width: "1",
      },
      {
        position: "1 -1.5 -4",
        rotation: "0 -16.4 0",
        id: "menu3",
        text: "About",
        width: "0.95",
      },
      {
        position: "1.84 -1.5 -3.62",
        rotation: "0 -34 0",
        id: "settings",
        text: "Rooms",
        width: "0.85",
      },
      {
        position: "-1.84 -1.5 -3.62",
        rotation: "0 34 0",
        id: "menu5",
        text: "Settings",
        width: "0.85",
      },
      {
        position: "0 -0.4 -0.4",
        rotation: "-45 0 0",
        id: "show",
        text: "/\\",
        width: "0.045",
        height: "0.15",
        visible: "false",
        color: "white",
      },
    ];

    menuItems.forEach((item) => {
      const menuItem = document.createElement("a-entity");
      menuItem.setAttribute("position", item.position);
      menuItem.setAttribute("rotation", item.rotation);
      menuItem.setAttribute("class", "menuItem");

      const box = document.createElement("a-box");
      box.setAttribute("id", item.id);
      box.setAttribute("position", "0 0 0");
      box.setAttribute("depth", "0.1");
      box.setAttribute("height", item.height || "0.5");
      box.setAttribute("width", item.width);
      box.setAttribute("color", "grey");
      box.setAttribute("shadow", "cast: false; receive: false;");
      box.setAttribute("material", "flatShading: false;");
      box.setAttribute("onClick", "handleClick(this.id)");
      box.setAttribute("onmousedown", "handleMouseDown(this)");
      box.setAttribute("onmouseup", "handleMouseUp(this)");
      box.setAttribute("visible", item.visible || "true");

      const text = document.createElement("a-text");
      text.setAttribute("value", item.text);
      text.setAttribute("align", "center");
      text.setAttribute("color", item.color || "blue");
      text.setAttribute("position", "0 0 0.05");

      box.appendChild(text);
      menuItem.appendChild(box);
      camera.appendChild(menuItem);
    });

    const subMenu = [
      {
        position: "-1 -0.5 -4",
        rotation: "0 16.4 0",
        id: "sub1",
        text: "Dual",
        width: "0.95",
      },
      {
        position: "0 -0.5 -4.15",
        rotation: "0 0 0",
        id: "sub2",
        text: "Start",
        width: "1",
      },
      {
        position: "1 -0.5 -4",
        rotation: "0 -16.4 0",
        id: "sub3",
        text: "subM3",
        width: "0.95",
      },
      {
        position: "1.84 -0.5 -3.62",
        rotation: "0 -34 0",
        id: "sub4",
        text: "Bars",
        width: "0.85",
      },
      {
        position: "-1.84 -0.5 -3.62",
        rotation: "0 34 0",
        id: "sub5",
        text: "Wave",
        width: "0.85",
      },
    ];

    subMenu.forEach((item) => {
      const subMenu = document.createElement("a-entity");
      subMenu.setAttribute("position", item.position);
      subMenu.setAttribute("rotation", item.rotation);
      subMenu.setAttribute("class", "subMenu");

      const box = document.createElement("a-box");
      box.setAttribute("id", item.id);
      box.setAttribute("position", "0 0 0");
      box.setAttribute("depth", "0.1");
      box.setAttribute("height", item.height || "0.5");
      box.setAttribute("width", item.width);
      box.setAttribute("color", "grey");
      box.setAttribute("shadow", "cast: false; receive: false;");
      box.setAttribute("material", "flatShading: false;");
      box.setAttribute("onClick", "handleClick(this.id)");
      box.setAttribute("onmousedown", "handleMouseDown(this)");
      box.setAttribute("onmouseup", "handleMouseUp(this)");
      box.setAttribute("visible", "false");

      const text = document.createElement("a-text");
      text.setAttribute("value", item.text);
      text.setAttribute("align", "center");
      text.setAttribute("color", this.color || "blue");
      text.setAttribute("position", "0 0 0.05");

      box.appendChild(text);
      subMenu.appendChild(box);
      camera.appendChild(subMenu);
    });

    // Create curved backgrounds
    const curvedImages = [
      {
        id: "menuBackground",
        src: "grey.png",
        radius: "3.25",
        thetaLength: "100",
        height: "0.75",
        position: "0 -1.5 -1",
        rotation: "0 130 0",
      },
      {
        id: "subMenuBackground1",
        src: "grey.png",
        radius: "3.25",
        thetaLength: "100",
        height: "0.75",
        position: "0 -1.5 -1",
        rotation: "0 130 0",
      },
      {
        id: "subMenuBackground2",
        src: "grey.png",
        radius: "3.25",
        thetaLength: "100",
        height: "0.75",
        position: "0 -1.5 -1",
        rotation: "0 130 0",
      },
      {
        id: "subMenuBackground3",
        src: "grey.png",
        radius: "3.25",
        thetaLength: "100",
        height: "0.75",
        position: "0 -1.5 -1",
        rotation: "0 130 0",
      },
      {
        id: "subMenuBackground4",
        src: "grey.png",
        radius: "3.25",
        thetaLength: "100",
        height: "0.75",
        position: "0 -1.5 -1",
        rotation: "0 130 0",
      },
    ];

    curvedImages.forEach((image) => {
      const curvedImage = document.createElement("a-curvedimage");
      curvedImage.setAttribute("id", image.id);
      curvedImage.setAttribute("src", image.src);
      curvedImage.setAttribute("radius", image.radius);
      curvedImage.setAttribute("theta-length", image.thetaLength);
      curvedImage.setAttribute("height", image.height);
      curvedImage.setAttribute("position", image.position);
      curvedImage.setAttribute("rotation", image.rotation);

      camera.appendChild(curvedImage);
    });

    // Append camera to the current entity
    this.el.appendChild(camera);
  },
});
