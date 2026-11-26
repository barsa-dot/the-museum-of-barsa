const fragmentSets = {
  tasknest: ["tasks", "garden", "xp", "focus"],
  authordna: ["manuscript", "rhythm", "voice", "journey"],
  "desi-zayka": ["menu", "dish", "basket", "whatsapp"],
  arcade: ["space", "pong", "snake", "breakout"],
} as const;

type Fragment = (typeof fragmentSets)[keyof typeof fragmentSets][number];

function FragmentArt({ fragment }: { fragment: Fragment }) {
  switch (fragment) {
    case "tasks":
      return <><b>Today</b><span>✓ Review notes</span><span>✓ Submit lab</span><span>□ Plan next week</span></>;
    case "garden":
      return <><b>Progress garden</b><span className="sprouts"><i/><i/><i/></span></>;
    case "xp":
      return <><b>Progress XP</b><strong>+ 25 XP</strong><span className="meter"/></>;
    case "focus":
      return <><b>Focus timer</b><strong>25:00</strong><span>Study session</span></>;
    case "manuscript":
      return <><b>A note on rhythm</b><span>Some sentences arrive in a rush. <mark>Others take their time.</mark></span><span>Where does <mark>the pace change?</mark></span></>;
    case "rhythm":
      return <><b>Sentence variation</b><span className="bars"><i/><i/><i/><i/><i/><i/><i/></span></>;
    case "voice":
      return <><b>Voice Check</b><span><mark>Transitions</mark> · Compare</span><span>Punctuation · Review</span></>;
    case "journey":
      return <><b>Voice Journey</b><span className="journey-line"><i/><i/><i/><i/><i/></span><span>Writing samples over time</span></>;
    case "menu":
      return <><b>Browse the menu</b><span>Small plates</span><span>Mains & sides</span><span>Find your next meal</span></>;
    case "dish":
      return <><b>From the kitchen</b><span className="dish-illustration"/></>;
    case "basket":
      return <><b>Your order</b><span>Review selected dishes</span><span>Confirm on WhatsApp</span></>;
    case "whatsapp":
      return <><b>Order on WhatsApp</b><span>Send your selections</span></>;
    case "space":
      return <><b>Space Shooter</b><img src={import.meta.env.BASE_URL + "images/projects/space-shooter.png"} alt="" /></>;
    case "pong":
    case "snake":
    case "breakout":
      return <><b>{fragment[0]!.toUpperCase() + fragment.slice(1)}</b><span className="game-screen"><i/><i/><i/><i/></span></>;
  }
}

export function Cover({ id, title }: { id: string; title: string }) {
  return (
    <div className={"cover cover--" + id} aria-hidden="true">
      <span className="cover-title">{title}</span>
      <span className="fragment-grid">
        {fragmentSets[id as keyof typeof fragmentSets].map(fragment => (
          <span className="fragment-slot" key={fragment}>
            <span className={"fragment fragment--" + fragment} data-fragment={fragment}>
              <FragmentArt fragment={fragment} />
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}
