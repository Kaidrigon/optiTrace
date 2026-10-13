
/**
 * Public library entry point for OTL.
 *
 * Import this file when using OTL from another application.
 * Unlike index.ts, this file does not start the CLI.
 */

export { compileSource } from "./compiler.js";

export type { CompilerResult } from "./compiler.js";

export { optimize, optimizeWithReport } from "./optimizer.js";

export type { OptimizationOptions } from "./optimizer.js";
