import type { Token, TokenType } from "./tokens";

export class LexerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LexerError";
  }
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let line = 1;
  let column = 1;

  function current(): string {
    return source[index] ?? "";
  }

  function peek(offset = 1): string {
    return source[index + offset] ?? "";
  }

  function advance(): string {
    const char = current();
    if (char === "") return "";

    index++;

    if (char === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }

    return char;
  }

  function addToken(type: TokenType, value: string, tokenLine: number, tokenColumn: number): void {
    tokens.push({ type, value, line: tokenLine, column: tokenColumn });
  }

  while (index < source.length) {
    const char = current();

    if (/\s/.test(char)) {
      advance();
      continue;
    }

    // Ignore single-line comments.
    if (char === "/" && peek() === "/") {
      while (index < source.length && current() !== "\n") {
        advance();
      }
      continue;
    }

    const tokenLine = line;
    const tokenColumn = column;

    // Identifiers and keywords.
    if (/[a-zA-Z_]/.test(char)) {
      let value = "";

      while (/[a-zA-Z0-9_]/.test(current())) {
        value += advance();
      }

      const type: TokenType =
        value === "let" ? "LET" :
        value === "print" ? "PRINT" :
        "IDENTIFIER";

      addToken(type, value, tokenLine, tokenColumn);
      continue;
    }

    // Integer and decimal numbers.
    if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(peek()))) {
      let value = "";

      while (/[0-9]/.test(current())) {
        value += advance();
      }

      if (current() === "." && /[0-9]/.test(peek())) {
        value += advance();

        while (/[0-9]/.test(current())) {
          value += advance();
        }
      }

      addToken("NUMBER", value, tokenLine, tokenColumn);
      continue;
    }

    const singleCharacterTokens: Record<string, TokenType> = {
      "+": "PLUS",
      "-": "MINUS",
      "*": "STAR",
      "/": "SLASH",
      "=": "EQUALS",
      "(": "LPAREN",
      ")": "RPAREN",
      ";": "SEMICOLON",
    };

    const tokenType = singleCharacterTokens[char];

    if (tokenType) {
      addToken(tokenType, advance(), tokenLine, tokenColumn);
      continue;
    }

    throw new LexerError(
      `Unexpected character '${char}' at line ${line}, column ${column}.`
    );
  }

  tokens.push({
    type: "EOF",
    value: "",
    line,
    column,
  });

  return tokens;
}
