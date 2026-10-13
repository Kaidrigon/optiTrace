import type {
  Program,
  Statement,
  BlockStatement,
  Expression,
} from "./ast";

type ConstantValue = number | boolean;
type Constants = Map<string, ConstantValue>;

export interface OptimizationOptions {
  constantFolding?: boolean;
  constantPropagation?: boolean;
  deadCodeElimination?: boolean;
}

type ResolvedOptimizationOptions = Required<OptimizationOptions>;

const DEFAULT_OPTIMIZATION_OPTIONS: ResolvedOptimizationOptions = {
  constantFolding: true,
  constantPropagation: true,
  deadCodeElimination: true,
};

export interface OptimizationStep {
  kind:
    | "constant-folding"
    | "constant-propagation"
    | "dead-code-elimination";
  message: string;
  before: string;
  after: string;
  line: number;
  column: number;
}

export interface OptimizationResult {
  program: Program;
  steps: OptimizationStep[];
}

/**
 * Optimize a program and return its AST.
 * All optimizations are enabled by default.
 */
export function optimize(
  program: Program,
  options: OptimizationOptions = {},
): Program {
  return optimizeWithReport(program, options).program;
}

/**
 * Optimize a program and return a report of the changes.
 */
export function optimizeWithReport(
  program: Program,
  options: OptimizationOptions = {},
): OptimizationResult {
  const steps: OptimizationStep[] = [];

  const resolvedOptions: ResolvedOptimizationOptions = {
    ...DEFAULT_OPTIMIZATION_OPTIONS,
    ...options,
  };

  const optimizedProgram: Program = {
    ...program,
    statements: optimizeStatements(
      program.statements,
      new Map(),
      steps,
      resolvedOptions,
    ),
  };

  return {
    program: optimizedProgram,
    steps,
  };
}

/**
 * Find assignments that can modify variables outside their
 * declaring scope.
 *
 * Declarations inside a block shadow variables with the same
 * name from outer scopes.
 */
function collectModifiedNames(
  statement: Statement,
  shadowed: Set<string> = new Set(),
): Set<string> {
  const modified = new Set<string>();

  function visit(
    current: Statement,
    hidden: Set<string>,
  ): void {
    switch (current.type) {
      case "AssignmentStatement": {
        if (!hidden.has(current.name)) {
          modified.add(current.name);
        }
        break;
      }

      case "BlockStatement": {
        const localHidden = new Set(hidden);

        for (const child of current.statements) {
          if (child.type === "VariableDeclaration") {
            localHidden.add(child.name);
          }
        }

        for (const child of current.statements) {
          visit(child, localHidden);
        }
        break;
      }

      case "IfStatement": {
        visit(current.thenBranch, hidden);

        if (current.elseBranch) {
          visit(current.elseBranch, hidden);
        }
        break;
      }

      case "VariableDeclaration":
      case "PrintStatement":
        break;
    }
  }

  visit(statement, shadowed);

  return modified;
}

/**
 * Remove cached values only for variables that may have changed.
 */
function invalidateModifiedConstants(
  statement: Statement,
  constants: Constants,
): void {
  for (const name of collectModifiedNames(statement)) {
    constants.delete(name);
  }
}

function optimizeStatements(
  statements: Statement[],
  constants: Constants,
  steps: OptimizationStep[],
  options: ResolvedOptimizationOptions,
): Statement[] {
  const optimized: Statement[] = [];

  for (const statement of statements) {
    optimized.push(
      ...optimizeStatement(statement, constants, steps, options),
    );
  }

  return optimized;
}

function optimizeStatement(
  statement: Statement,
  constants: Constants,
  steps: OptimizationStep[],
  options: ResolvedOptimizationOptions,
): Statement[] {
  switch (statement.type) {
    case "VariableDeclaration": {
      const initializer = optimizeExpression(
        statement.initializer,
        constants,
        steps,
        options,
      );

      if (isConstant(initializer)) {
        constants.set(statement.name, initializer.value);
      } else {
        constants.delete(statement.name);
      }

      return [{ ...statement, initializer }];
    }

    case "AssignmentStatement": {
      const value = optimizeExpression(
        statement.value,
        constants,
        steps,
        options,
      );

      if (isConstant(value)) {
        constants.set(statement.name, value.value);
      } else {
        constants.delete(statement.name);
      }

      return [{ ...statement, value }];
    }

    case "PrintStatement":
      return [
        {
          ...statement,
          expression: optimizeExpression(
            statement.expression,
            constants,
            steps,
            options,
          ),
        },
      ];

    case "BlockStatement": {
      const optimizedBlock = optimizeBlock(
        statement,
        constants,
        steps,
        options,
      );

      invalidateModifiedConstants(statement, constants);

      return [optimizedBlock];
    }

    case "IfStatement": {
      const condition = optimizeExpression(
        statement.condition,
        constants,
        steps,
        options,
      );

      // Only remove a branch when dead-code elimination is enabled.
      if (
        options.deadCodeElimination &&
        condition.type === "BooleanLiteral"
      ) {
        const selectedBranch = condition.value
          ? statement.thenBranch
          : statement.elseBranch;

        let result: Statement[];

        if (!selectedBranch) {
          result = [];
        } else if (selectedBranch.type === "BlockStatement") {
          result = [
            optimizeBlock(
              selectedBranch,
              constants,
              steps,
              options,
            ),
          ];

          invalidateModifiedConstants(
            selectedBranch,
            constants,
          );
        } else {
          result = optimizeStatement(
            selectedBranch,
            constants,
            steps,
            options,
          );
        }

        steps.push({
          kind: "dead-code-elimination",
          message: condition.value
            ? "The condition is always true, so the else branch is unreachable."
            : "The condition is always false, so the then branch is unreachable.",
          before: describeStatement(statement),
          after:
            result.map(describeStatement).join("\n") ||
            "(no statements)",
          line: statement.line,
          column: statement.column,
        });

        return result;
      }

      // Keep each branch's analysis independent.
      const thenBranch = optimizeBlock(
        statement.thenBranch,
        new Map(constants),
        steps,
        options,
      );

      let elseBranch:
        | BlockStatement
        | typeof statement.elseBranch;

      if (statement.elseBranch?.type === "BlockStatement") {
        elseBranch = optimizeBlock(
          statement.elseBranch,
          new Map(constants),
          steps,
          options,
        );
      } else if (statement.elseBranch) {
        const optimizedElse = optimizeStatement(
          statement.elseBranch,
          new Map(constants),
          steps,
          options,
        );

        elseBranch = optimizedElse[0] as typeof statement.elseBranch;
      }

      // Either branch may execute. Invalidate outer constants that
      // either branch might modify, even if DCE is disabled.
      invalidateModifiedConstants(
        statement.thenBranch,
        constants,
      );

      if (statement.elseBranch) {
        invalidateModifiedConstants(
          statement.elseBranch,
          constants,
        );
      }

      return [
        {
          ...statement,
          condition,
          thenBranch,
          ...(elseBranch ? { elseBranch } : {}),
        },
      ];
    }
  }
}

function optimizeBlock(
  block: BlockStatement,
  outerConstants: Constants,
  steps: OptimizationStep[],
  options: ResolvedOptimizationOptions,
): BlockStatement {
  // Block changes stay in this local map. The caller separately
  // invalidates outer constants for variables assigned in the block.
  const localConstants = new Map(outerConstants);

  return {
    ...block,
    statements: optimizeStatements(
      block.statements,
      localConstants,
      steps,
      options,
    ),
  };
}

function optimizeExpression(
  expression: Expression,
  constants: Constants,
  steps: OptimizationStep[],
  options: ResolvedOptimizationOptions,
): Expression {
  switch (expression.type) {
    case "NumberLiteral":
    case "BooleanLiteral":
      return expression;

    case "IdentifierExpression": {
      if (
        !options.constantPropagation ||
        !constants.has(expression.name)
      ) {
        return expression;
      }

      const value = constants.get(expression.name)!;

      const replacement: Expression =
        typeof value === "number"
          ? {
              type: "NumberLiteral",
              value,
              line: expression.line,
              column: expression.column,
            }
          : {
              type: "BooleanLiteral",
              value,
              line: expression.line,
              column: expression.column,
            };

      steps.push({
        kind: "constant-propagation",
        message: `Replaced '${expression.name}' with its known constant value.`,
        before: expression.name,
        after: String(value),
        line: expression.line,
        column: expression.column,
      });

      return replacement;
    }

    case "UnaryExpression": {
      const operand = optimizeExpression(
        expression.operand,
        constants,
        steps,
        options,
      );

      let folded: ConstantValue | undefined;

      if (options.constantFolding) {
        if (
          expression.operator === "-" &&
          operand.type === "NumberLiteral"
        ) {
          folded = -operand.value;
        } else if (
          expression.operator === "!" &&
          operand.type === "BooleanLiteral"
        ) {
          folded = !operand.value;
        }
      }

      if (folded === undefined) {
        return { ...expression, operand };
      }

      steps.push({
        kind: "constant-folding",
        message: "Evaluated a unary expression at compile time.",
        before: describeExpression(expression),
        after: String(folded),
        line: expression.line,
        column: expression.column,
      });

      return makeLiteral(
        folded,
        expression.line,
        expression.column,
      );
    }

    case "BinaryExpression": {
      const left = optimizeExpression(
        expression.left,
        constants,
        steps,
        options,
      );

      const right = optimizeExpression(
        expression.right,
        constants,
        steps,
        options,
      );

      const folded = options.constantFolding
        ? foldBinaryExpression(expression.operator, left, right)
        : undefined;

      if (folded === undefined) {
        return { ...expression, left, right };
      }

      steps.push({
        kind: "constant-folding",
        message: "Evaluated a constant expression at compile time.",
        before: describeExpression(expression),
        after: String(folded),
        line: expression.line,
        column: expression.column,
      });

      return makeLiteral(
        folded,
        expression.line,
        expression.column,
      );
    }
  }
}

function makeLiteral(
  value: ConstantValue,
  line: number,
  column: number,
): Expression {
  if (typeof value === "number") {
    return {
      type: "NumberLiteral",
      value,
      line,
      column,
    };
  }

  return {
    type: "BooleanLiteral",
    value,
    line,
    column,
  };
}

function foldBinaryExpression(
  operator: string,
  left: Expression,
  right: Expression,
): ConstantValue | undefined {
  if (
    left.type === "NumberLiteral" &&
    right.type === "NumberLiteral"
  ) {
    const a = left.value;
    const b = right.value;

    switch (operator) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? undefined : a / b;
      case "%":
        return b === 0 ? undefined : a % b;
      case "==":
        return a === b;
      case "!=":
        return a !== b;
      case "<":
        return a < b;
      case ">":
        return a > b;
      case "<=":
        return a <= b;
      case ">=":
        return a >= b;
    }
  }

  if (
    left.type === "BooleanLiteral" &&
    right.type === "BooleanLiteral"
  ) {
    switch (operator) {
      case "==":
        return left.value === right.value;
      case "!=":
        return left.value !== right.value;
    }
  }

  return undefined;
}

function isConstant(
  expression: Expression,
): expression is Extract<
  Expression,
  { type: "NumberLiteral" | "BooleanLiteral" }
> {
  return (
    expression.type === "NumberLiteral" ||
    expression.type === "BooleanLiteral"
  );
}

function describeExpression(expression: Expression): string {
  switch (expression.type) {
    case "NumberLiteral":
    case "BooleanLiteral":
      return String(expression.value);

    case "IdentifierExpression":
      return expression.name;

    case "UnaryExpression":
      return `${expression.operator}${describeExpression(expression.operand)}`;

    case "BinaryExpression":
      return `(${describeExpression(expression.left)} ${expression.operator} ${describeExpression(expression.right)})`;
  }
}

function describeStatement(statement: Statement): string {
  switch (statement.type) {
    case "VariableDeclaration":
      return `let ${statement.name} = ${describeExpression(statement.initializer)};`;

    case "AssignmentStatement":
      return `${statement.name} = ${describeExpression(statement.value)};`;

    case "PrintStatement":
      return `print(${describeExpression(statement.expression)});`;

    case "BlockStatement":
      return `{ ${statement.statements.map(describeStatement).join(" ")} }`;

    case "IfStatement":
      return `if (${describeExpression(statement.condition)}) ${describeStatement(statement.thenBranch)}${
        statement.elseBranch
          ? ` else ${describeStatement(statement.elseBranch)}`
          : ""
      }`;
  }
}
