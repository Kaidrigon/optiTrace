import type { Instruction } from "../ir/instructions";

export interface DeadCodeResult {
  instructions: Instruction[];
  removedCount: number;
}

function uses(instruction: Instruction): string[] {
  switch (instruction.op) {
    case "const":
      return [];

    case "move":
      return [instruction.source];

    case "binary":
      return [instruction.left, instruction.right];

    case "print":
      return [instruction.source];
  }
}

export function eliminateDeadCode(
  instructions: Instruction[]
): DeadCodeResult {
  const live = new Set<string>();
  const kept: Instruction[] = [];
  let removedCount = 0;

  for (let i = instructions.length - 1; i >= 0; i--) {
    const instruction = instructions[i];

    if (instruction.op === "print") {
      kept.push(instruction);
      live.add(instruction.source);
      continue;
    }

    if (instruction.op === "const" || instruction.op === "move") {
      if (!live.has(instruction.dest)) {
        removedCount++;
        continue;
      }

      live.delete(instruction.dest);

      for (const name of uses(instruction)) {
        live.add(name);
      }

      kept.push(instruction);
      continue;
    }

    // Keep arithmetic for now because it can raise runtime errors.
    live.delete(instruction.dest);

    for (const name of uses(instruction)) {
      live.add(name);
    }

    kept.push(instruction);
  }

  kept.reverse();

  return {
    instructions: kept,
    removedCount,
  };
}
