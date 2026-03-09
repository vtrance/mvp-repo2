import { db } from "@/db";
import {
  studies,
  studyPis,
  studyBiobanks,
  analyses,
  analysisFiles,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function parseStudyId(param: unknown): number | null {
  if (param === undefined || param === null) return null;
  const id = Number(param);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ studyId: string }> }
) {
  const { studyId: studyIdParam } = await context.params;
  const studyId = parseStudyId(studyIdParam);
  if (studyId === null) {
    return NextResponse.json(
      { error: "Invalid or missing studyId" },
      { status: 400 }
    );
  }

  try {
    // better-sqlite3 requires a synchronous transaction callback (no async, no Promise)
    const result = db.transaction((tx) => {
      const analysisRows = tx
        .select({ analysisId: analyses.analysisId })
        .from(analyses)
        .where(eq(analyses.studyId, studyId))
        .all();
      const analysisIds = analysisRows
        .map((r) => r.analysisId)
        .filter((id): id is number => id != null);

      if (analysisIds.length > 0) {
        tx.delete(analysisFiles)
          .where(inArray(analysisFiles.analysisId, analysisIds))
          .run();
      }
      tx.delete(analyses).where(eq(analyses.studyId, studyId)).run();
      tx.delete(studyBiobanks).where(eq(studyBiobanks.studyId, studyId)).run();
      tx.delete(studyPis).where(eq(studyPis.studyId, studyId)).run();

      const deleted = tx
        .delete(studies)
        .where(eq(studies.studyId, studyId))
        .returning({ studyId: studies.studyId })
        .all();

      return deleted.length > 0;
    });

    if (!result) {
      return NextResponse.json(
        { error: "Study not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, studyId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
