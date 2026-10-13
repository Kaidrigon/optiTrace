import { NextResponse } from "next/server";
import { compileSource } from "../../../../../compiler/src/index";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("source" in body) ||
      typeof body.source !== "string"
    ) {
      return NextResponse.json(
        { error: "Request must include source code as a string." },
        { status: 400 }
      );
    }

    const source = body.source;

    if (source.length > 20000) {
      return NextResponse.json(
        { error: "Source code must be 20,000 characters or fewer." },
        { status: 413 }
      );
    }

    const rawOptions =
      "options" in body &&
      typeof body.options === "object" &&
      body.options !== null
        ? body.options
        : {};

    const options = {
      constantPropagation:
        "constantPropagation" in rawOptions &&
        typeof rawOptions.constantPropagation === "boolean"
          ? rawOptions.constantPropagation
          : true,
      constantFolding:
        "constantFolding" in rawOptions &&
        typeof rawOptions.constantFolding === "boolean"
          ? rawOptions.constantFolding
          : true,
      deadCodeElimination:
        "deadCodeElimination" in rawOptions &&
        typeof rawOptions.deadCodeElimination === "boolean"
          ? rawOptions.deadCodeElimination
          : true,
    };

    const result = compileSource(source, options);

    return NextResponse.json({
      success: result.success,
      error: result.error ?? null,
      originalIRText: result.originalIRText,
      optimizedIRText: result.optimizedIRText,
      originalExecution: result.originalExecution,
      optimizedExecution: result.optimizedExecution,
      stages: result.stages.map((stage) => ({
        name: stage.name,
        changedCount: stage.changedCount,
        before: stage.instructionsBefore,
        after: stage.instructionsAfter,
      })),
      totalChangedCount: result.stages.reduce(
        (total, stage) => total + stage.changedCount,
        0
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Please send valid JSON." },
      { status: 400 }
    );
  }
}