// The Museum of Barsa — transitions, map, hotspots and projects loader.

// ----- Intro screen -----
const intro = document.getElementById("intro");
const enterButton = document.getElementById("enter-button");

enterButton.addEventListener("click", function () {
  // Fade the intro out (the fade itself is a CSS transition).
  intro.classList.add("is-leaving");

  // Once the fade has finished, remove it from the page completely.
  intro.addEventListener("transitionend", function onFadeEnd(event) {
    // transitionend also bubbles up from children (e.g. the button's
    // hover colour change), so only react to the intro's own fade.
    if (event.target !== intro) return;

    intro.hidden = true;
    intro.removeEventListener("transitionend", onFadeEnd);
  });
});
