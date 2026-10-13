import { tokenize } from "./lexer/lexer";
import { Parser } from "./parser/parser";
import { lowerToIR } from "./ir/lower";
import { formatIR } from "./ir/format";
import { executeIR } from "./runtime/execute";
import { runOptimizationPipeline } from "./optimizer/pipeline";
import type { OptimizationOptions } from "./optimizer/pipeline";
import type { Instruction } from "./ir/instructions";

export interface CompileOptions extends OptimizationOptions {
  execute?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  output: string[];
  error?: string;
}

export interface CompileResult {
  success: boolean;
  originalIR: Instruction[];
  optimizedIR: Instruction[];
  originalIRText: string;
  optimizedIRText: string;
  stages: ReturnType<typeof runOptimizationPipeline>["stages"];
  originalExecution: ExecutionResult;
  optimizedExecution: ExecutionResult;
  error?: string;
}

function runSafely(instructions: Instruction[]): ExecutionResult {
  try {
    return {
      success: true,
      output: executeIR(instructions).output,
    };
  } catch (error) {
    return {
      success: false,
      output: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function compileSource(
  source: string,
  options: CompileOptions = {}
): CompileResult {
  try {
    const tokens = tokenize(source);
    const ast = new Parser(tokens).parse();
    const irProgram = lowerToIR(ast);
    const originalIR = irProgram.instructions;
    const optimization = runOptimizationPipeline(originalIR, options);

    const shouldExecute = options.execute !== false;

    const originalExecution: ExecutionResult = shouldExecute
      ? runSafely(originalIR)
      : { success: true, output: [] };

    const optimizedExecution: ExecutionResult = shouldExecute
      ? runSafely(optimization.instructions)
      : { success: true, output: [] };

    return {
      success: true,
      originalIR,
      optimizedIR: optimization.instructions,
      originalIRText: formatIR(originalIR),
      optimizedIRText: formatIR(optimization.instructions),
      stages: optimization.stages,
      originalExecution,
      optimizedExecution,
    };
  } catch (error) {
    return {
      success: false,
      originalIR: [],
      optimizedIR: [],
      originalIRText: "",
      optimizedIRText: "",
      stages: [],
      originalExecution: { success: false, output: [] },
      optimizedExecution: { success: false, output: [] },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
