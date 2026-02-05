import { NextResponse } from "next/server";
import { getAvailableProviders, DEFAULT_PROVIDER } from "@/lib/providers";

export async function GET() {
  return NextResponse.json({
    providers: getAvailableProviders(),
    defaultProvider: DEFAULT_PROVIDER,
  });
}
