export type Expression =
  | { kind: "NumberLiteral"; value: number }
  | { kind: "Identifier"; name: string }
  | {
      kind: "BinaryExpression";
      operator: "+" | "-" | "*" | "/";
      left: Expression;
      right: Expression;
    }
  | {
      kind: "UnaryExpression";
      operator: "-" | "+";
      operand: Expression;
    };

export type Statement =
  | {
      kind: "VariableDeclaration";
      name: string;
      initializer: Expression;
    }
  | {
      kind: "PrintStatement";
      expression: Expression;
    };

export interface Program {
  kind: "Program";
  statements: Statement[];
}
