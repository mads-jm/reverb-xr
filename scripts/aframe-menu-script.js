function handleMouseDown(element) {
  element.setAttribute("material", "color", "black");
}

function handleMouseUp(element) {
  element.setAttribute("material", "color", "grey");
}

window.addEventListener('message', function(event) {
  if (event.data.type === 'playPause') {
    var playPause = document.getElementById("playPause");
    var text = playPause.querySelector("a-text");
    if (event.data.data === 'play') {
      text.setAttribute("value", "Pause");
      text.setAttribute("color", "red");
    } else {
      text.setAttribute("value", "Play");
      text.setAttribute("color", "blue");
    }
  }
});

var zOffset = 0;
var yOffset = 0;
window.addEventListener("enter-vr", (e) => {
  if (AFRAME.utils.device.checkHeadsetConnected()) {
    // TODO: Set yOffset, and zOffset based on VR display
    zOffset = 0;
    yOffset = 0;
  }
});

var isHidden = false;
var isUp = false;
var isMoving = false;
window.handleClick = function (id) {
  console.log("Box clicked:", id);
  if (id === "playPause" && !isHidden) {
    var playPause = document.getElementById("playPause");
    var text = playPause.querySelector("a-text");
    if (text.getAttribute("value") === "Play") {
      text.setAttribute("value", "Pause");
      text.setAttribute("color", "red");
      window.parent.postMessage({ type: "playPauseTo", data: "play" }, "*");
    } else {
      text.setAttribute("value", "Play");
      text.setAttribute("color", "blue");
      window.parent.postMessage({ type: "playPauseTo", data: "pause" }, "*");
    }
  } else if (
    (id === "hideShow" && !isHidden) | (id === "show" && isHidden) &&
    !isUp &&
    !isMoving
  ) {
    var b0 = document.getElementById("menuBackground");
    var b1 = document.getElementById("subMenuBackground1");
    var b2 = document.getElementById("subMenuBackground2");
    var b3 = document.getElementById("subMenuBackground3");
    var b4 = document.getElementById("subMenuBackground4");
    var m1 = document.getElementById("hideShow");
    var m2 = document.getElementById("playPause");
    var m3 = document.getElementById("menu3");
    var m4 = document.getElementById("settings");
    var m5 = document.getElementById("menu5");
    var tp1;
    var show = document.getElementById("show");
    if (!isHidden) {
      tp1 = "0 -2" + yOffset + " 0" + zOffset;
      show.setAttribute("visible", "true");
      isHidden = true;
      // Hide all menu items
    } else {
      tp1 = "0 -0.67" + yOffset + " 1.1" + zOffset;
      show.setAttribute("visible", "false");
      isHidden = false;
      // Show all menu items
    }
    isMoving = true;
    b0.setAttribute(
      "animation",
      "property: position; to: " + tp1 + "; dur: 500"
    );
    b1.setAttribute(
      "animation",
      "property: position; to: " + tp1 + "; dur: 500"
    );
    b2.setAttribute(
      "animation",
      "property: position; to: " + tp1 + "; dur: 500"
    );
    b3.setAttribute(
      "animation",
      "property: position; to: " + tp1 + "; dur: 500"
    );
    b4.setAttribute(
      "animation",
      "property: position; to: " + tp1 + "; dur: 500"
    );
    if (!isHidden) {
      setTimeout(function () {
        m1.setAttribute("visible", !isHidden);
        m2.setAttribute("visible", !isHidden);
        m3.setAttribute("visible", !isHidden);
        m4.setAttribute("visible", !isHidden);
        m5.setAttribute("visible", !isHidden);
        isMoving = false;
      }, 500);
    } else {
      m1.setAttribute("visible", !isHidden);
      m2.setAttribute("visible", !isHidden);
      m3.setAttribute("visible", !isHidden);
      m4.setAttribute("visible", !isHidden);
      m5.setAttribute("visible", !isHidden);
    }
    setTimeout(function () {
      isMoving = false;
    }, 500);
  } else if (id === "settings" && !isHidden) {
    var b1 = document.getElementById("subMenuBackground1");
    var b2 = document.getElementById("subMenuBackground2");
    var b3 = document.getElementById("subMenuBackground3");
    var b4 = document.getElementById("subMenuBackground4");
    var s1 = document.getElementById("sub1");
    var s2 = document.getElementById("sub2");
    var s3 = document.getElementById("sub3");
    var s4 = document.getElementById("sub4");
    var s5 = document.getElementById("sub5");
    var targetPosition1;
    var targetPosition2;
    var targetPosition3;
    var targetPosition4;

    if (isUp) {
      // If the menu is up, move it down
      s1.setAttribute("visible", "false");
      s2.setAttribute("visible", "false");
      s3.setAttribute("visible", "false");
      s4.setAttribute("visible", "false");
      s5.setAttribute("visible", "false");
      targetPosition1 = "0 -0.67" + yOffset + " 1.1" + zOffset;
      targetPosition2 = "0 -0.67" + yOffset + " 1.1" + zOffset;
      targetPosition3 = "0 -0.67" + yOffset + " 1.1" + zOffset;
      targetPosition4 = "0 -0.67" + yOffset + " 1.1" + zOffset;
      isUp = false;
    } else {
      // If the menu is down, move it up
      setTimeout(function () {
        if (isUp) {
          s1.setAttribute("visible", "true");
          s2.setAttribute("visible", "true");
          s3.setAttribute("visible", "true");
          s4.setAttribute("visible", "true");
          s5.setAttribute("visible", "true");
        }
      }, 500);
      targetPosition1 = "0 -0.40" + yOffset + " 1.1" + zOffset;
      targetPosition2 = "0 -0.25" + yOffset + " 1.1" + zOffset;
      targetPosition3 = "0 -0.1" + yOffset + " 1.1" + zOffset;
      targetPosition4 = "0 0.05" + yOffset + " 1.1" + zOffset;
      isUp = true;
    }

    b1.setAttribute(
      "animation",
      "property: position; to: " + targetPosition1 + "; dur: 500"
    );
    b2.setAttribute(
      "animation",
      "property: position; to: " + targetPosition2 + "; dur: 500"
    );
    b3.setAttribute(
      "animation",
      "property: position; to: " + targetPosition3 + "; dur: 500"
    );
    b4.setAttribute(
      "animation",
      "property: position; to: " + targetPosition4 + "; dur: 500"
    );
  } else if (id === "sub1" && isUp) {
    // DualWave
    if (window.location.href.indexOf("stage-dualwave") === -1) {
      window.location.href = "stage-dualwave.html";
    } else {
      window.location.href = "stage-lobby.html";
    }
  } else if (id === "sub2" && isUp) {
    // Start
    window.location.href = "stage-lobby.html";
  } else if (id === "sub3" && isUp) {
    // Particle
    if (window.location.href.indexOf("stage-particle") === -1) {
      window.location.href = "stage-particle.html";
    } else {
      window.location.href = "stage-lobby.html";
    }
  } else if (id === "sub4" && isUp) {
    // Bars
    if (window.location.href.indexOf("stage-bars") === -1) {
      window.location.href = "stage-bars.html";
    } else {
      window.location.href = "stage-lobby.html";
    }
  } else if (id === "sub5" && isUp) {
    // Wave
    if (window.location.href.indexOf("stage-wave") === -1) {
      window.location.href = "stage-wave.html";
    } else {
      window.location.href = "stage-lobby.html";
    }
  }
};
