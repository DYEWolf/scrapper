import { NextResponse } from "next/server";
import { getProperties } from "@/lib/scraper";

export async function GET() {
  const properties = getProperties();
  return NextResponse.json(properties);
}
