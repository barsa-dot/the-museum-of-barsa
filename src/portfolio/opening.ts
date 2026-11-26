import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Positions are fractions of the usable stage. Each group occupies a quadrant.
const scatter = [
  [.20, .29, -13, 1.08], [.34, .16, 8, .87], [.40, .37, -5, .83], [.17, .49, 10, .75],
  [.66, .19, -8, 1.09], [.80, .31, 12, .91], [.59, .39, 5, .76], [.87, .15, -8, .77],
  [.18, .70, 9, 1.08], [.34, .64, -9, .94], [.30, .86, 7, .89], [.43, .74, -6, .72],
  [.73, .60, -9, 1.10], [.60, .77, 7, .86], [.80, .83, -5, .88], [.88, .57, 12, .78],
] as const;

export function setupOpening(root: HTMLElement, stage: HTMLElement, badge: HTMLElement, work: HTMLElement) {
  const media = gsap.matchMedia();
  const gallery = work.querySelector<HTMLElement>(".gallery")!;
  const fragments = gsap.utils.toArray<HTMLElement>(".fragment", work);
  let desktopTrigger: ScrollTrigger | undefined;

  media.add("(min-width: 850px) and (min-height: 530px) and (prefers-reduced-motion: no-preference)", () => {
    root.classList.add("motion-desktop");
    const timeline = gsap.timeline({ defaults: { ease: "none" } });
    const stagger = [0, .09, .04, .13, .02, .10, .05, .15, .03, .12, .08, .16, .01, .11, .07, .14];
    const position = (index: number, pose: "stack" | "scatter" | "gather" | "arc") => {
      const bounds = stage.getBoundingClientRect();
      const slot = fragments[index]!.parentElement!.getBoundingClientRect();
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

      if (pose === "stack") {
        const hero = badge.parentElement!.getBoundingClientRect();
        left = hero.left - bounds.left + badge.offsetLeft + (piece - 1.5) * 7;
        top = hero.top - bounds.top + badge.offsetTop + badge.offsetHeight * .69 + (group - 1.5) * 5;
        angle *= .55;
        zoom = 38 / slot.width;
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
      const delay = stagger[index]!;
      timeline.fromTo(fragment, { ...values(index, "stack"), opacity: 0 }, {
        ...values(index, "scatter"), opacity: 1, ease: "power2.out", duration: .98,
      }, .16 + delay);
      timeline.to(fragment, { ...values(index, "arc"), ease: "sine.in", duration: .33 }, 1.53 + delay);
      timeline.to(fragment, { ...values(index, "gather"), ease: "sine.out", duration: .44 }, 1.86 + delay);
      timeline.to(fragment, { x: 0, y: 0, scale: 1, rotation: 0, duration: .65, ease: "power2.inOut" }, 2.54 + delay * .8);
    });

    timeline.fromTo(".hero-content", { yPercent: 0, opacity: 1 }, { yPercent: -35, opacity: 0, duration: .52, ease: "power1.in" }, 0);
    timeline.fromTo(".badge-mount", { yPercent: 0, opacity: 1 }, { yPercent: -42, opacity: 0, duration: .49 }, .34);
    timeline.fromTo(".cover", { "--cover-opacity": 0 }, { "--cover-opacity": 1, duration: .5 }, 2.71);
    timeline.fromTo(".cover-title", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .3, stagger: .04 }, 2.94);
    timeline.fromTo(".section-heading, .project-caption", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .37 }, 3.03);

    const sync = (trigger: ScrollTrigger) => {
      gallery.inert = trigger.progress < .985;
      stage.classList.toggle("opening-in-progress", trigger.progress > .16);
    };
    desktopTrigger = ScrollTrigger.create({
      animation: timeline,
      trigger: stage,
      start: "top top",
      end: () => "+=" + Math.round(Math.max(1120, Math.min(innerHeight * 1.8, 1570))),
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: sync,
      onRefresh: sync,
    });
    sync(desktopTrigger);
    return () => {
      root.classList.remove("motion-desktop");
      stage.classList.remove("opening-in-progress");
      gallery.inert = false;
      desktopTrigger = undefined;
    };
  }, root);

  media.add("(max-width: 849px) and (prefers-reduced-motion: no-preference)", () => {
    const cover = work.querySelector<HTMLElement>(".cover")!;
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: cover, start: "top 94%", end: "top 51%", scrub: true },
    });
    timeline.fromTo(cover, { "--cover-opacity": .42 }, { "--cover-opacity": 1, duration: .58 }, .25);
    fragments.slice(0, 4).forEach((fragment, index) => {
      timeline.fromTo(fragment, {
        xPercent: [-15, 15, -18, 18][index]!,
        yPercent: [-65, -55, -26, -43][index]!,
        scale: .79,
        rotation: [-13, 12, -9, 8][index]!,
      }, { xPercent: 0, yPercent: 0, scale: 1, rotation: 0, duration: .65, ease: "power1.inOut" }, index * .1);
    });
    timeline.fromTo(cover.querySelector(".cover-title"), { opacity: .35 }, { opacity: 1, duration: .4 }, .46);
  }, root);

  media.add("(min-width: 850px) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
    const tilt = badge.querySelector(".badge-tilt")!;
    const roll = gsap.quickTo(tilt, "rotationZ", { duration: .52, ease: "power3.out" });
    const pitch = gsap.quickTo(tilt, "rotationY", { duration: .52, ease: "power3.out" });
    const move = (event: PointerEvent) => {
      if (stage.classList.contains("opening-in-progress")) return;
      const amount = (event.clientX / innerWidth - .5) * 2;
      roll(amount * 6);
      pitch(amount * 12);
    };
    const reset = () => { roll(0); pitch(0); };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", reset);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", reset);
    };
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
