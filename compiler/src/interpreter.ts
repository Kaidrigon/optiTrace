import type {
    AssignmentStatement,
    BinaryExpression,
    BlockStatement,
    Expression,
    IfStatement,
    Program,
    SourceLocation,
    Statement,
    UnaryExpression,
    VariableDeclaration,
    } from "./ast";

    export type OTLValue = number | boolean;

    type Environment = Map<string, OTLValue>;

    export class RuntimeError extends Error {
    constructor(
        message: string,
        public readonly line: number,
        public readonly column: number,
    ) {
        super(`${message} At line ${line}, column ${column}.`);
        this.name = "RuntimeError";
    }
    }

    /**
     * Execute an OTL program and return its printed output.
     *
     * Each invocation gets a fresh global environment.
     */
    export function interpret(program: Program): string[] {
    const scopes: Environment[] = [new Map()];
    const output: string[] = [];

    function fail(node: SourceLocation, message: string): never {
        throw new RuntimeError(message, node.line, node.column);
    }

    function currentScope(): Environment {
        return scopes[scopes.length - 1]!;
    }

    function findVariable(name: string): Environment | undefined {
        for (let i = scopes.length - 1; i >= 0; i--) {
        const scope = scopes[i]!;

        if (scope.has(name)) {
            return scope;
        }
        }

        return undefined;
    }

    function declareVariable(
        name: string,
        value: OTLValue,
        node: SourceLocation,
    ): void {
        const scope = currentScope();

        if (scope.has(name)) {
        fail(node, `Variable '${name}' is already declared in this scope.`);
        }

        scope.set(name, value);
    }

    function assignVariable(
        name: string,
        value: OTLValue,
        node: SourceLocation,
    ): void {
        const scope = findVariable(name);

        if (!scope) {
        fail(node, `Cannot assign to undefined variable '${name}'.`);
        }

        scope.set(name, value);
    }

    function getVariable(
        name: string,
        node: SourceLocation,
    ): OTLValue {
        const scope = findVariable(name);

        if (!scope) {
        fail(node, `Undefined variable '${name}'.`);
        }

        return scope.get(name)!;
    }

    function requireNumber(
        value: OTLValue,
        node: SourceLocation,
    ): number {
        if (typeof value !== "number") {
        fail(node, "Expected a number for this operation.");
        }

        return value;
    }

    function requireBoolean(
        value: OTLValue,
        node: SourceLocation,
    ): boolean {
        if (typeof value !== "boolean") {
        fail(node, "Expected a boolean condition.");
        }

        return value;
    }

    function evaluate(expression: Expression): OTLValue {
        switch (expression.type) {
        case "NumberLiteral":
            return expression.value;

        case "BooleanLiteral":
            return expression.value;

        case "IdentifierExpression":
            return getVariable(expression.name, expression);

        case "UnaryExpression":
            return evaluateUnary(expression);

        case "BinaryExpression":
            return evaluateBinary(expression);
        }
    }

    function evaluateUnary(
        expression: UnaryExpression,
    ): OTLValue {
        const value = evaluate(expression.operand);

        switch (expression.operator) {
        case "-":
            return -requireNumber(value, expression);

        case "!":
            return !requireBoolean(value, expression);
        }
    }

    function evaluateBinary(
        expression: BinaryExpression,
    ): OTLValue {
        const left = evaluate(expression.left);
        const right = evaluate(expression.right);

        switch (expression.operator) {
        case "+":
            return (
            requireNumber(left, expression) +
            requireNumber(right, expression)
            );

        case "-":
            return (
            requireNumber(left, expression) -
            requireNumber(right, expression)
            );

        case "*":
            return (
            requireNumber(left, expression) *
            requireNumber(right, expression)
            );

        case "/": {
            const divisor = requireNumber(right, expression);

            if (divisor === 0) {
            fail(expression, "Division by zero.");
            }

            return requireNumber(left, expression) / divisor;
        }

        case "%": {
            const divisor = requireNumber(right, expression);

            if (divisor === 0) {
            fail(expression, "Modulo by zero.");
            }

            return requireNumber(left, expression) % divisor;
        }

        case "==":
            if (typeof left !== typeof right) {
            return false;
            }

            return left === right;

        case "!=":
            if (typeof left !== typeof right) {
            return true;
            }

            return left !== right;

        case "<":
            return (
            requireNumber(left, expression) <
            requireNumber(right, expression)
            );

        case ">":
            return (
            requireNumber(left, expression) >
            requireNumber(right, expression)
            );

        case "<=":
            return (
            requireNumber(left, expression) <=
            requireNumber(right, expression)
            );

        case ">=":
            return (
            requireNumber(left, expression) >=
            requireNumber(right, expression)
            );
        }
    }

    function execute(statement: Statement): void {
        switch (statement.type) {
        case "VariableDeclaration":
            executeVariableDeclaration(statement);
            return;

        case "AssignmentStatement":
            executeAssignment(statement);
            return;

        case "PrintStatement":
            output.push(String(evaluate(statement.expression)));
            return;

        case "IfStatement":
            executeIf(statement);
            return;

        case "BlockStatement":
            executeBlock(statement);
            return;
        }
    }

    function executeVariableDeclaration(
        statement: VariableDeclaration,
    ): void {
        const value = evaluate(statement.initializer);

        declareVariable(statement.name, value, statement);
    }

    function executeAssignment(
        statement: AssignmentStatement,
    ): void {
        const value = evaluate(statement.value);

        assignVariable(statement.name, value, statement);
    }

    function executeIf(statement: IfStatement): void {
        const condition = requireBoolean(
        evaluate(statement.condition),
        statement.condition,
        );

        if (condition) {
        executeBlock(statement.thenBranch);
        return;
        }

        if (!statement.elseBranch) {
        return;
        }

        if (statement.elseBranch.type === "IfStatement") {
        executeIf(statement.elseBranch);
        } else {
        executeBlock(statement.elseBranch);
        }
    }

    function executeBlock(block: BlockStatement): void {
        scopes.push(new Map());

        try {
        for (const statement of block.statements) {
            execute(statement);
        }
        } finally {
        scopes.pop();
        }
    }

    for (const statement of program.statements) {
        execute(statement);
    }

    return output;
    }
