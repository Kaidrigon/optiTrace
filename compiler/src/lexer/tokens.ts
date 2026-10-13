export type TokenType =
  | "LET"
  | "PRINT"
  | "IDENTIFIER"
  | "NUMBER"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "EQUALS"
  | "LPAREN"
  | "RPAREN"
  | "SEMICOLON"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}
