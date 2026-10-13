import type { Instruction } from "./instructions";

export function formatInstruction(instruction: Instruction): string {
  switch (instruction.op) {
    case "const":
      return `const ${instruction.dest}, ${instruction.value}`;

    case "move":
      return `move ${instruction.dest}, ${instruction.source}`;

    case "binary":
      return `${instruction.operator} ${instruction.dest}, ${instruction.left}, ${instruction.right}`;

    case "print":
      return `print ${instruction.source}`;
  }
}

export function formatIR(instructions: Instruction[]): string {
  return instructions.map(formatInstruction).join("\n");
}
