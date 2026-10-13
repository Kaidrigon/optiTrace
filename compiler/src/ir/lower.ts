import type {
  Expression,
  Program,
  Statement,
} from "../ast/nodes";

import type {
  BinaryOperator,
  Instruction,
  IRProgram,
} from "./instructions";

export class LoweringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoweringError";
  }
}

export function lowerToIR(program: Program): IRProgram {
  const instructions: Instruction[] = [];
  const declared = new Set<string>();
  let tempCount = 0;

  function newTemp(): string {
    tempCount++;
    return `t${tempCount}`;
  }

  function lowerExpression(expression: Expression): string {
    switch (expression.kind) {
      case "NumberLiteral": {
        const dest = newTemp();

        instructions.push({
          op: "const",
          dest,
          value: expression.value,
        });

        return dest;
      }

      case "Identifier": {
        if (!declared.has(expression.name)) {
          throw new LoweringError(
            `Variable '${expression.name}' used before declaration`
          );
        }

        return expression.name;
      }

      case "UnaryExpression": {
        const operand = lowerExpression(expression.operand);

        if (expression.operator === "+") {
          return operand;
        }

        const zero = newTemp();
        instructions.push({
          op: "const",
          dest: zero,
          value: 0,
        });

        const dest = newTemp();
        instructions.push({
          op: "binary",
          dest,
          operator: "-",
          left: zero,
          right: operand,
        });

        return dest;
      }

      case "BinaryExpression": {
        const left = lowerExpression(expression.left);
        const right = lowerExpression(expression.right);
        const dest = newTemp();

        instructions.push({
          op: "binary",
          dest,
          operator: expression.operator as BinaryOperator,
          left,
          right,
        });

        return dest;
      }
    }
  }

  function lowerStatement(statement: Statement): void {
    switch (statement.kind) {
      case "VariableDeclaration": {
        if (declared.has(statement.name)) {
          throw new LoweringError(
            `Variable '${statement.name}' is already declared`
          );
        }

        const source = lowerExpression(statement.initializer);

        instructions.push({
          op: "move",
          dest: statement.name,
          source,
        });

        declared.add(statement.name);
        break;
      }

      case "PrintStatement": {
        const source = lowerExpression(statement.expression);

        instructions.push({
          op: "print",
          source,
        });

        break;
      }
    }
  }

  for (const statement of program.statements) {
    lowerStatement(statement);
  }

  return {
    instructions,
    tempCount,
  };
}
