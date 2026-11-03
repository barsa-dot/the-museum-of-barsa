// The Museum of Barsa — transitions, map, hotspots and projects loader.

// This file is shared by index.html and every room page.
// The entrance elements only exist on index.html, so the
// entrance code checks for them before using them.

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
if (enterButton) enterButton.addEventListener("click", function () {
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

if (skipButton) skipButton.addEventListener("click", finishEntrance);

// The Escape key also skips, but only while the entrance is playing.
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && skipButton && !skipButton.hidden) {
    finishEntrance();
  }
});

// ----- End of the entrance -----
const atrium = document.getElementById("atrium");
let entranceFinished = false;

// Called when the doors animation ends, when Skip is used,
// or straight away for reduced-motion visitors.
function finishEntrance() {
  // Skip could be pressed just as the doors finish; only run once.
  if (entranceFinished) return;
  entranceFinished = true;

  skipButton.hidden = true;
  controls.hidden = false;
  revealAtrium();

  // The atrium fades in on top of whatever scene was playing.
  // Once it fully covers them, hide the entrance scenes. Hiding a
  // scene (display: none) also stops its running animations.
  atrium.addEventListener("transitionend", function onShown(event) {
    if (event.target !== atrium) return;
    atrium.removeEventListener("transitionend", onShown);

    intro.hidden = true;
    passage.hidden = true;
    stairs.hidden = true;
    doors.hidden = true;
  });
}

// ----- Grand Atrium -----
function revealAtrium() {
  atrium.hidden = false;
  void atrium.offsetWidth;   // same trick as startScene: draw once before fading in
  atrium.classList.add("is-visible");

  // Move keyboard focus to the atrium title so screen readers announce
  // the new room and Tab continues from the doors.
  document.getElementById("atrium-title").focus();
}

// ----- Corner controls (Sound and Map) -----
// A small group of buttons fixed in the top-right corner of every page.
const controls = document.createElement("div");
controls.className = "museum-controls";
// On index.html they stay hidden until the entrance is over.
controls.hidden = intro !== null;
document.body.append(controls);

// ----- Museum map -----
// One list of rooms. The map is built from it by JavaScript, so every
// page gets the same map without copying its HTML into each file.
// Paths start with "/" so they work from index.html and from rooms/.
const ROOMS = [
  { name: "The Grand Atrium",  theme: "Central hall", href: "/index.html#atrium",       area: "atrium" },
  { name: "The Library",       theme: "Education",    href: "/rooms/library.html",       area: "library" },
  { name: "The Creation Wing", theme: "Projects",     href: "/rooms/creation-wing.html", area: "creation" },
  { name: "The Archive",       theme: "Experience",   href: "/rooms/archive.html",       area: "archive" },
  { name: "The Workshop",      theme: "Skills",       href: "/rooms/workshop.html",      area: "workshop" },
  { name: "The Portrait Room", theme: "About",        href: "/rooms/portrait-room.html", area: "portrait" },
  { name: "The Courtyard",     theme: "Contact",      href: "/rooms/courtyard.html",     area: "courtyard" },
];

// Turns a path into a comparable id, so "/", "/index.html",
// "/rooms/library.html" and "/rooms/library" (Cloudflare drops the
// .html) can be matched against each other.
function pageId(path) {
  return path.replace(/\/index(\.html)?$/, "/").replace(/\.html$/, "");
}

const currentPage = pageId(window.location.pathname);

// One <li> on the map. The room you're in is shown but not clickable.
function mapRoomHTML(room) {
  const roomPath = room.href.split("#")[0];
  const isCurrent = pageId(roomPath) === currentPage;

  if (isCurrent) {
    return `<li style="grid-area: ${room.area}">
      <span class="map__room is-current" aria-current="page">
        <span class="map__room-name">${room.name}</span>
        <span class="map__room-theme">You are here</span>
      </span>
    </li>`;
  }

  return `<li style="grid-area: ${room.area}">
    <a class="map__room" href="${room.href}">
      <span class="map__room-name">${room.name}</span>
      <span class="map__room-theme">${room.theme}</span>
    </a>
  </li>`;
}

// The always-visible Map button
const mapButton = document.createElement("button");
mapButton.type = "button";
mapButton.className = "control-button";
mapButton.textContent = "Map";
mapButton.setAttribute("aria-haspopup", "dialog");
controls.append(mapButton);

// The map itself is a <dialog>: the browser handles focus,
// the Escape key and placing it above everything else.
const mapDialog = document.createElement("dialog");
mapDialog.className = "map";
mapDialog.setAttribute("aria-labelledby", "map-title");
mapDialog.innerHTML = `
  <div class="map__inner">
    <button type="button" class="map__close" aria-label="Close map">&times;</button>
    <h2 id="map-title" class="map__title">Museum Map</h2>
    <p class="map__hint">Choose a room to go straight there.</p>
    <nav aria-label="All rooms">
      <ul class="map__plan">${ROOMS.map(mapRoomHTML).join("")}</ul>
    </nav>
  </div>`;

document.body.append(mapDialog);

mapButton.addEventListener("click", function () {
  mapDialog.showModal();
});

mapDialog.querySelector(".map__close").addEventListener("click", function () {
  mapDialog.close();
});

// Clicking the dark area around the map closes it. Those clicks land
// on the <dialog> itself; clicks on the map land on its children.
mapDialog.addEventListener("click", function (event) {
  if (event.target === mapDialog) mapDialog.close();
});

// ----- Optional music -----
// Music never starts on its own: the visitor turns it on with the
// Sound button. The choice is remembered, so it keeps playing (from
// roughly the same point) as they move between room pages.
// To use it, add a track you have the rights to as audio/ambience.mp3.
const music = new Audio("/audio/ambience.mp3");
music.loop = true;
music.volume = 0.4;
music.preload = "metadata";   // only fetch a tiny part until it plays

const soundButton = document.createElement("button");
soundButton.type = "button";
soundButton.className = "control-button";
controls.prepend(soundButton);  // to the left of Map
showSoundState(false);

// Update the button text and aria-pressed (tells screen readers
// whether the toggle is on or off).
function showSoundState(isOn) {
  soundButton.textContent = isOn ? "Sound on" : "Sound off";
  soundButton.setAttribute("aria-pressed", isOn ? "true" : "false");
}

// localStorage can be blocked (e.g. some private windows),
// so every read and write is wrapped in try/catch.
function saveSetting(storage, key, value) {
  try { storage.setItem(key, value); } catch (error) { /* ignore */ }
}

function readSetting(storage, key) {
  try { return storage.getItem(key); } catch (error) { return null; }
}

function playMusic() {
  // play() returns a Promise. It is rejected if the browser blocks it.
  music.play()
    .then(function () { showSoundState(true); })
    .catch(function () { showSoundState(false); });
}

soundButton.addEventListener("click", function () {
  if (music.paused) {
    playMusic();
    saveSetting(localStorage, "museum-sound", "on");
  } else {
    music.pause();
    showSoundState(false);
    saveSetting(localStorage, "museum-sound", "off");
  }
});

// No audio file yet (or it failed to load): hide the button.
music.addEventListener("error", function () {
  soundButton.hidden = true;
});

// Remember where the track was when leaving the page...
window.addEventListener("pagehide", function () {
  saveSetting(sessionStorage, "museum-sound-time", String(music.currentTime));
});

// ...and continue from there if the visitor had turned sound on.
if (readSetting(localStorage, "museum-sound") === "on") {
  music.currentTime = Number(readSetting(sessionStorage, "museum-sound-time")) || 0;
  playMusic();
}

// Coming back from a room uses the link "index.html#atrium".
// In that case skip the intro and go straight to the atrium.
if (intro && window.location.hash === "#atrium") {
  intro.hidden = true;
  finishEntrance();
}

// ----- Room transitions (zoom and fade) -----
// Any link with a data-transition attribute walks into the next room:
// the current scene zooms towards the link and fades out, then the
// browser opens the new page, which fades in (see .room in style.css).
const transitionLinks = document.querySelectorAll("a[data-transition]");

transitionLinks.forEach(function (link) {
  link.addEventListener("click", function (event) {
    // Let Ctrl/Cmd/Shift-click open a new tab as normal.
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;

    const scene = link.closest(".scene");

    // No scene to animate, or the visitor prefers less motion:
    // just follow the link normally.
    if (!scene || prefersReducedMotion()) return;

    event.preventDefault();

    // Zoom towards the centre of the clicked link.
    // transform-origin is measured from the scene's top-left corner.
    const linkBox = link.getBoundingClientRect();
    const sceneBox = scene.getBoundingClientRect();
    const x = linkBox.left + linkBox.width / 2 - sceneBox.left;
    const y = linkBox.top + linkBox.height / 2 - sceneBox.top;
    scene.style.transformOrigin = x + "px " + y + "px";

    scene.classList.add("is-leaving");

    // When the fade-out ends, go to the new page.
    scene.addEventListener("transitionend", function onLeave(e) {
      if (e.target !== scene || e.propertyName !== "opacity") return;
      scene.removeEventListener("transitionend", onLeave);
      window.location.href = link.href;
    });
  });
});

// When the visitor presses Back, the browser may restore this page
// exactly as it was left: zoomed in and invisible. Undo that.
window.addEventListener("pageshow", function (event) {
  if (!event.persisted) return;   // true only for a restored page
  document.querySelectorAll(".scene.is-leaving").forEach(function (scene) {
    scene.classList.remove("is-leaving");
  });
});
