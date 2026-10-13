    export type TokenType =
    | "LET"
    | "PRINT"
    | "IF"
    | "ELSE"
    | "TRUE"
    | "FALSE"
    | "IDENTIFIER"
    | "NUMBER"
    | "PLUS"
    | "MINUS"
    | "STAR"
    | "SLASH"
    | "PERCENT"
    | "EQUAL"
    | "EQUAL_EQUAL"
    | "BANG_EQUAL"
    | "LESS"
    | "GREATER"
    | "LESS_EQUAL"
    | "GREATER_EQUAL"
    | "LEFT_PAREN"
    | "RIGHT_PAREN"
    | "LEFT_BRACE"
    | "RIGHT_BRACE"
    | "SEMICOLON"
    | "BANG"
    | "EOF";

    export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
    }

    const KEYWORDS: Record<string, TokenType> = {
    let: "LET",
    print: "PRINT",
    if: "IF",
    else: "ELSE",
    true: "TRUE",
    false: "FALSE",
    };

    export class LexerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LexerError";
    }
    }

    export function tokenize(source: string): Token[] {
    const tokens: Token[] = [];

    let position = 0;
    let line = 1;
    let column = 1;

    function peek(offset = 0): string {
        return source[position + offset] ?? "\0";
    }

    function advance(): string {
    const char = source[position] ?? "\0";
    position++;

    if (char === "\n") {
        line++;
        column = 1;
    } else {
        column++;
    }

    return char;
    }

    function addToken(
        type: TokenType,
        value: string,
        tokenLine: number,
        tokenColumn: number,
    ): void {
        tokens.push({
        type,
        value,
        line: tokenLine,
        column: tokenColumn,
        });
    }

    function isDigit(char: string): boolean {
        return char >= "0" && char <= "9";
    }

    function isAlpha(char: string): boolean {
        return (
        (char >= "a" && char <= "z") ||
        (char >= "A" && char <= "Z") ||
        char === "_"
        );
    }

    function isAlphaNumeric(char: string): boolean {
        return isAlpha(char) || isDigit(char);
    }

    while (position < source.length) {
        const char = peek();

        // Ignore whitespace.
        if (char === " " || char === "\r" || char === "\t" || char === "\n") {
        advance();
        continue;
        }

        // Ignore single-line comments.
        if (char === "/" && peek(1) === "/") {
        while (position < source.length && peek() !== "\n") {
            advance();
        }
        continue;
        }

        const tokenLine = line;
        const tokenColumn = column;

        // Identifiers and keywords.
        if (isAlpha(char)) {
        let value = "";

        while (isAlphaNumeric(peek())) {
            value += advance();
        }

        const type = KEYWORDS[value] ?? "IDENTIFIER";
        addToken(type, value, tokenLine, tokenColumn);
        continue;
        }

        // Integer and decimal numbers.
        if (isDigit(char)) {
        let value = "";

        while (isDigit(peek())) {
            value += advance();
        }

        if (peek() === "." && isDigit(peek(1))) {
            value += advance();

            while (isDigit(peek())) {
            value += advance();
            }
        }

        addToken("NUMBER", value, tokenLine, tokenColumn);
        continue;
        }

        // Operators and punctuation.
        switch (char) {
        case "+":
            advance();
            addToken("PLUS", char, tokenLine, tokenColumn);
            break;

        case "-":
            advance();
            addToken("MINUS", char, tokenLine, tokenColumn);
            break;

        case "*":
            advance();
            addToken("STAR", char, tokenLine, tokenColumn);
            break;

        case "/":
            advance();
            addToken("SLASH", char, tokenLine, tokenColumn);
            break;

        case "%":
            advance();
            addToken("PERCENT", char, tokenLine, tokenColumn);
            break;

        case "(":
            advance();
            addToken("LEFT_PAREN", char, tokenLine, tokenColumn);
            break;

        case ")":
            advance();
            addToken("RIGHT_PAREN", char, tokenLine, tokenColumn);
            break;

        case "{":
            advance();
            addToken("LEFT_BRACE", char, tokenLine, tokenColumn);
            break;

        case "}":
            advance();
            addToken("RIGHT_BRACE", char, tokenLine, tokenColumn);
            break;

        case ";":
            advance();
            addToken("SEMICOLON", char, tokenLine, tokenColumn);
            break;

        case "=":
            advance();

            if (peek() === "=") {
            advance();
            addToken("EQUAL_EQUAL", "==", tokenLine, tokenColumn);
            } else {
            addToken("EQUAL", "=", tokenLine, tokenColumn);
            }
            break;

        case "!":
    advance();

    if (peek() === "=") {
        advance();
        addToken("BANG_EQUAL", "!=", tokenLine, tokenColumn);
    } else {
        addToken("BANG", "!", tokenLine, tokenColumn);
    }
    break;

        case "<":
            advance();

            if (peek() === "=") {
            advance();
            addToken("LESS_EQUAL", "<=", tokenLine, tokenColumn);
            } else {
            addToken("LESS", "<", tokenLine, tokenColumn);
            }
            break;

        case ">":
            advance();

            if (peek() === "=") {
            advance();
            addToken("GREATER_EQUAL", ">=", tokenLine, tokenColumn);
            } else {
            addToken("GREATER", ">", tokenLine, tokenColumn);
            }
            break;

        default:
            throw new LexerError(
            `Unexpected character '${char}' at line ${line}, column ${column}.`,
            );
        }
    }

    tokens.push({
        type: "EOF",
        value: "",
        line,
        column,
    });

    return tokens;
    }
