import type { Instruction } from "../ir/instructions";
import { constantPropagate } from "./constant-propagation";
import { constantFold } from "./constant-folding";
import { eliminateDeadCode } from "./dead-code";

export interface OptimizationOptions {
  constantPropagation?: boolean;
  constantFolding?: boolean;
  deadCodeElimination?: boolean;
}

export interface OptimizationStage {
  name: string;
  instructionsBefore: Instruction[];
  instructionsAfter: Instruction[];
  changedCount: number;
}

export interface OptimizationPipelineResult {
  instructions: Instruction[];
  stages: OptimizationStage[];
  totalChangedCount: number;
}

export function runOptimizationPipeline(
  input: Instruction[],
  options: OptimizationOptions = {}
): OptimizationPipelineResult {
  const enabled = {
    constantPropagation: options.constantPropagation ?? true,
    constantFolding: options.constantFolding ?? true,
    deadCodeElimination: options.deadCodeElimination ?? true,
  };

  let current = input.map((instruction) => ({ ...instruction }));
  const stages: OptimizationStage[] = [];

  if (enabled.constantPropagation) {
    const before = current.map((instruction) => ({ ...instruction }));
    const result = constantPropagate(current);
    current = result.instructions;
    stages.push({
      name: "Constant Propagation",
      instructionsBefore: before,
      instructionsAfter: current.map((instruction) => ({ ...instruction })),
      changedCount: result.propagatedCount,
    });
  }

  if (enabled.constantFolding) {
    const before = current.map((instruction) => ({ ...instruction }));
    const result = constantFold(current);
    current = result.instructions;
    stages.push({
      name: "Constant Folding",
      instructionsBefore: before,
      instructionsAfter: current.map((instruction) => ({ ...instruction })),
      changedCount: result.foldedCount,
    });
  }

  if (enabled.deadCodeElimination) {
    const before = current.map((instruction) => ({ ...instruction }));
    const result = eliminateDeadCode(current);
    current = result.instructions;
    stages.push({
      name: "Dead Code Elimination",
      instructionsBefore: before,
      instructionsAfter: current.map((instruction) => ({ ...instruction })),
      changedCount: result.removedCount,
    });
  }

  return {
    instructions: current,
    stages,
    totalChangedCount: stages.reduce(
      (total, stage) => total + stage.changedCount,
      0
    ),
  };
}
