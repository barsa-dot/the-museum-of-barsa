// The Museum of Barsa — transitions, map, hotspots and projects loader.

// ----- Page elements used by the entrance -----
const intro = document.getElementById("intro");
const enterButton = document.getElementById("enter-button");
const skipButton = document.getElementById("skip-button");
const passage = document.getElementById("passage");
const stairs = document.getElementById("stairs");
const doors = document.getElementById("doors");

// True if the visitor has asked their device for less motion.
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ----- Intro screen -----
enterButton.addEventListener("click", function () {
  // Visitors who prefer less motion skip the whole entrance animation.
  if (prefersReducedMotion()) {
    finishEntrance();
    return;
  }

  // Fade the intro out (the fade itself is a CSS transition).
  intro.classList.add("is-leaving");

  // Once the fade has finished, remove it and start the passage.
  intro.addEventListener("transitionend", function onFadeEnd(event) {
    // transitionend also bubbles up from children (e.g. the button's
    // hover colour change), so only react to the intro's own fade.
    if (event.target !== intro) return;

    intro.hidden = true;
    intro.removeEventListener("transitionend", onFadeEnd);
    showSkipButton();
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
function startPassage() {
  startScene(passage);

  // The light's animation is the longest, so its end marks the end of the scene.
  const light = passage.querySelector(".passage__light");
  light.addEventListener("animationend", startStairs, { once: true });
}

// ----- Entrance: staircase descent -----
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
  flight.addEventListener("animationend", startDoors, { once: true });
}

// ----- Entrance: monumental doors -----
function startDoors() {
  // The doors scene fades in on top of the stairs, then the stairs are hidden.
  startScene(doors);

  doors.addEventListener("transitionend", function onFadeIn(event) {
    if (event.target !== doors) return;
    stairs.hidden = true;
    doors.removeEventListener("transitionend", onFadeIn);
  });

  // The frame has the last animation (walking through the doorway).
  // Animation events from the doors inside it bubble up too, so we
  // check the animation name to react only to the right one.
  const frame = doors.querySelector(".doors__frame");
  frame.addEventListener("animationend", function onWalkThrough(event) {
    if (event.animationName !== "walk-through") return;
    frame.removeEventListener("animationend", onWalkThrough);
    finishEntrance();
  });
}

// ----- Skip -----
function showSkipButton() {
  skipButton.hidden = false;
  // The Enter button just disappeared, so give keyboard focus to Skip.
  skipButton.focus();
}

skipButton.addEventListener("click", finishEntrance);

// The Escape key also skips, but only while the entrance is playing.
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !skipButton.hidden) {
    finishEntrance();
  }
});

// ----- End of the entrance -----
// Called when the doors animation ends, when Skip is used,
// or straight away for reduced-motion visitors.
function finishEntrance() {
  // Hiding a scene (display: none) also stops its running animations,
  // so none of their "animationend" handlers will fire afterwards.
  intro.hidden = true;
  passage.hidden = true;
  stairs.hidden = true;
  doors.hidden = true;
  skipButton.hidden = true;

  // The Grand Atrium is revealed here in a later commit.
}
