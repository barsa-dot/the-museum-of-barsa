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

// ----- Shared helper for entrance scenes -----
function startScene(scene) {
  scene.hidden = false;

  // Reading offsetWidth makes the browser draw the scene once at
  // opacity 0 first. Without it, the fade-in transition would be skipped.
  void scene.offsetWidth;

  // All the movement is CSS animation; this class starts it.
  scene.classList.add("is-playing");
}

// ----- Entrance: dark passage -----
const passage = document.getElementById("passage");

function startPassage() {
  startScene(passage);

  // The light's animation is the longest, so its end marks the end of the scene.
  const light = passage.querySelector(".passage__light");
  light.addEventListener("animationend", startStairs, { once: true });
}

// ----- Entrance: staircase descent -----
const stairs = document.getElementById("stairs");

function startStairs() {
  // The stairs fade in on top of the passage...
  startScene(stairs);

  // ...and once they fully cover it, the passage can be hidden.
  stairs.addEventListener("transitionend", function onFadeIn(event) {
    if (event.target !== stairs) return;
    passage.hidden = true;
    stairs.removeEventListener("transitionend", onFadeIn);
  });

  // The descent ends when the steps stop moving.
  const flight = stairs.querySelector(".stairs__flight");
  flight.addEventListener("animationend", function () {
    // Next step of the entrance (monumental doors) is added in the next commit.
  }, { once: true });
}
