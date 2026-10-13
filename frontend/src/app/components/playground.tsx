
"use client";

import { useState } from "react";

const stages = [
  {
    name: "Source",
    label: "INPUT",
    description: "The program as written.",
    lines: ["let base = 6;", "let scale = 7;", "let total = base * scale;", "print(total);"],
  },
  {
    name: "Constant folding",
    label: "ILLUSTRATION",
    description: "Known constant expressions can be evaluated ahead of execution.",
    lines: ["let base = 6;", "let scale = 7;", "let total = 42;", "print(total);"],
  },
  {
    name: "Constant propagation",
    label: "ILLUSTRATION",
    description: "Known values can be substituted where their variables are used.",
    lines: ["let total = 42;", "print(42);"],
  },
  {
    name: "Dead-code elimination",
    label: "ILLUSTRATION",
    description: "Unused assignments may be removed when the language semantics permit it.",
    lines: ["print(42);"],
  },
];

export function Playground() {
  const [active, setActive] = useState(0);
  const stage = stages[active];

  return (
    <section className="playground section-wrap" id="playground">
      <div className="section-heading playground-heading">
        <div>
          <div className="eyebrow">02 — THE PLAYGROUND</div>
          <h2>
            Follow the
            <br />
            <span className="serif-word">transformation.</span>
          </h2>
        </div>
        <p>
          Choose a stage to explore a simplified example of how
          optimization can change a program.
        </p>
      </div>

      <div className="workbench">
        <div className="workbench-top">
          <div className="workbench-title">
            <span className="workbench-icon">◩</span>
            <span>TRACE STATION</span>
            <span className="muted">/</span>
            <span className="muted normal-case">example.opt</span>
          </div>
          <span className="demo-badge">ILLUSTRATIVE DEMO</span>
        </div>

        <div className="workbench-layout">
          <aside className="stage-list" aria-label="Optimization stages">
            <p className="stage-list-heading">TRANSFORMATION PASSES</p>
            {stages.map((item, index) => (
              <button
                key={item.name}
                type="button"
                className={`stage-button ${active === index ? "active" : ""}`}
                onClick={() => setActive(index)}
                aria-pressed={active === index}
              >
                <span className="stage-number">
                  {String(index).padStart(2, "0")}
                </span>
                <span>{item.name}</span>
                <span className="stage-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
            <p className="stage-list-note">
              Select a stage to change the example.
            </p>
          </aside>

          <div className="code-panel">
            <div className="code-panel-heading">
              <div>
                <span className="eyebrow">{stage.label} / {String(active).padStart(2, "0")}</span>
                <h3>{stage.name}</h3>
              </div>
              <span className="language-tag">MINI-LANG</span>
            </div>

            <div className="editor">
              <div className="editor-bar">
                <span><i /> {active === 0 ? "source" : "intermediate"}.opt</span>
                <span>EXAMPLE</span>
              </div>
              <div className="editor-code" aria-live="polite" aria-atomic="true">
                {stage.lines.map((line, index) => (
                  <div className="editor-line" key={`${active}-${line}`}>
                    <span className="editor-line-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <code>{line}</code>
                  </div>
                ))}
              </div>
            </div>

            <div className="stage-description">
              <span aria-hidden="true">↳</span>
              <div>
                <span className="description-label">WHAT TO NOTICE</span>
                <p>{stage.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="demo-disclaimer">
        <strong>Important:</strong> These stages are illustrative UI content,
        not output from the actual compiler. No equivalence check, correctness
        proof, or benchmark has been performed.
      </p>
    </section>
  );
}
