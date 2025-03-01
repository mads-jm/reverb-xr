document.addEventListener("DOMContentLoaded", () => {
  AFRAME.registerComponent("button-interaction", {
    init: function () {
      var el = this.el;

      el.addEventListener("mouseenter", function () {
        el.querySelector("a-box").setAttribute("color", "white");
      });

      el.addEventListener("mouseleave", function () {
        el.querySelector("a-box").setAttribute("color", "7D7B7B");
      });

      el.addEventListener("click", function () {
        el.setAttribute("animation", {
          property: "scale",
          to: "1.1 1.1 1.1",
          dur: 300,
          easing: "easeInCubic",
        });
        el.addEventListener("animationcomplete", function () {
          el.setAttribute("animation", {
            property: "scale",
            to: "1 1 1",
            dur: 200,
            easing: "easeOutCubic",
          });
        });
        
      });
      el.addEventListener("start", function () {
        console.log("start");
        window.href = "stage-boxwave.html";
      });
    },
  });

  // Apply the component to the buttons
  // document
  //   .querySelector("#settingsButton")
  //   .setAttribute("button-interaction", "");
  document.querySelector("#startButton").setAttribute("button-interaction", "");

});
