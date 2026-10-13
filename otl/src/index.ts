
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { compileSource } from "./compiler.js";

function main(): void {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Usage: npx tsx src/index.ts <file.otl>");
    process.exitCode = 1;
    return;
  }

  if (!filePath.endsWith(".otl")) {
    console.error("OTL source files must use the .otl extension.");
    process.exitCode = 1;
    return;
  }

  try {
    const source = readFileSync(resolve(filePath), "utf8");
    const result = compileSource(source);

    console.log("\n=== OTL OPTIMIZATION REPORT ===");

    if (result.optimizationSteps.length === 0) {
      console.log("No optimizations were needed.");
    }

    for (const [index, step] of result.optimizationSteps.entries()) {
      console.log(`\n${index + 1}. ${step.kind}`);
      console.log(`   ${step.message}`);
      console.log(`   Before: ${step.before}`);
      console.log(`   After:  ${step.after}`);
      console.log(`   Line:   ${step.line}, column ${step.column}`);
    }

    console.log("\n=== OTL PROGRAM OUTPUT ===");

    if (result.output.length === 0) {
      console.log("(No output)");
    } else {
      console.log(result.output.join("\n"));
    }
  } catch (error) {
    console.error("\n=== OTL ERROR ===");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

main();
