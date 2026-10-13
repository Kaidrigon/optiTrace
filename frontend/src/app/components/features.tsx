
const features = [
  {
    number: "01",
    title: "See the pipeline.",
    description:
      "Follow intermediate representations and inspect the program at each optimization stage.",
    mark: "↗",
    color: "lime",
  },
  {
    number: "02",
    title: "Compare the changes.",
    description:
      "Understand what changed between two stages without losing sight of the original program.",
    mark: "⇄",
    color: "violet",
  },
  {
    number: "03",
    title: "Keep proof honest.",
    description:
      "Distinguish a transformation from a verified result. Correctness claims belong to the verifier.",
    mark: "∴",
    color: "neutral",
  },
];

export function Features() {
  return (
    <section className="features section-wrap" id="principles">
      <div className="section-heading">
        <div>
          <div className="eyebrow">01 — THE APPROACH</div>
          <h2>
            Optimization,
            <br />
            <span className="serif-word">without the mystery.</span>
          </h2>
        </div>
        <p>
          A compiler can change a program in many small steps.
          Make those steps visible, inspectable, and easier to reason about.
        </p>
      </div>

      <div className="feature-grid">
        {features.map((feature) => (
          <article
            className={`feature-card feature-${feature.color}`}
            key={feature.number}
          >
            <div className="feature-top">
              <span>{feature.number} / PRINCIPLE</span>
              <span className="feature-mark" aria-hidden="true">{feature.mark}</span>
            </div>

            <div className="feature-art" aria-hidden="true">
              {feature.number === "01" && (
                <div className="layer-stack">
                  <i /><i /><i />
                </div>
              )}
              {feature.number === "02" && (
                <div className="diff-art">
                  <span><i /><i /><i /></span>
                  <b />
                  <span><i /><i /></span>
                </div>
              )}
              {feature.number === "03" && (
                <div className="proof-art"><span>?</span></div>
              )}
            </div>

            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
