import { compileSource as compileOTL } from "./compiler";
import { formatProgram } from "./format";
import type { OptimizationOptions } from "./optimizer";

export interface CompileOptions extends OptimizationOptions {
  execute?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  output: string[];
  error?: string;
}

export interface OptimizationStage {
  name: string;
  changedCount: number;
  instructionsBefore: string;
  instructionsAfter: string;
}

export interface CompileResult {
  success: boolean;
  originalIR: string[];
  optimizedIR: string[];
  originalIRText: string;
  optimizedIRText: string;
  stages: OptimizationStage[];
  originalExecution: ExecutionResult;
  optimizedExecution: ExecutionResult;
  error?: string;
}

export function compileSource(
  source: string,
  options: CompileOptions = {},
): CompileResult {
  try {
    const result = compileOTL(source, options);

    const originalIRText = formatProgram(result.originalProgram);
    const optimizedIRText = formatProgram(result.optimizedProgram);

    const originalExecution: ExecutionResult = {
      success: true,
      output: result.originalOutput,
    };

    const optimizedExecution: ExecutionResult = {
      success: true,
      output: result.output,
    };

    
  const stages: OptimizationStage[] = result.optimizationSteps.map(
  (step, index) => ({
    name: `${step.kind}-${index}`,
    changedCount: 1,
    instructionsBefore: step.before,
    instructionsAfter: step.after,
  }),
);


    return {
      success: true,
      originalIR: [originalIRText],
      optimizedIR: [optimizedIRText],
      originalIRText,
      optimizedIRText,
      stages,
      originalExecution,
      optimizedExecution,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    const failedExecution: ExecutionResult = {
      success: false,
      output: [],
      error: message,
    };

    return {
      success: false,
      originalIR: [],
      optimizedIR: [],
      originalIRText: "",
      optimizedIRText: "",
      stages: [],
      originalExecution: failedExecution,
      optimizedExecution: failedExecution,
      error: message,
    };
  }
}
