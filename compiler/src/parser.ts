import type { Token, TokenType } from "./lexer";

import type {
    AssignmentStatement,
    BinaryExpression,
    BlockStatement,
    BooleanLiteral,
    Expression,
    IdentifierExpression,
    IfStatement,
    NumberLiteral,
    PrintStatement,
    Program,
    SourceLocation,
    Statement,
    UnaryExpression,
    VariableDeclaration,
    } from "./ast";

    export class ParserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ParserError";
    }
    }

    export class Parser {
    private readonly tokens: Token[];
    private current = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Program {
        const first = this.peek();

        const statements: Statement[] = [];

        while (!this.isAtEnd()) {
        statements.push(this.parseStatement());
        }

        return {
        type: "Program",
        statements,
        line: first.line,
        column: first.column,
        };
    }

    // --------------------------------------------------
    // Statements
    // --------------------------------------------------

    private parseStatement(): Statement {
        if (this.match("LET")) {
        return this.parseVariableDeclaration();
        }

        if (this.match("PRINT")) {
        return this.parsePrintStatement();
        }

        if (this.match("IF")) {
        return this.parseIfStatement();
        }

        if (this.match("LEFT_BRACE")) {
        return this.parseBlockStatement(this.previous());
        }

        // An identifier followed by "=" is an assignment.
        if (
        this.check("IDENTIFIER") &&
        this.peekNext().type === "EQUAL"
        ) {
        return this.parseAssignmentStatement();
        }

        throw this.error(
        this.peek(),
        "Expected a statement: let, print, if, a block, or an assignment.",
        );
    }

    private parseVariableDeclaration(): VariableDeclaration {
        const keyword = this.previous();

        const name = this.consume(
        "IDENTIFIER",
        "Expected a variable name after 'let'.",
        );

        this.consume(
        "EQUAL",
        "Expected '=' after the variable name.",
        );

        const initializer = this.parseExpression();

        this.consume(
        "SEMICOLON",
        "Expected ';' after the variable declaration.",
        );

        return {
        type: "VariableDeclaration",
        name: name.value,
        initializer,
        ...this.location(keyword),
        };
    }

    private parseAssignmentStatement(): AssignmentStatement {
        const name = this.consume(
        "IDENTIFIER",
        "Expected a variable name.",
        );

        this.consume(
        "EQUAL",
        "Expected '=' in the assignment.",
        );

        const value = this.parseExpression();

        this.consume(
        "SEMICOLON",
        "Expected ';' after the assignment.",
        );

        return {
        type: "AssignmentStatement",
        name: name.value,
        value,
        ...this.location(name),
        };
    }

    private parsePrintStatement(): PrintStatement {
        const keyword = this.previous();

        this.consume(
        "LEFT_PAREN",
        "Expected '(' after 'print'.",
        );

        const expression = this.parseExpression();

        this.consume(
        "RIGHT_PAREN",
        "Expected ')' after the print expression.",
        );

        this.consume(
        "SEMICOLON",
        "Expected ';' after the print statement.",
        );

        return {
        type: "PrintStatement",
        expression,
        ...this.location(keyword),
        };
    }

    private parseIfStatement(): IfStatement {
        const keyword = this.previous();

        this.consume(
        "LEFT_PAREN",
        "Expected '(' after 'if'.",
        );

        const condition = this.parseExpression();

        this.consume(
        "RIGHT_PAREN",
        "Expected ')' after the if condition.",
        );

        this.consume(
        "LEFT_BRACE",
        "Expected '{' before the if body.",
        );

        const thenBranch = this.parseBlockStatement(this.previous());

        let elseBranch: BlockStatement | IfStatement | undefined;

        if (this.match("ELSE")) {
        if (this.match("IF")) {
            elseBranch = this.parseIfStatement();
        } else {
            this.consume(
            "LEFT_BRACE",
            "Expected '{' before the else body.",
            );

            elseBranch = this.parseBlockStatement(this.previous());
        }
        }

        return {
        type: "IfStatement",
        condition,
        thenBranch,
        ...(elseBranch ? { elseBranch } : {}),
        ...this.location(keyword),
        };
    }

    private parseBlockStatement(
        openingBrace: Token,
    ): BlockStatement {
        const statements: Statement[] = [];

        while (
        !this.check("RIGHT_BRACE") &&
        !this.isAtEnd()
        ) {
        statements.push(this.parseStatement());
        }

        this.consume(
        "RIGHT_BRACE",
        "Expected '}' after the block.",
        );

        return {
        type: "BlockStatement",
        statements,
        ...this.location(openingBrace),
        };
    }

    // --------------------------------------------------
    // Expressions and operator precedence
    //
    // Lowest precedence:
    // equality -> comparison -> addition ->
    // multiplication -> unary -> primary
    // --------------------------------------------------

    private parseExpression(): Expression {
        return this.parseEquality();
    }

    private parseEquality(): Expression {
        let expression = this.parseComparison();

        while (this.match("EQUAL_EQUAL", "BANG_EQUAL")) {
        const operator = this.previous();
        const right = this.parseComparison();

        expression = {
            type: "BinaryExpression",
            operator: operator.value as BinaryExpression["operator"],
            left: expression,
            right,
            ...this.location(operator),
        };
        }

        return expression;
    }

    private parseComparison(): Expression {
        let expression = this.parseTerm();

        while (
        this.match(
            "LESS",
            "GREATER",
            "LESS_EQUAL",
            "GREATER_EQUAL",
        )
        ) {
        const operator = this.previous();
        const right = this.parseTerm();

        expression = {
            type: "BinaryExpression",
            operator: operator.value as BinaryExpression["operator"],
            left: expression,
            right,
            ...this.location(operator),
        };
        }

        return expression;
    }

    private parseTerm(): Expression {
        let expression = this.parseFactor();

        while (this.match("PLUS", "MINUS")) {
        const operator = this.previous();
        const right = this.parseFactor();

        expression = {
            type: "BinaryExpression",
            operator: operator.value as BinaryExpression["operator"],
            left: expression,
            right,
            ...this.location(operator),
        };
        }

        return expression;
    }

    private parseFactor(): Expression {
        let expression = this.parseUnary();

        while (this.match("STAR", "SLASH", "PERCENT")) {
        const operator = this.previous();
        const right = this.parseUnary();

        expression = {
            type: "BinaryExpression",
            operator: operator.value as BinaryExpression["operator"],
            left: expression,
            right,
            ...this.location(operator),
        };
        }

        return expression;
    }

    private parseUnary(): Expression {
        if (this.match("MINUS", "BANG")) {
        const operator = this.previous();
        const operand = this.parseUnary();

        const unary: UnaryExpression = {
            type: "UnaryExpression",
            operator: operator.value as UnaryExpression["operator"],
            operand,
            ...this.location(operator),
        };

        return unary;
        }

        return this.parsePrimary();
    }

    private parsePrimary(): Expression {
        if (this.match("NUMBER")) {
        const token = this.previous();
        const value = Number(token.value);

        if (!Number.isFinite(value)) {
            throw this.error(token, "Number is outside the supported range.");
        }

        const literal: NumberLiteral = {
            type: "NumberLiteral",
            value,
            ...this.location(token),
        };

        return literal;
        }

        if (this.match("TRUE", "FALSE")) {
        const token = this.previous();

        const literal: BooleanLiteral = {
            type: "BooleanLiteral",
            value: token.type === "TRUE",
            ...this.location(token),
        };

        return literal;
        }

        if (this.match("IDENTIFIER")) {
        const token = this.previous();

        const identifier: IdentifierExpression = {
            type: "IdentifierExpression",
            name: token.value,
            ...this.location(token),
        };

        return identifier;
        }

        if (this.match("LEFT_PAREN")) {
        const expression = this.parseExpression();

        this.consume(
            "RIGHT_PAREN",
            "Expected ')' after the expression.",
        );

        return expression;
        }

        throw this.error(
        this.peek(),
        "Expected an expression: a number, boolean, variable, or parenthesized expression.",
        );
    }

    // --------------------------------------------------
    // Token helpers
    // --------------------------------------------------

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
        if (this.check(type)) {
            this.advance();
            return true;
        }
        }

        return false;
    }

    private consume(
        type: TokenType,
        message: string,
    ): Token {
        if (this.check(type)) {
        return this.advance();
        }

        throw this.error(this.peek(), message);
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) {
        return type === "EOF";
        }

        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) {
        this.current++;
        }

        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === "EOF";
    }

    private peek(): Token {
        return this.tokens[this.current] ?? {
        type: "EOF",
        value: "",
        line: 1,
        column: 1,
        };
    }

    private peekNext(): Token {
        return this.tokens[this.current + 1] ?? {
        type: "EOF",
        value: "",
        line: this.peek().line,
        column: this.peek().column,
        };
    }

    private previous(): Token {
        return this.tokens[Math.max(0, this.current - 1)]!;
    }

    private location(token: Token): SourceLocation {
        return {
        line: token.line,
        column: token.column,
        };
    }

    private error(token: Token, message: string): ParserError {
        return new ParserError(
        `${message} At line ${token.line}, column ${token.column}.`,
        );
    }
    }

    export function parse(tokens: Token[]): Program {
    return new Parser(tokens).parse();
    }
