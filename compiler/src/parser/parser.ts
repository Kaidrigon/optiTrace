import type { Token, TokenType } from "../lexer/tokens";
import type {
  Expression,
  Program,
  Statement,
} from "../ast/nodes";

export class ParserError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number
  ) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = "ParserError";
  }
}

export class Parser {
  private current = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Program {
    const statements: Statement[] = [];

    while (!this.check("EOF")) {
      statements.push(this.statement());
    }

    return { kind: "Program", statements };
  }

  private statement(): Statement {
    if (this.match("LET")) {
      const name = this.consume(
        "IDENTIFIER",
        "Expected a variable name after 'let'"
      ).value;

      this.consume("EQUALS", "Expected '=' after variable name");
      const initializer = this.expression();

      this.consume("SEMICOLON", "Expected ';' after declaration");

      return {
        kind: "VariableDeclaration",
        name,
        initializer,
      };
    }

    if (this.match("PRINT")) {
      const expression = this.expression();

      this.consume("SEMICOLON", "Expected ';' after print statement");

      return {
        kind: "PrintStatement",
        expression,
      };
    }

    const token = this.peek();
    throw new ParserError(
      `Unexpected token '${token.value || token.type}'`,
      token.line,
      token.column
    );
  }

  private expression(): Expression {
    return this.addition();
  }

  private addition(): Expression {
    let expr = this.multiplication();

    while (this.match("PLUS", "MINUS")) {
      const operator = this.previous().value as "+" | "-";
      const right = this.multiplication();

      expr = {
        kind: "BinaryExpression",
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private multiplication(): Expression {
    let expr = this.unary();

    while (this.match("STAR", "SLASH")) {
      const operator = this.previous().value as "*" | "/";
      const right = this.unary();

      expr = {
        kind: "BinaryExpression",
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private unary(): Expression {
    if (this.match("MINUS", "PLUS")) {
      const operator = this.previous().value as "-" | "+";

      return {
        kind: "UnaryExpression",
        operator,
        operand: this.unary(),
      };
    }

    return this.primary();
  }

  private primary(): Expression {
    if (this.match("NUMBER")) {
      return {
        kind: "NumberLiteral",
        value: Number(this.previous().value),
      };
    }

    if (this.match("IDENTIFIER")) {
      return {
        kind: "Identifier",
        name: this.previous().value,
      };
    }

    if (this.match("LPAREN")) {
      const expr = this.expression();

      this.consume("RPAREN", "Expected ')' after expression");
      return expr;
    }

    const token = this.peek();

    throw new ParserError(
      `Expected a number, variable, or parenthesized expression; got '${token.value || token.type}'`,
      token.line,
      token.column
    );
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    const token = this.peek();
    throw new ParserError(message, token.line, token.column);
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.check("EOF")) {
      this.current++;
    }

    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.current] ?? this.tokens[this.tokens.length - 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}
