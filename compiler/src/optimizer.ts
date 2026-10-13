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

  // First run constant folding, constant propagation,
  // and the existing unreachable-branch elimination.
  const optimizedStatements = optimizeStatements(
    program.statements,
    new Map(),
    steps,
    resolvedOptions,
  );

  // Then remove declarations that are provably unused.
  const finalStatements = resolvedOptions.deadCodeElimination
    ? eliminateUnusedDeclarations(optimizedStatements, steps)
    : optimizedStatements;

  const optimizedProgram: Program = {
    ...program,
    statements: finalStatements,
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

      // Remove an unreachable branch when the condition is known.
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

      // Analyze branches independently because either may execute.
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

      // Either branch can modify an outer variable.
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

/**
 * Conservatively eliminate unused declarations.
 *
 * This pass only removes declarations whose initializer is a
 * literal and whose name has no reads or assignments anywhere
 * in the optimized program.
 *
 * Counting names globally is intentionally conservative with
 * respect to shadowing: some removable declarations may be kept,
 * but this avoids deleting declarations based on an ambiguous
 * name reference.
 */

/**
 * Scope-aware dead-code and dead-assignment elimination.
 *
 * Uses unique IDs for declarations, so identically named variables
 * in different blocks are treated as different bindings.
 *
 * The backward liveness pass removes:
 * - Unused declarations with literal initializers.
 * - Assignments overwritten before their values are read.
 *
 * Potentially error-producing initializers and assignment values
 * are retained. Unresolved assignments are also retained.
 */
function eliminateUnusedDeclarations(
  statements: Statement[],
  steps: OptimizationStep[],
): Statement[] {
  let nextBindingId = 1;

  const declarationBindings = new WeakMap<Statement, number>();
  const assignmentBindings = new WeakMap<Statement, number>();
  const expressionBindings = new WeakMap<object, number>();
  const protectedDeclarations = new WeakSet<Statement>();
  const bindingsAssigned = new Set<number>();

  const scopes: Map<string, number>[] = [new Map()];

  function resolveName(name: string): number | undefined {
    for (let i = scopes.length - 1; i >= 0; i--) {
      const binding = scopes[i]!.get(name);
      if (binding !== undefined) return binding;
    }
    return undefined;
  }

  function analyzeExpression(expression: Expression): void {
    switch (expression.type) {
      case "IdentifierExpression": {
        const binding = resolveName(expression.name);
        if (binding !== undefined) {
          expressionBindings.set(expression, binding);
        }
        break;
      }

      case "UnaryExpression":
        analyzeExpression(expression.operand);
        break;

      case "BinaryExpression":
        analyzeExpression(expression.left);
        analyzeExpression(expression.right);
        break;

      case "NumberLiteral":
      case "BooleanLiteral":
        break;
    }
  }

  function analyzeStatements(items: Statement[]): void {
    for (const statement of items) {
      switch (statement.type) {
        case "VariableDeclaration": {
          // Initializers are evaluated before the declaration enters scope.
          analyzeExpression(statement.initializer);

          const current = scopes[scopes.length - 1]!;

          // Preserve duplicate declarations because the interpreter
          // raises a runtime error for them.
          if (current.has(statement.name)) {
            protectedDeclarations.add(statement);
            break;
          }

          const binding = nextBindingId++;
          current.set(statement.name, binding);
          declarationBindings.set(statement, binding);
          break;
        }

        case "AssignmentStatement": {
          const binding = resolveName(statement.name);

          if (binding !== undefined) {
            assignmentBindings.set(statement, binding);
            bindingsAssigned.add(binding);
          }

          analyzeExpression(statement.value);
          break;
        }

        case "PrintStatement":
          analyzeExpression(statement.expression);
          break;

        case "BlockStatement":
          scopes.push(new Map());
          analyzeStatements(statement.statements);
          scopes.pop();
          break;

        case "IfStatement":
          analyzeExpression(statement.condition);

          // Each branch has its own lexical block scope.
          analyzeStatements([statement.thenBranch]);

          if (statement.elseBranch) {
            analyzeStatements([statement.elseBranch]);
          }
          break;
      }
    }
  }

  analyzeStatements(statements);

  function addExpressionReads(
    expression: Expression,
    live: Set<number>,
  ): void {
    switch (expression.type) {
      case "IdentifierExpression": {
        const binding = expressionBindings.get(expression);
        if (binding !== undefined) live.add(binding);
        break;
      }

      case "UnaryExpression":
        addExpressionReads(expression.operand, live);
        break;

      case "BinaryExpression":
        addExpressionReads(expression.left, live);
        addExpressionReads(expression.right, live);
        break;

      case "NumberLiteral":
      case "BooleanLiteral":
        break;
    }
  }

  /**
   * Only literal values are considered safe to discard.
   * More complex expressions may throw, for example on division by zero.
   */
  function canDiscardEvaluation(expression: Expression): boolean {
    return isConstant(expression);
  }

  function recordRemoval(
    statement: Statement,
    message: string,
  ): void {
    steps.push({
      kind: "dead-code-elimination",
      message,
      before: describeStatement(statement),
      after: "(removed)",
      line: statement.line,
      column: statement.column,
    });
  }

  interface FlowResult {
    statements: Statement[];
    liveBefore: Set<number>;
  }

  function processStatements(
    items: Statement[],
    liveAfter: Set<number>,
  ): FlowResult {
    let live = new Set(liveAfter);
    const reversed: Statement[] = [];

    for (let i = items.length - 1; i >= 0; i--) {
      const statement = items[i]!;

      switch (statement.type) {
        case "VariableDeclaration": {
          const binding = declarationBindings.get(statement);
          const isLive = binding !== undefined && live.has(binding);
          const canRemove =
            !protectedDeclarations.has(statement) &&
  binding !== undefined &&
  !isLive &&
  !bindingsAssigned.has(binding) &&
  canDiscardEvaluation(statement.initializer);

          if (canRemove) {
            recordRemoval(
              statement,
              `Removed unused variable '${statement.name}'.`,
            );
            continue;
          }

          if (binding !== undefined) live.delete(binding);
          addExpressionReads(statement.initializer, live);
          reversed.push(statement);
          break;
        }

        case "AssignmentStatement": {
          const binding = assignmentBindings.get(statement);
          const isLive = binding !== undefined && live.has(binding);

          const canRemove =binding !== undefined &&
  !isLive &&
  canDiscardEvaluation(statement.value);

          if (canRemove) {
            recordRemoval(
              statement,
              `Removed dead assignment to '${statement.name}'.`,
            );
            continue;
          }

          // A write kills the previous value; the RHS is evaluated first.
          if (binding !== undefined) live.delete(binding);
          addExpressionReads(statement.value, live);
          reversed.push(statement);
          break;
        }

        case "PrintStatement":
          addExpressionReads(statement.expression, live);
          reversed.push(statement);
          break;

        case "BlockStatement": {
          const child = processStatements(
            statement.statements,
            new Set(live),
          );

          live = child.liveBefore;

          reversed.push({
            ...statement,
            statements: child.statements,
          });
          break;
        }

        case "IfStatement": {
          const thenResult = processStatements(
            statement.thenBranch.statements,
            new Set(live),
          );

          const thenBranch: BlockStatement = {
            ...statement.thenBranch,
            statements: thenResult.statements,
          };

          let elseBranch = statement.elseBranch;
          let elseLive = new Set(live);

          if (elseBranch?.type === "BlockStatement") {
            const elseResult = processStatements(
              elseBranch.statements,
              new Set(live),
            );

            elseLive = elseResult.liveBefore;
            elseBranch = {
              ...elseBranch,
              statements: elseResult.statements,
            };
          } else if (elseBranch) {
            const elseResult = processStatements(
              [elseBranch],
              new Set(live),
            );

            elseLive = elseResult.liveBefore;
            elseBranch = elseResult.statements[0] as typeof elseBranch;
          }

          // Either branch can run, so preserve reads required by both.
          live = new Set([...thenResult.liveBefore, ...elseLive]);
          addExpressionReads(statement.condition, live);

          reversed.push({
            ...statement,
            thenBranch,
            ...(elseBranch ? { elseBranch } : {}),
          });
          break;
        }
      }
    }

    reversed.reverse();

    return {
      statements: reversed,
      liveBefore: live,
    };
  }

  return processStatements(statements, new Set()).statements;
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
      if (!options.constantPropagation) {
        return expression;
      }

      if (!constants.has(expression.name)) {
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