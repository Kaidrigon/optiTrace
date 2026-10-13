import type { IRProgram, Instruction } from "../ir/instructions";

export interface ExecutionResult {
  output: string[];
  variables: Record<string, number>;
  steps: number;
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

export function executeIR(program: IRProgram | Instruction[]): ExecutionResult {
  const instructions = Array.isArray(program)
    ? program
    : program.instructions;

  const environment = new Map<string, number>();
  const output: string[] = [];

  function read(name: string): number {
    if (!environment.has(name)) {
      throw new RuntimeError(
        `Variable '${name}' read before it was initialized`
      );
    }

    return environment.get(name)!;
  }

  function write(name: string, value: number): void {
    if (!Number.isFinite(value)) {
      throw new RuntimeError(
        `Non-finite numeric result while writing '${name}'`
      );
    }

    environment.set(name, value);
  }

  for (let index = 0; index < instructions.length; index++) {
    const instruction = instructions[index];

    switch (instruction.op) {
      case "const": {
        write(instruction.dest, instruction.value);
        break;
      }

      case "move": {
        write(instruction.dest, read(instruction.source));
        break;
      }

      case "binary": {
        const left = read(instruction.left);
        const right = read(instruction.right);
        let value: number;

        switch (instruction.operator) {
          case "+":
            value = left + right;
            break;
          case "-":
            value = left - right;
            break;
          case "*":
            value = left * right;
            break;
          case "/":
            if (right === 0) {
              throw new RuntimeError("Division by zero");
            }
            value = left / right;
            break;
        }

        write(instruction.dest, value);
        break;
      }

      case "print": {
        output.push(String(read(instruction.source)));
        break;
      }
    }
  }

  const variables: Record<string, number> = {};

  for (const [name, value] of environment) {
    if (!/^t\d+$/.test(name)) {
      variables[name] = value;
    }
  }

  return {
    output,
    variables,
    steps: instructions.length,
  };
}
