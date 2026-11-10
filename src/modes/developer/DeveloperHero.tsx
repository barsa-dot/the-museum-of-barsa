// Developer Mode identity hero: a large pixel portrait beside the owner's
// name and a short description, styled after the terminal reference.
//
// The description uses only verified profile facts (headline when supplied,
// degrees, GitHub). Until the owner's pixel portrait exists, a clearly
// labelled placeholder is shown — never another face.

import { useModeView, SafeLink } from "../../content/components";
import { formatDateRange, hasText } from "../../content/rules";

export function DeveloperHero() {
  const { person, portrait, education, contact } = useModeView();
  const name = person?.name ?? "";
  const pixel = portrait.pixel;

  return (
    <section className="dev-hero" aria-labelledby="dev-hero-name">
      <figure className="dev-hero__portrait">
        <figcaption className="dev-hero__bar">
          <span className="dev-hero__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="dev-hero__file">{pixel ? "portrait.png" : "portrait.png — pending"}</span>
        </figcaption>
        {pixel ? (
          <img
            className="dev-hero__image"
            src={`/${pixel.src}`}
            alt={pixel.alt}
            width={pixel.width}
            height={pixel.height}
          />
        ) : (
          <div className="dev-hero__placeholder" role="img" aria-label="Portrait placeholder. The photo has not been added yet.">
            <span className="dev-hero__placeholder-label">Portrait pending</span>
            <span className="dev-hero__placeholder-note">A pixel portrait made from a real photo will appear here.</span>
          </div>
        )}
      </figure>

      <div className="dev-hero__text">
        <p className="dev-hero__prompt" aria-hidden="true">
          <span className="dev-hero__caret">&gt;</span> whoami
        </p>
        <h1 id="dev-hero-name" className="dev-hero__name" tabIndex={-1}>
          {name}
        </h1>
        {hasText(person?.headline) && <p className="dev-hero__headline">{person.headline}</p>}

        {(education.length > 0 || contact?.github) && (
          <dl className="dev-hero__facts">
            {education.map((e) => (
              <div key={e.id} className="dev-hero__fact">
                <dt>{e.qualification}</dt>
                <dd>
                  {[e.field, e.institution, formatDateRange(e.dates)].filter(Boolean).join(" · ")}
                </dd>
              </div>
            ))}
            {contact?.github && (
              <div className="dev-hero__fact">
                <dt>GitHub</dt>
                <dd>
                  <SafeLink href={contact.github.url}>{contact.github.label}</SafeLink>
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </section>
  );
}
