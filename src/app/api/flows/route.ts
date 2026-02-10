import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FLOWS_DIR = path.join(process.cwd(), "users", "test", "flows");

export async function GET() {
  try {
    await mkdir(FLOWS_DIR, { recursive: true });
    const entries = await readdir(FLOWS_DIR, { withFileTypes: true });
    const flows = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const data = await readFile(
            path.join(FLOWS_DIR, entry.name, "flow.json"),
            "utf-8"
          );
          const flow = JSON.parse(data);
          flows.push({
            id: flow.id,
            name: flow.name,
            updatedAt: flow.updatedAt,
          });
        } catch {
          // skip broken entries
        }
      }
    }

    return NextResponse.json({ flows });
  } catch {
    return NextResponse.json(
      { error: "Failed to list flows" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const flowData = await request.json();
    const flowDir = path.join(FLOWS_DIR, flowData.id);
    await mkdir(flowDir, { recursive: true });
    await writeFile(
      path.join(flowDir, "flow.json"),
      JSON.stringify(flowData, null, 2)
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save flow" },
      { status: 500 }
    );
  }
}
