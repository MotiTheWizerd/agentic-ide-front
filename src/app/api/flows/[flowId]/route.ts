import { NextRequest, NextResponse } from "next/server";
import { readFile, rm } from "fs/promises";
import path from "path";

const FLOWS_DIR = path.join(process.cwd(), "users", "test", "flows");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;
    const data = await readFile(
      path.join(FLOWS_DIR, flowId, "flow.json"),
      "utf-8"
    );
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;
    await rm(path.join(FLOWS_DIR, flowId), { recursive: true, force: true });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete flow" },
      { status: 500 }
    );
  }
}
