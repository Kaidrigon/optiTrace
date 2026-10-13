import { tokenize } from "./lexer";
import { parse } from "./parser";
import { optimizeWithReport } from "./optimizer";
import { interpret } from "./interpreter";
import type { Program } from "./ast";
import type { OptimizationOptions, OptimizationStep } from "./optimizer";

export interface CompilerResult {
  originalProgram: Program;
  optimizedProgram: Program;
  optimizationSteps: OptimizationStep[];
  originalOutput: string[];
  output: string[];
}

export function compileSource(
  source: string,
  options: OptimizationOptions = {},
): CompilerResult {
  const tokens = tokenize(source);
  const originalProgram = parse(tokens);
  const { program: optimizedProgram, steps: optimizationSteps } =
    optimizeWithReport(originalProgram, options);

  return {
    originalProgram,
    optimizedProgram,
    optimizationSteps,
    originalOutput: interpret(originalProgram),
    output: interpret(optimizedProgram),
  };
}
