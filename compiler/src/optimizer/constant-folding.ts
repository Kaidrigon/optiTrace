import type { Instruction } from "../ir/instructions";

export interface ConstantFoldingResult {
  instructions: Instruction[];
  foldedCount: number;
}

export function constantFold(
  instructions: Instruction[]
): ConstantFoldingResult {
  const constants = new Map<string, number>();
  const optimized: Instruction[] = [];
  let foldedCount = 0;

  for (const instruction of instructions) {
    switch (instruction.op) {
      case "const": {
        constants.set(instruction.dest, instruction.value);
        optimized.push(instruction);
        break;
      }

      case "move": {
        optimized.push(instruction);

        if (constants.has(instruction.source)) {
          constants.set(
            instruction.dest,
            constants.get(instruction.source)!
          );
        } else {
          constants.delete(instruction.dest);
        }

        break;
      }

      case "binary": {
        const left = constants.get(instruction.left);
        const right = constants.get(instruction.right);

        if (left === undefined || right === undefined) {
          constants.delete(instruction.dest);
          optimized.push(instruction);
          break;
        }

        // Preserve the runtime's division-by-zero error.
        if (instruction.operator === "/" && right === 0) {
          constants.delete(instruction.dest);
          optimized.push(instruction);
          break;
        }

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
            value = left / right;
            break;
        }

        // Never replace an operation with Infinity or NaN.
        if (!Number.isFinite(value)) {
          constants.delete(instruction.dest);
          optimized.push(instruction);
          break;
        }

        constants.set(instruction.dest, value);
        optimized.push({
          op: "const",
          dest: instruction.dest,
          value,
        });

        foldedCount++;
        break;
      }

      case "print": {
        optimized.push(instruction);
        break;
      }
    }
  }

  return {
    instructions: optimized,
    foldedCount,
  };
}
