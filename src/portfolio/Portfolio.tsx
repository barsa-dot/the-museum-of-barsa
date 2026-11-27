import { useLayoutEffect, useRef } from "react";
import { Cover } from "./Cover";
import { PortraitBadge } from "./PortraitBadge";
import { setupOpening } from "./opening";
import { github, projects } from "./projects";
import type { PortfolioProject } from "./projects";

function ProjectCard({ project }: { project: PortfolioProject }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const caption = <div><h3>{project.name}</h3><p>{project.summary}</p></div>;
  return (
    <article className="project">
      {project.id === "tasknest" ? (
        <>
          <Cover id={project.id} title={project.name} />
          <div className="project-caption">
            {caption}
            <button ref={button} className="project-launch" type="button" aria-label="Open TaskNest project" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
              Open project
            </button>
          </div>
        </>
      ) : (
        <button ref={button} className="project-button" type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
          <Cover id={project.id} title={project.name} />
          <div className="project-caption">
            {caption}
            <span className="project-category">{project.category}</span>
          </div>
        </button>
      )}
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
  const stage = useRef<HTMLDivElement>(null);
  const badge = useRef<HTMLDivElement>(null);
  const work = useRef<HTMLElement>(null);

  useLayoutEffect(() => setupOpening(sequence.current!, stage.current!, badge.current!, work.current!), []);

  return (
    <>
      <a href="#work" className="skip-link">Skip to work</a>
      <header className="site-header frame" id="top">
        <a href="#top" className="monogram" aria-label="Barsarani Sahoo, top of page">BS<span>.</span></a>
        <nav aria-label="Main navigation"><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
      </header>
      <main>
        <div ref={sequence} className="sequence">
          <div ref={stage} className="opening-stage">
            <section className="hero frame" aria-labelledby="hero-title">
              <PortraitBadge mount={badge} />
              <div className="hero-content">
                <h1 id="hero-title"><span>Barsarani</span> <span>Sahoo</span></h1>
                <div className="hero-intro">
                  <p>I build software and explore what makes it useful.</p>
                  <a className="primary" href="#work">View my work</a>
                </div>
              </div>
            </section>
            <section ref={work} id="work" className="work frame" aria-labelledby="work-title" tabIndex={-1}>
              <div className="section-heading"><h2 id="work-title">Selected Work</h2><span aria-hidden="true">✳</span></div>
              <div className="gallery">{projects.map(project => <ProjectCard key={project.id} project={project} />)}</div>
            </section>
          </div>
        </div>

        <section className="about" id="about" aria-labelledby="about-title">
          <div className="about-wave" aria-hidden="true" />
          <div className="about-inner frame">
            <h2 id="about-title">About</h2>
            <div className="about-lines">
              <p>Computer Science at REVA</p>
              <p>Digital Business at IIM Bangalore</p>
            </div>
            <div className="about-copy">
              <p>I’m Barsarani Sahoo, based in Bengaluru. I study CSIT at REVA University and Digital Business &amp; Entrepreneurship at IIM Bangalore. Those two perspectives shape how I build software and ask what makes it useful for the people who use it.</p>
              <p>I work in Industry Outreach at the IIMB DBE Partnership Cell and write at ACHIVIA. Both give me ways to practise listening, asking better questions and communicating ideas clearly.</p>
            </div>
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
