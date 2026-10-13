import { describe, expect, it } from "vitest";

import { tokenize } from "../src/lexer.js";
import { parse } from "../src/parser.js";
import { interpret, RuntimeError } from "../src/interpreter.js";
import {
  optimize,
  optimizeWithReport,
} from "../src/optimizer.js";

function compile(source: string) {
  return parse(tokenize(source));
}

function run(source: string): string[] {
  return interpret(compile(source));
}

function optimizeAndRun(source: string): string[] {
  const program = compile(source);
  const optimizedProgram = optimize(program);

  return interpret(optimizedProgram);
}

describe("OTL optimizer", () => {
  it("folds constant arithmetic", () => {
    const program = compile(`
      let result = 10 + 20 * 2;
      print(result);
    `);

    const optimized = optimize(program);

    expect(interpret(optimized)).toEqual(["50"]);

    const declaration = optimized.statements[0];

    expect(declaration?.type).toBe("VariableDeclaration");

    if (declaration?.type === "VariableDeclaration") {
      expect(declaration.initializer).toMatchObject({
        type: "NumberLiteral",
        value: 50,
      });
    }
  });

  it("propagates constant variables", () => {
    const program = compile(`
      let x = 10;
      print(x);
    `);

    const optimized = optimize(program);
    const printStatement = optimized.statements[1];

    expect(printStatement?.type).toBe("PrintStatement");

    if (printStatement?.type === "PrintStatement") {
      expect(printStatement.expression).toMatchObject({
        type: "NumberLiteral",
        value: 10,
      });
    }

    expect(interpret(optimized)).toEqual(["10"]);
  });

  it("removes an unreachable else branch", () => {
    const program = compile(`
      if (true) {
        print(100);
      } else {
        print(999);
      }
    `);

    const optimized = optimize(program);

    expect(interpret(optimized)).toEqual(["100"]);
    expect(optimized.statements).toHaveLength(1);
  });

  it("preserves output after optimization", () => {
    const source = `
      let price = 10;
      let quantity = 5;
      let total = price * quantity + 10;

      print(total);

      if (total > 50) {
        print(true);
      } else {
        print(false);
      }
    `;

    expect(optimizeAndRun(source)).toEqual(run(source));
    expect(optimizeAndRun(source)).toEqual(["60", "true"]);
  });

  it("does not fold division by zero into a value", () => {
    const source = `
      let result = 10 / 0;
      print(result);
    `;

    const optimized = optimize(compile(source));

    expect(() => interpret(optimized)).toThrow(RuntimeError);
  });

  it("handles programs without optimizable expressions", () => {
    const source = `
      let x = 10;
      x = x + 5;
      print(x);
    `;

    expect(optimizeAndRun(source)).toEqual(run(source));
    expect(optimizeAndRun(source)).toEqual(["15"]);
  });

it("preserves outer variables when an inner block shadows them", () => {
  const source = `
    let x = 10;

    {
      let x = 20;
      print(x);
    }

    print(x);
  `;

  expect(run(source)).toEqual(["20", "10"]);
  expect(optimizeAndRun(source)).toEqual(["20", "10"]);
});

it("preserves assignments made inside if/else branches", () => {
  const source = `
    let x = 10;

    if (true) {
      x = 20;
    } else {
      x = 30;
    }

    print(x);
  `;

  expect(run(source)).toEqual(["20"]);
  expect(optimizeAndRun(source)).toEqual(["20"]);
});

it("preserves assignments when an if condition is not constant", () => {
  const source = `
    let x = 10;
    let condition = false;

    if (condition) {
      x = 20;
    } else {
      x = 30;
    }

    print(x);
  `;

  expect(run(source)).toEqual(["30"]);
  expect(optimizeAndRun(source)).toEqual(["30"]);
});

it("does not propagate stale constants after a one-sided assignment", () => {
  const source = `
    let x = 10;
    let condition = true;

    if (condition) {
      x = 20;
    }

    print(x);
  `;

  expect(run(source)).toEqual(["20"]);
  expect(optimizeAndRun(source)).toEqual(["20"]);
});

it("preserves one-sided assignments with a runtime-dependent condition", () => {
  const source = `
    let x = 10;
    let condition = false;

    if (condition) {
      x = 20;
    }

    print(x);
  `;

  expect(run(source)).toEqual(["10"]);
  expect(optimizeAndRun(source)).toEqual(["10"]);
});

it("preserves unrelated constants after a block assignment", () => {
  const source = `
    let x = 10;
    let y = 50;

    {
      x = 20;
    }

    print(x);
    print(y);
  `;

  expect(run(source)).toEqual(["20", "50"]);
  expect(optimizeAndRun(source)).toEqual(["20", "50"]);
});

it("preserves unrelated constants after a conditional assignment", () => {
  const source = `
    let x = 10;
    let y = 50;
    let condition = false;

    if (condition) {
      x = 20;
    } else {
      x = 30;
    }

    print(x);
    print(y);
  `;

  expect(run(source)).toEqual(["30", "50"]);
  expect(optimizeAndRun(source)).toEqual(["30", "50"]);
});

it("preserves assignments across nested blocks", () => {
  const source = `
    let x = 1;
    let y = 100;

    {
      {
        x = 5;
      }
    }

    print(x);
    print(y);
  `;

  expect(run(source)).toEqual(["5", "100"]);
  expect(optimizeAndRun(source)).toEqual(["5", "100"]);
});

it("preserves assignments inside nested conditional branches", () => {
  const source = `
    let x = 1;
    let condition = true;

    if (condition) {
      if (false) {
        x = 10;
      } else {
        x = 5;
      }
    }

    print(x);
  `;

  expect(run(source)).toEqual(["5"]);
  expect(optimizeAndRun(source)).toEqual(["5"]);
});

  it("disables constant folding independently", () => {
    const program = compile(`
      print(10 + 20);
    `);

    const result = optimizeWithReport(program, {
      constantFolding: false,
      constantPropagation: false,
      deadCodeElimination: false,
    });

    const statement = result.program.statements[0];

    expect(statement?.type).toBe("PrintStatement");

    if (statement?.type === "PrintStatement") {
      expect(statement.expression.type).toBe("BinaryExpression");
    }

    expect(
      result.steps.some((step) => step.kind === "constant-folding"),
    ).toBe(false);

    expect(interpret(result.program)).toEqual(["30"]);
  });

  it("disables constant propagation independently", () => {
    const program = compile(`
      let x = 10;
      print(x);
    `);

    const result = optimizeWithReport(program, {
      constantPropagation: false,
    });

    const statement = result.program.statements[1];

    expect(statement?.type).toBe("PrintStatement");

    if (statement?.type === "PrintStatement") {
      expect(statement.expression.type).toBe("IdentifierExpression");
    }

    expect(
      result.steps.some((step) => step.kind === "constant-propagation"),
    ).toBe(false);

    expect(interpret(result.program)).toEqual(["10"]);
  });

  it("disables dead-code elimination independently", () => {
    const program = compile(`
      if (true) {
        print(100);
      } else {
        print(999);
      }
    `);

    const result = optimizeWithReport(program, {
      deadCodeElimination: false,
    });

    const statement = result.program.statements[0];

    expect(statement?.type).toBe("IfStatement");

    expect(
      result.steps.some((step) => step.kind === "dead-code-elimination"),
    ).toBe(false);

    expect(interpret(result.program)).toEqual(["100"]);
  });

  it("enables all optimizations when options are omitted", () => {
    const program = compile(`
      let x = 10;
      print(x + 20);

      if (true) {
        print(100);
      } else {
        print(999);
      }
    `);

    const result = optimizeWithReport(program);

    expect(result.steps.some((step) => step.kind === "constant-propagation")).toBe(true);
    expect(result.steps.some((step) => step.kind === "constant-folding")).toBe(true);
    expect(result.steps.some((step) => step.kind === "dead-code-elimination")).toBe(true);

    expect(interpret(result.program)).toEqual(["30", "100"]);
  });

  it("preserves assignments made inside a block", () => {
    const source = `
      let x = 1;

      {
        x = 2;
      }

      print(x);
    `;

    expect(run(source)).toEqual(["2"]);
    expect(optimizeAndRun(source)).toEqual(["2"]);
  });
});
