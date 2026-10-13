
export function Hero() {
  return (
    <section className="hero section-wrap" id="approach">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="status-dot" />
          VISUAL COMPILER EXPLORATION
        </div>

        <h1>
          See what
          <br />
          your code
          <br />
          <span className="accent-word">becomes.</span>
        </h1>

        <p className="hero-description">
          Follow the journey from source code to optimized output.
          Explore each transformation, understand the difference, and
          inspect what your compiler actually changes.
        </p>

        <div className="hero-actions">
          <a className="button button-primary" href="#playground">
            Explore the demo <span aria-hidden="true">↘</span>
          </a>
          <span className="hero-caption">LESS GUESSING. MORE UNDERSTANDING.</span>
        </div>

        <div className="hero-bottom-note">
          <span>01 / OBSERVE</span>
          <span>02 / COMPARE</span>
          <span>03 / UNDERSTAND</span>
        </div>
      </div>

      <div className="hero-visual" aria-label="Illustration of code being optimized">
        <div className="visual-label">
          <span>TRANSFORMATION / 001</span>
          <span className="visual-status"><i /> CONCEPT</span>
        </div>

        <div className="visual-grid" aria-hidden="true" />
        <div className="visual-ring ring-one" aria-hidden="true" />
        <div className="visual-ring ring-two" aria-hidden="true" />

        <div className="floating-code source-card">
          <div className="code-card-heading">
            <span>INPUT</span><span>source.opt</span>
          </div>
          <pre><code><span className="syntax-keyword">let</span> x = <span className="syntax-number">6</span>;
{"\n"}<span className="syntax-keyword">let</span> y = <span className="syntax-number">7</span>;
{"\n"}<span className="syntax-keyword">let</span> z = x * y;</code></pre>
        </div>

        <div className="transform-arrow" aria-hidden="true">↘</div>

        <div className="floating-code output-card">
          <div className="code-card-heading">
            <span>OUTPUT</span><span>after.opt</span>
          </div>
          <pre><code><span className="syntax-keyword">let</span> z = <span className="syntax-number">42</span>;</code></pre>
          <span className="result-label">CONSTANT FOLDING*</span>
        </div>

        <span className="visual-coordinate coordinate-top">x · y · z</span>
        <span className="visual-coordinate coordinate-bottom">TRACE / 0001</span>
      </div>
    </section>
  );
}
