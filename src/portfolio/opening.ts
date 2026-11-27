import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Positions are fractions of the usable stage. Each group occupies a quadrant.
const scatter = [
  [.20, .29, -13, 1.08], [.34, .16, 8, .87], [.40, .37, -5, .83], [.17, .49, 10, .75],
  [.66, .19, -8, 1.09], [.80, .31, 12, .91], [.59, .39, 5, .76], [.87, .15, -8, .77],
  [.18, .70, 9, 1.08], [.34, .64, -9, .94], [.30, .86, 7, .89], [.43, .74, -6, .72],
  [.73, .60, -9, 1.10], [.58, .72, -7, 1.18], [.80, .83, -5, .88], [.88, .57, 12, .78],
] as const;

export function setupOpening(root: HTMLElement, stage: HTMLElement, badge: HTMLElement, work: HTMLElement) {
  const media = gsap.matchMedia();
  const gallery = work.querySelector<HTMLElement>(".gallery")!;
  const fragments = gsap.utils.toArray<HTMLElement>(".fragment", work);
  let desktopTrigger: ScrollTrigger | undefined;

  media.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.fromTo(stage.querySelector("h1"), { y: 14, opacity: .84 }, {
      y: 0, opacity: 1, duration: .54, delay: .13, ease: "power3.out",
    });

    const about = root.nextElementSibling;
    if (about?.matches(".about")) {
      const wave = gsap.timeline({
        scrollTrigger: { trigger: about, start: "top 98%", end: "top 48%", scrub: true, refreshPriority: -1 },
      });
      wave.fromTo(about.querySelector(".about-wave"), { yPercent: 44 }, { yPercent: 0, duration: .74, ease: "sine.out" });
      wave.fromTo(about.querySelectorAll(".about-inner h2, .about-lines p, .about-copy"), {
        y: 28, opacity: 0,
      }, { y: 0, opacity: 1, duration: .42, stagger: .095, ease: "power2.out" }, .51);
    }

  }, root);

  media.add("(min-width: 850px) and (prefers-reduced-motion: no-preference)", () => {
    root.classList.add("motion-desktop");
    const timeline = gsap.timeline({ defaults: { ease: "none" } });
    const stagger = [0, .09, .04, .13, .02, .10, .05, .15, .03, .12, .08, .16, .01, .11, .07, .14];
    const measure = () => ({
      bounds: stage.getBoundingClientRect(),
      hero: badge.parentElement!.getBoundingClientRect(),
      badgeX: badge.offsetLeft + badge.offsetWidth / 2,
      badgeY: badge.offsetTop + badge.offsetHeight + 24,
      slots: fragments.map(fragment => fragment.parentElement!.getBoundingClientRect()),
    });
    let geometry = measure();
    const position = (index: number, pose: "stack" | "launch" | "scatter" | "gather" | "arc") => {
      const { bounds, hero, badgeX, badgeY, slots } = geometry;
      const slot = slots[index]!;
      const [x, y, rotation, depth] = scatter[index]!;
      const stageX = bounds.width * x;
      const stageY = bounds.height * y;
      const group = Math.floor(index / 4);
      const piece = index % 4;
      let left = stageX;
      let top = stageY;
      let angle: number = rotation;
      const scale = Math.min(1.16, bounds.width / 1150, bounds.height / 650);
      const size = Math.min(bounds.width * .18, 214) * scale / slot.width;
      let zoom = size * depth;

      if (pose === "stack" || pose === "launch") {
        left = hero.left - bounds.left + badgeX + (piece - 1.5) * 7 + (index === 13 ? 18 : 0);
        top = hero.top - bounds.top + badgeY + (group - 1.5) * 5;
        angle *= .55;
        zoom = (index === 13 ? 76 : 44) / slot.width;
        if (pose === "launch") {
          left += (stageX - left) * .39;
          top += (stageY - top) * .34 + (group < 2 ? -1 : 1) * bounds.height * .085;
          angle = rotation * 1.45;
          zoom = size * depth * .72;
        }
      }
      if (pose === "gather" || pose === "arc") {
        const spacing = Math.min(bounds.width * .119, 157);
        const pitch = Math.min(bounds.height * .139, 116);
        const column = (group % 2) * 2 + piece % 2 - 1.5;
        const row = Math.floor(group / 2) * 2 + Math.floor(piece / 2) - 1.5;
        const sheetX = bounds.width * .5 + column * spacing + row * 11;
        const sheetY = bounds.height * .52 + row * pitch + column * 8;
        left = sheetX;
        top = sheetY;
        angle *= .48;
        zoom = size * (.84 + depth * .15);
        if (pose === "arc") {
          left = stageX * .54 + sheetX * .46 + (group % 2 ? 1 : -1) * 30;
          top = stageY * .57 + sheetY * .43 - (piece % 2 ? 26 : -34);
          angle = rotation * 1.13;
        }
      }
      return {
        x: bounds.left + left - slot.left - slot.width / 2,
        y: bounds.top + top - slot.top - slot.height / 2,
        rotation: angle,
        scale: zoom,
      };
    };
    const values = (index: number, pose: Parameters<typeof position>[1]) => ({
      x: () => position(index, pose).x,
      y: () => position(index, pose).y,
      rotation: () => position(index, pose).rotation,
      scale: () => position(index, pose).scale,
    });

    fragments.forEach((fragment, index) => {
      const delay = index === 13 ? 0 : stagger[index]! + .12;
      timeline.fromTo(fragment, { ...values(index, "stack"), opacity: 0 }, {
        ...values(index, "launch"), opacity: 1, ease: "sine.in", duration: .31,
      }, .02 + delay);
      timeline.to(fragment, { ...values(index, "scatter"), ease: "power2.out", duration: .67 }, .33 + delay);
      timeline.to(fragment, { ...values(index, "arc"), ease: "sine.in", duration: .33 }, 1.53 + delay);
      timeline.to(fragment, { ...values(index, "gather"), ease: "sine.out", duration: .44 }, 1.86 + delay);
      timeline.to(fragment, { x: 0, y: 0, scale: 1, rotation: 0, duration: .65, ease: "power2.inOut" }, 2.54 + delay * .8);
    });

    timeline.fromTo(".hero-content", { yPercent: 0, opacity: 1 }, { yPercent: -35, opacity: 0, duration: .52, ease: "power1.in" }, 0);
    timeline.fromTo(badge, { y: 0, rotationZ: 0, opacity: 1 }, {
      rotationZ: 44, duration: .52, ease: "power1.inOut",
    }, 0).to(badge, { rotationZ: 59, y: -12, opacity: 0, duration: .37, ease: "sine.in" }, .5);
    timeline.fromTo(".cover", { "--cover-opacity": 0 }, { "--cover-opacity": 1, duration: .5 }, 2.71);
    timeline.fromTo(".cover-title", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .3, stagger: .04 }, 2.94);
    timeline.fromTo(".section-heading, .project-caption", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .37 }, 3.03);

    const sync = (trigger: ScrollTrigger) => {
      gallery.inert = trigger.progress < .985;
      badge.inert = trigger.progress > .24;
      stage.classList.toggle("opening-in-progress", trigger.progress > .16);
    };
    desktopTrigger = ScrollTrigger.create({
      animation: timeline,
      trigger: stage,
      start: "top top",
      end: () => "+=" + Math.round(Math.max(820, Math.min(innerHeight * 1.47, 1300))),
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: sync,
      onRefreshInit: () => { geometry = measure(); },
      onRefresh: sync,
    });
    sync(desktopTrigger);
    return () => {
      root.classList.remove("motion-desktop");
      stage.classList.remove("opening-in-progress");
      gallery.inert = false;
      badge.inert = false;
      desktopTrigger = undefined;
    };
  }, root);

  media.add("(max-width: 849px) and (prefers-reduced-motion: no-preference)", () => {
    const cover = work.querySelector<HTMLElement>(".cover")!;
    const pieces = fragments.slice(0, 4);
    const measure = () => pieces.map(piece => {
      const slot = piece.parentElement!.getBoundingClientRect();
      const origin = badge.parentElement!.getBoundingClientRect();
      return {
        x: origin.left + badge.offsetLeft + badge.offsetWidth / 2 - (slot.left + slot.width / 2),
        y: origin.top + badge.offsetTop + badge.offsetHeight + 24 - (slot.top + slot.height / 2),
      };
    });
    let stack = measure();
    const timeline = gsap.timeline();
    pieces.forEach((fragment, index) => {
      const delay = index * .045;
      timeline.fromTo(fragment, {
        x: () => stack[index]!.x, y: () => stack[index]!.y, scale: .27, opacity: 0, rotation: 0,
      }, {
        x: 0, y: 0, xPercent: [-13, 13, -15, 15][index]!, yPercent: [-93, -63, -52, -74][index]!,
        scale: .86, opacity: 1, rotation: [-13, 12, -9, 8][index]!, duration: .36, ease: "power2.out",
      }, .025 + delay);
      timeline.to(fragment, {
        xPercent: 0, yPercent: 0, scale: 1, rotation: 0, duration: .42, ease: "power2.inOut",
      }, .51 + delay);
    });
    timeline.fromTo(cover, { "--cover-opacity": .32 }, { "--cover-opacity": 1, duration: .45 }, .57);
    timeline.fromTo(cover.querySelector(".cover-title"), { opacity: .35 }, { opacity: 1, duration: .41 }, .62);
    ScrollTrigger.create({
      animation: timeline,
      trigger: stage,
      start: 0,
      end: () => "+=" + Math.max(240, innerHeight * .34),
      scrub: true,
      invalidateOnRefresh: true,
      onRefreshInit: () => { stack = measure(); },
    });
  }, root);

  const goToWork = (event: MouseEvent) => {
    if (!desktopTrigger || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== "#work") history.pushState(null, "", "#work");
    window.scrollTo(0, desktopTrigger.end + 1);
    ScrollTrigger.update();
    work.focus({ preventScroll: true });
  };
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href="#work"]');
  links.forEach(link => link.addEventListener("click", goToWork));
  const followHash = () => {
    if (desktopTrigger && location.hash === "#work") {
      window.scrollTo(0, desktopTrigger.end + 1);
      ScrollTrigger.update();
    }
  };
  window.addEventListener("hashchange", followHash);
  let active = true;
  void document.fonts.ready.then(() => {
    if (!active) return;
    ScrollTrigger.refresh();
    followHash();
  });

  return () => {
    active = false;
    links.forEach(link => link.removeEventListener("click", goToWork));
    window.removeEventListener("hashchange", followHash);
    media.revert();
  };
}
