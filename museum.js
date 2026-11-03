// The Museum of Barsa — transitions, map, hotspots and projects loader.

// ----- Intro screen -----
const intro = document.getElementById("intro");
const enterButton = document.getElementById("enter-button");

enterButton.addEventListener("click", function () {
  // Fade the intro out (the fade itself is a CSS transition).
  intro.classList.add("is-leaving");

  // Once the fade has finished, remove it and start the passage.
  intro.addEventListener("transitionend", function onFadeEnd(event) {
    // transitionend also bubbles up from children (e.g. the button's
    // hover colour change), so only react to the intro's own fade.
    if (event.target !== intro) return;

    intro.hidden = true;
    intro.removeEventListener("transitionend", onFadeEnd);
    startPassage();
  });
});

// ----- Entrance: dark passage -----
const passage = document.getElementById("passage");

function startPassage() {
  passage.hidden = false;

  // Reading offsetWidth makes the browser draw the scene once at
  // opacity 0 first. Without it, the fade-in transition would be skipped.
  void passage.offsetWidth;

  // All the movement is CSS animation; this class starts it.
  passage.classList.add("is-playing");

  // The light's animation is the longest, so its end marks the end of the scene.
  const light = passage.querySelector(".passage__light");
  light.addEventListener("animationend", function () {
    // Next step of the entrance (staircase) is added in the next commit.
  }, { once: true });
}
