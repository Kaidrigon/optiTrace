    export interface SourceLocation {
    line: number;
    column: number;
    }

    // A complete OTL program contains a sequence of statements.
    export interface Program extends SourceLocation {
    type: "Program";
    statements: Statement[];
    }

    // Statements perform actions or control program execution.
    export type Statement =
    | VariableDeclaration
    | AssignmentStatement
    | PrintStatement
    | IfStatement
    | BlockStatement;

    // let total = 100 + 20;
    export interface VariableDeclaration extends SourceLocation {
    type: "VariableDeclaration";
    name: string;
    initializer: Expression;
    }

    // total = 50;
    export interface AssignmentStatement extends SourceLocation {
    type: "AssignmentStatement";
    name: string;
    value: Expression;
    }

    // print(total);
    export interface PrintStatement extends SourceLocation {
    type: "PrintStatement";
    expression: Expression;
    }

    // if (total > 100) { ... }
    export interface IfStatement extends SourceLocation {
    type: "IfStatement";
    condition: Expression;
    thenBranch: BlockStatement;
    elseBranch?: BlockStatement | IfStatement;
    }

    // A block contains zero or more statements.
    export interface BlockStatement extends SourceLocation {
    type: "BlockStatement";
    statements: Statement[];
    }

    // Expressions produce values.
    export type Expression =
    | NumberLiteral
    | BooleanLiteral
    | IdentifierExpression
    | UnaryExpression
    | BinaryExpression;

    // 100 or 20.5
    export interface NumberLiteral extends SourceLocation {
    type: "NumberLiteral";
    value: number;
    }

    // true or false
    export interface BooleanLiteral extends SourceLocation {
    type: "BooleanLiteral";
    value: boolean;
    }

    // total
    export interface IdentifierExpression extends SourceLocation {
    type: "IdentifierExpression";
    name: string;
    }

    // -total
    export interface UnaryExpression extends SourceLocation {
    type: "UnaryExpression";
    operator: "-" | "!";
    operand: Expression;
    }

    // total + tax
    export interface BinaryExpression extends SourceLocation {
    type: "BinaryExpression";
    operator:
        | "+"
        | "-"
        | "*"
        | "/"
        | "%"
        | "=="
        | "!="
        | "<"
        | ">"
        | "<="
        | ">=";
    left: Expression;
    right: Expression;
    }
