export type BinaryOperator = "+" | "-" | "*" | "/";

export type Instruction =
  | {
      op: "const";
      dest: string;
      value: number;
    }
  | {
      op: "move";
      dest: string;
      source: string;
    }
  | {
      op: "binary";
      dest: string;
      operator: BinaryOperator;
      left: string;
      right: string;
    }
  | {
      op: "print";
      source: string;
    };

export interface IRProgram {
  instructions: Instruction[];
  tempCount: number;
}
