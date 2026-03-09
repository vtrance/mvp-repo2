import { db } from "@/db";
import { studyCollections } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await db.select().from(studyCollections);
  return NextResponse.json(rows);
}
