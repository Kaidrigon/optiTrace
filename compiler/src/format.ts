import type {
  Expression,
  Program,
  Statement,
} from "./ast";

function formatExpression(expression: Expression): string {
  switch (expression.type) {
    case "NumberLiteral":
      return String(expression.value);

    case "BooleanLiteral":
      return String(expression.value);

    case "IdentifierExpression":
      return expression.name;

    case "UnaryExpression":
      return `${expression.operator}${formatExpression(expression.operand)}`;

    case "BinaryExpression":
      return `(${formatExpression(expression.left)} ${expression.operator} ${formatExpression(expression.right)})`;
  }
}

function formatStatement(statement: Statement, indent = ""): string {
  switch (statement.type) {
    case "VariableDeclaration":
      return `${indent}let ${statement.name} = ${formatExpression(statement.initializer)};`;

    case "AssignmentStatement":
      return `${indent}${statement.name} = ${formatExpression(statement.value)};`;

    case "PrintStatement":
      return `${indent}print(${formatExpression(statement.expression)});`;

    case "BlockStatement":
      return [
        `${indent}{`,
        ...statement.statements.map((item) => formatStatement(item, `${indent}  `)),
        `${indent}}`,
      ].join("\n");

    case "IfStatement": {
      const lines = [
        `${indent}if (${formatExpression(statement.condition)}) ${formatStatement(statement.thenBranch, indent)}`,
      ];

      if (statement.elseBranch) {
        if (statement.elseBranch.type === "IfStatement") {
          lines.push(`${indent}else ${formatStatement(statement.elseBranch, indent).trimStart()}`);
        } else {
          lines.push(`${indent}else ${formatStatement(statement.elseBranch, indent)}`);
        }
      }

      return lines.join("\n");
    }
  }
}

export function formatProgram(program: Program): string {
  return program.statements
    .map((statement) => formatStatement(statement))
    .join("\n");
}
