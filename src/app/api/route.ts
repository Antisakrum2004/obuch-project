import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "Journey OS API",
    version: "1.0.0",
    description: "Employee Journey Platform API",
  });
}
