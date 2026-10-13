"use client";

import { useState } from "react";

type CompileOptions = {
  constantPropagation: boolean;
  constantFolding: boolean;
  deadCodeElimination: boolean;
};

type ExecutionResult = {
  success: boolean;
  output?: string[];
  error?: string;
};

type OptimizationStage = {
  name: string;
  changedCount: number;
  before: string;
  after: string;
};

type CompileResponse = {
  success: boolean;
  error?: string | null;
  originalIRText?: string;
  optimizedIRText?: string;
  originalExecution?: ExecutionResult;
  optimizedExecution?: ExecutionResult;
  stages?: OptimizationStage[];
  totalChangedCount?: number;
};

const initialSource = [
  "let base = 6;",
  "let scale = 7;",
  "let total = base * scale;",
  "print total;",
].join("\n");

const initialOptions: CompileOptions = {
  constantPropagation: true,
  constantFolding: true,
  deadCodeElimination: true,
};

const optionLabels: {
  key: keyof CompileOptions;
  label: string;
  description: string;
}[] = [
  {
    key: "constantPropagation",
    label: "Constant propagation",
    description: "Substitute known constant values.",
  },
  {
    key: "constantFolding",
    label: "Constant folding",
    description: "Evaluate constant expressions.",
  },
  {
    key: "deadCodeElimination",
    label: "Dead-code elimination",
    description: "Remove unnecessary instructions.",
  },
];

function IRPanel({
  title,
  filename,
  content,
}: {
  title: string;
  filename: string;
  content?: string;
}) {
  const lines = content ? content.split("\n") : [];

  return (
    <div className="ir-card">
      <div className="ir-card-heading">
        <div>
          <span className="description-label">{title}</span>
          <div className="ir-filename">{filename}</div>
        </div>
        <span className="language-tag">IR</span>
      </div>

      <div className="ir-content" aria-live="polite">
        {lines.length > 0 ? (
          lines.map((line, index) => (
            <div className="editor-line" key={`${index}-${line}`}>
              <span className="editor-line-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <code>{line || " "}</code>
            </div>
          ))
        ) : (
          <p className="empty-state">
            Compile your program to see the instructions.
          </p>
        )}
      </div>
    </div>
  );
}

function ExecutionPanel({
  title,
  execution,
}: {
  title: string;
  execution?: ExecutionResult;
}) {
  return (
    <div className="ir-card">
      <div className="ir-card-heading">
        <span className="description-label">{title}</span>
        {execution && (
          <span className="language-tag">
            {execution.success ? "SUCCESS" : "ERROR"}
          </span>
        )}
      </div>

      <div className="run-output" aria-live="polite">
        {!execution ? (
          <p className="empty-state">Execution results will appear here.</p>
        ) : execution.success ? (
          execution.output && execution.output.length > 0 ? (
            execution.output.map((line, index) => (
              <div className="output-line" key={`${index}-${line}`}>
                <span aria-hidden="true">&gt;</span>
                <code>{line}</code>
              </div>
            ))
          ) : (
            <p className="empty-state">Program completed without output.</p>
          )
        ) : (
          <p className="error-box">
            {execution.error || "Execution failed."}
          </p>
        )}
      </div>
    </div>
  );
}

export function Playground() {
  const [source, setSource] = useState(initialSource);
  const [options, setOptions] = useState<CompileOptions>(initialOptions);
  const [result, setResult] = useState<CompileResponse | null>(null);
  const [activeStage, setActiveStage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");

  const stages = result?.stages ?? [];
  const selectedStage = stages[activeStage];

  async function handleCompile() {
    setLoading(true);
    setRequestError("");
    setResult(null);
    setActiveStage(0);

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source,
          options,
        }),
      });

      const data = (await response.json()) as CompileResponse;

      if (!response.ok && !data.error) {
        throw new Error(`Compilation request failed (${response.status}).`);
      }

      setResult(data);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to reach the compiler API.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleOption(key: keyof CompileOptions, checked: boolean) {
    setOptions((current) => ({
      ...current,
      [key]: checked,
    }));
  }

  return (
    <section className="playground section-wrap" id="playground">
      <div className="section-heading playground-heading">
        <div>
          <div className="eyebrow">02 - THE PLAYGROUND</div>
          <h2>
            Follow the
            <br />
            <span className="serif-word">transformation.</span>
          </h2>
        </div>
        <p>
          Write OTL code, run the real compiler, and inspect the
          intermediate representation at each optimization stage.
        </p>
      </div>

      <div className="workbench">
        <div className="workbench-top">
          <div className="workbench-title">
            <span className="workbench-icon">{"</>"}</span>
            <span>TRACE STATION</span>
            <span className="muted">/</span>
            <span className="muted normal-case">program.otl</span>
          </div>
          <span className="demo-badge">
            {loading ? "COMPILING..." : "LIVE COMPILER"}
          </span>
        </div>

        <div className="live-workbench">
          <div className="source-section">
            <div className="live-section-heading">
              <div>
                <span className="eyebrow">01 / SOURCE CODE</span>
                <h3>Your program</h3>
              </div>
              <span className="language-tag">OTL</span>
            </div>

            <textarea
              className="source-input"
              aria-label="OTL source code"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Write your OTL program here..."
            />

            <div className="pass-controls">
              <div className="live-section-heading">
                <div>
                  <span className="eyebrow">02 / CONFIGURATION</span>
                  <h3>Optimization passes</h3>
                </div>
              </div>

              <div className="pass-toggles">
                {optionLabels.map((option) => (
                  <label className="pass-toggle" key={option.key}>
                    <input
                      type="checkbox"
                      checked={options[option.key]}
                      onChange={(event) =>
                        toggleOption(option.key, event.target.checked)
                      }
                    />
                    <span className="pass-toggle-copy">
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="compile-button"
                onClick={handleCompile}
                disabled={loading || !source.trim()}
              >
                {loading ? "Compiling..." : "Compile & Optimize"}
                <span aria-hidden="true">{"->"}</span>
              </button>

              <p className="compile-hint">
                Runs your source through the compiler API on this project.
              </p>
            </div>
          </div>

          <div className="results-section">
            <div className="live-section-heading">
              <div>
                <span className="eyebrow">03 / COMPILER OUTPUT</span>
                <h3>Intermediate representation</h3>
              </div>
              {result && (
                <span className="language-tag">
                  {result.success ? "COMPILED" : "FAILED"}
                </span>
              )}
            </div>

            {requestError && (
              <p className="error-box" role="alert">
                {requestError}
              </p>
            )}

            {result?.error && (
              <p className="error-box" role="alert">
                {result.error}
              </p>
            )}

            <div className="results-grid">
              <IRPanel
                title="ORIGINAL IR"
                filename="original.ir"
                content={result?.originalIRText}
              />
              <IRPanel
                title="OPTIMIZED IR"
                filename="optimized.ir"
                content={result?.optimizedIRText}
              />
            </div>

            <div className="execution-grid">
              <ExecutionPanel
                title="ORIGINAL EXECUTION"
                execution={result?.originalExecution}
              />
              <ExecutionPanel
                title="OPTIMIZED EXECUTION"
                execution={result?.optimizedExecution}
              />
            </div>

            {result && (
              <div className="stage-stats">
                <div>
                  <span className="description-label">PASS CHANGES</span>
                  <strong>{result.totalChangedCount ?? 0}</strong>
                </div>
                <div>
                  <span className="description-label">STAGES RUN</span>
                  <strong>{stages.length}</strong>
                </div>
                <div>
                  <span className="description-label">OUTPUTS MATCH</span>
                  <strong>
                    {result.originalExecution?.success &&
                    result.optimizedExecution?.success &&
                    JSON.stringify(result.originalExecution.output ?? []) ===
                      JSON.stringify(result.optimizedExecution.output ?? [])
                      ? "YES"
                      : "NOT VERIFIED"}
                  </strong>
                </div>
              </div>
            )}

            <div className="stage-inspector">
              <div className="live-section-heading">
                <div>
                  <span className="eyebrow">04 / OPTIMIZATION TRACE</span>
                  <h3>Inspect each pass</h3>
                </div>
              </div>

              {stages.length > 0 ? (
                <>
                  <div className="stage-list live-stage-list" aria-label="Optimization stages">
                    {stages.map((stage, index) => (
                      <button
                        key={stage.name}
                        type="button"
                        className={`stage-button ${
                          activeStage === index ? "active" : ""
                        }`}
                        onClick={() => setActiveStage(index)}
                        aria-pressed={activeStage === index}
                      >
                        <span className="stage-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{stage.name}</span>
                        <span className="stage-arrow">
                          {stage.changedCount}
                        </span>
                      </button>
                    ))}
                  </div>

                  {selectedStage && (
                    <div className="selected-stage">
                      <p className="stage-change-summary">
                        {selectedStage.name}: {selectedStage.changedCount}{" "}
                        reported change
                        {selectedStage.changedCount === 1 ? "" : "s"}.
                      </p>
                      <div className="results-grid">
                        <IRPanel
                          title="BEFORE THIS PASS"
                          filename="before.ir"
                          content={selectedStage.before}
                        />
                        <IRPanel
                          title="AFTER THIS PASS"
                          filename="after.ir"
                          content={selectedStage.after}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="empty-state">
                  Run Compile & Optimize to inspect the actual stages.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="demo-disclaimer">
        <strong>Note:</strong> Results come from the compiler implementation.
        Matching execution outputs for a test program is a useful check, not
        a formal proof of optimization correctness.
      </p>
    </section>
  );
}
