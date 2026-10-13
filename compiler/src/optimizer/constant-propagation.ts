import type { Instruction } from "../ir/instructions";

export interface ConstantPropagationResult {
  instructions: Instruction[];
  propagatedCount: number;
}

export function constantPropagate(
  instructions: Instruction[]
): ConstantPropagationResult {
  const constants = new Map<string, number>();
  const optimized: Instruction[] = [];
  let propagatedCount = 0;

  for (const instruction of instructions) {
    switch (instruction.op) {
      case "const": {
        constants.set(instruction.dest, instruction.value);
        optimized.push(instruction);
        break;
      }

      case "move": {
        const knownValue = constants.get(instruction.source);

        if (knownValue !== undefined) {
          optimized.push({
            op: "const",
            dest: instruction.dest,
            value: knownValue,
          });

          constants.set(instruction.dest, knownValue);
          propagatedCount++;
        } else {
          optimized.push(instruction);
          constants.delete(instruction.dest);
        }

        break;
      }

      case "binary": {
        // Arithmetic remains for the constant-folding pass.
        optimized.push(instruction);
        constants.delete(instruction.dest);
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
    propagatedCount,
  };
}
