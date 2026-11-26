import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { github, portrait, projects } from "./projects";
import type { PortfolioProject } from "./projects";

gsap.registerPlugin(ScrollTrigger);

function Cover({ id }: { id: string }) {
  return (
    <div className={ "cover cover--" + id } aria-hidden="true">
      {id === "tasknest" && <>
        <div className="cover-word"><small>Student planner</small><strong>TaskNest</strong></div>
        <div className="planner">
          <div className="task-sheet"><b>Today</b><span>✓ &nbsp; Review notes</span><span>✓ &nbsp; Submit lab</span><span>□ &nbsp; Plan next week</span></div>
          <div className="garden"><i/><i/><i/><b>Progress garden</b></div>
        </div>
      </>}
      {id === "authordna" && <>
        <div className="cover-word"><small>Writing analysis</small><strong>AuthorDNA</strong></div>
        <div className="manuscript">
          <b>A note on rhythm</b>
          <p>Some sentences arrive in a rush. <mark>Others take their time</mark>, leaving a little space for the reader to catch up.</p>
          <p>Pay attention to the places where <mark>the pace changes.</mark></p>
        </div>
      </>}
      {id === "desi-zayka" && <>
        <div className="cover-word"><small>Bengaluru cloud kitchen</small><strong>Desi Zayka</strong></div>
        <div className="menu-art">
          <div><b>Browse the menu</b><span>Find a dish you like</span><strong>Order on WhatsApp</strong></div>
          <div className="plate"><i/><i/><i/><i/><i/></div>
        </div>
      </>}
      {id === "arcade" && <>
        <div className="cover-word"><small>Game select</small><strong>ARCADE 2.0</strong></div>
        <div className="arcade-art">
          <div><b>▸ Space Shooter</b><span>Snake</span><span>Pong</span><span>Breakout</span></div>
          <img src={import.meta.env.BASE_URL + "images/projects/space-shooter.png"} alt="" />
        </div>
      </>}
    </div>
  );
}

function ProjectCard({ project }: { project: PortfolioProject }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <article className="project">
      <button ref={button} className="project-button" type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        <Cover id={project.id} />
        <div className="project-caption">
          <div><h3>{project.name}</h3><p>{project.summary}</p></div>
          <span className="project-category">{project.category}</span>
        </div>
      </button>
      <dialog ref={dialog} className="project-detail" aria-labelledby={project.id + "-title"} onClose={() => button.current?.focus({ preventScroll: true })}>
        <div className="detail-top">
          <span className="label">{project.category}</span>
          <form method="dialog"><button>Close</button></form>
        </div>
        <h2 id={project.id + "-title"}>{project.name}</h2>
        <h3>Purpose</h3><p>{project.purpose}</p>
        <h3>My contribution</h3><p>{project.contribution}</p>
        <h3>Stack</h3><ul className="stack">{project.stack.map(tool => <li key={tool}>{tool}</li>)}</ul>
        <div className="detail-links">{project.links.map(link => <a key={link.url} href={link.url}>{link.label}</a>)}</div>
      </dialog>
    </article>
  );
}

export function Portfolio() {
  const sequence = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const badge = useRef<HTMLDivElement>(null);
  const work = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = sequence.current!;
    const coverElements = gsap.utils.toArray<HTMLElement>(".cover", root);
    const media = gsap.matchMedia();
    media.add("(min-width: 850px) and (prefers-reduced-motion: no-preference)", () => {
      const badges = badge.current!;
      const heading = work.current!;
      const bounds = coverElements.map(cover => cover.parentElement!);
      const spot = (index: number, collage: boolean) => {
        const card = bounds[index]!.getBoundingClientRect();
        const origin = badges.getBoundingClientRect();
        const target = heading.getBoundingClientRect();
        const stage = root.getBoundingClientRect();
        const spread = Math.min(stage.width * .205, 282);
        return {
          x: (collage ? stage.left + stage.width / 2 + spread * (index % 2 ? 1 : -1) : origin.left + origin.width / 2) - card.left - card.width / 2,
          y: (collage ? target.top + 96 + (index < 2 ? -95 : 110) : origin.top + origin.height * .6) - card.top - coverElements[index]!.offsetHeight / 2,
        };
      };
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: hero.current!,
          start: "top top",
          endTrigger: heading,
          end: "top 17%",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      coverElements.forEach((cover, index) => {
        timeline.fromTo(cover, {
          x: () => spot(index, false).x,
          y: () => spot(index, false).y,
          scale: .12,
          rotation: [-9, 7, -5, 11][index]!,
          opacity: 0,
        }, {
          x: () => spot(index, true).x,
          y: () => spot(index, true).y,
          scale: .53,
          rotation: [-10, 7, 5, -6][index]!,
          opacity: 1,
          duration: .48,
          ease: "power1.out",
        }, .05 + index * .025).to(cover, {
          x: 0, y: 0, rotation: 0, scale: 1, duration: .395 - index * .025, ease: "power1.inOut",
        }, .605);
      });
      timeline.fromTo(".section-heading", { opacity: 0 }, { opacity: 1, duration: .22 }, .72);
      timeline.fromTo(".project-caption", { opacity: 0 }, { opacity: 1, duration: .19 }, .81);
    }, root);
    let active = true;
    void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
    return () => { active = false; media.revert(); };
  }, []);

  return (
    <>
      <a href="#work" className="skip-link">Skip to work</a>
      <header className="site-header frame" id="top">
        <a href="#top" className="monogram" aria-label="Barsarani Sahoo, top of page">BS<span>.</span></a>
        <nav aria-label="Main navigation"><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
      </header>
      <main>
        <div ref={sequence} className="sequence">
          <section ref={hero} className="hero frame" aria-labelledby="hero-title">
            <div ref={badge} className="badge-mount">
              <div className="lanyard">
                <div className="badge">
                  <div className="badge-head"><b>BS</b><span>●</span></div>
                  {portrait && <img src={import.meta.env.BASE_URL + portrait.src} alt="" width={portrait.width} height={portrait.height} />}
                  <span className="badge-city">Bengaluru</span>
                </div>
              </div>
            </div>
            <h1 id="hero-title"><span>Barsarani</span> <span>Sahoo</span></h1>
            <div className="hero-intro">
              <p>I build software and explore what makes it useful.</p>
              <a className="primary" href="#work">View my work</a>
            </div>
          </section>
          <section ref={work} id="work" className="work frame" aria-labelledby="work-title" tabIndex={-1}>
            <div className="section-heading"><h2 id="work-title">Selected Work</h2><span aria-hidden="true">✳</span></div>
            <div className="gallery">{projects.map(project => <ProjectCard key={project.id} project={project} />)}</div>
          </section>
        </div>

        <section className="about frame" id="about" aria-labelledby="about-title">
          <h2 id="about-title">About</h2>
          <div>
            <p>I’m Barsarani Sahoo, based in Bengaluru. I study CSIT at REVA University and Digital Business &amp; Entrepreneurship at IIM Bangalore. Those two perspectives shape how I build software and ask what makes it useful for the people who use it.</p>
            <p>I work in Industry Outreach at the IIMB DBE Partnership Cell and write at ACHIVIA. Both give me ways to practise listening, asking better questions and communicating ideas clearly.</p>
          </div>
        </section>
        <footer className="contact" id="contact">
          <div className="frame contact-inner">
            <h2>Contact</h2>
            <a href={github.url}>GitHub <span>{github.label}</span></a>
            <a href="#top" className="back-top">Back to top</a>
          </div>
        </footer>
      </main>
    </>
  );
}
