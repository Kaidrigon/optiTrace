import { tokenize } from "./lexer.js";
import { parse } from "./parser.js";
import { optimizeWithReport } from "./optimizer.js";
import { interpret } from "./interpreter.js";

import type { Program } from "./ast.js";
import type {
  OptimizationOptions,
  OptimizationStep,
} from "./optimizer.js";

export interface CompilerResult {
  originalProgram: Program;
  optimizedProgram: Program;
  optimizationSteps: OptimizationStep[];
  output: string[];
}

/**
 * Runs source code through the complete OTL pipeline.
 *
 * All optimizations are enabled by default.
 * Individual optimizations can be disabled through options.
 */
export function compileSource(
  source: string,
  options: OptimizationOptions = {},
): CompilerResult {
  // Stage 1: Convert source code into tokens.
  const tokens = tokenize(source);

  // Stage 2: Parse tokens into an AST.
  const originalProgram = parse(tokens);

  // Stage 3: Optimize the AST and collect a report.
  const {
    program: optimizedProgram,
    steps: optimizationSteps,
  } = optimizeWithReport(originalProgram, options);

  // Stage 4: Execute the optimized program.
  const output = interpret(optimizedProgram);

  return {
    originalProgram,
    optimizedProgram,
    optimizationSteps,
    output,
  };
}
