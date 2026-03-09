import { db } from "@/db";
import {
  studies,
  people,
  studyPis,
  biobanks,
  studyBiobanks,
  analyses,
  analysisFiles,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type AnalysisInput = {
  AnalysisPMID?: string | null;
  AnalysisURL?: string | null;
  AnalysisDescription?: string | null;
  AnalysisFiles?: string[];
};

type CreateStudyBody = {
  StudyName: string;
  StudyPI?: string[];
  StudyBiobank?: string[];
  Analyses?: AnalysisInput[];
};

function parseBody(body: unknown): CreateStudyBody {
  if (body && typeof body === "object" && "StudyName" in body) {
    const b = body as Record<string, unknown>;
    return {
      StudyName: String(b.StudyName ?? ""),
      StudyPI: Array.isArray(b.StudyPI)
        ? (b.StudyPI as string[]).map(String)
        : [],
      StudyBiobank: Array.isArray(b.StudyBiobank)
        ? (b.StudyBiobank as string[]).map(String)
        : [],
      Analyses: Array.isArray(b.Analyses)
        ? (b.Analyses as AnalysisInput[]).map((a) => ({
            AnalysisPMID: a?.AnalysisPMID != null ? String(a.AnalysisPMID) : null,
            AnalysisURL: a?.AnalysisURL != null ? String(a.AnalysisURL) : null,
            AnalysisDescription:
              a?.AnalysisDescription != null
                ? String(a.AnalysisDescription)
                : null,
            AnalysisFiles: Array.isArray(a?.AnalysisFiles)
              ? (a.AnalysisFiles as string[]).map(String)
              : [],
          }))
        : [],
    };
  }
  throw new Error("Invalid body: missing StudyName");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    const raw = await request.text();
    if (!raw.trim()) {
      return NextResponse.json(
        { error: "Body is empty" },
        { status: 400 }
      );
    }
    body = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  let payload: CreateStudyBody;
  try {
    payload = parseBody(body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!payload.StudyName.trim()) {
    return NextResponse.json(
      { error: "StudyName is required" },
      { status: 400 }
    );
  }

  try {
    // better-sqlite3 requires a synchronous transaction callback (no async, no Promise)
    const result = db.transaction((tx) => {
      const studyRows = tx
        .insert(studies)
        .values({
          studyName: payload.StudyName.trim(),
        })
        .returning({ studyId: studies.studyId })
        .all();
      const study = studyRows[0];
      if (!study) throw new Error("Failed to insert study");
      const studyId = study.studyId;

      for (const fullName of payload.StudyPI ?? []) {
        const name = fullName.trim();
        if (!name) continue;
        let person = tx
          .select({ personId: people.personId })
          .from(people)
          .where(eq(people.fullName, name))
          .limit(1)
          .all()[0];
        if (!person) {
          const insertedRows = tx
            .insert(people)
            .values({ fullName: name })
            .returning({ personId: people.personId })
            .all();
          const inserted = insertedRows[0];
          if (!inserted) throw new Error(`Failed to insert person: ${name}`);
          person = { personId: inserted.personId };
        }
        tx.insert(studyPis)
          .values({
            studyId,
            personId: person.personId,
            role: "PI",
          })
          .run();
      }

      for (const biobankName of payload.StudyBiobank ?? []) {
        const name = biobankName.trim();
        if (!name) continue;
        let biobank = tx
          .select({ biobankId: biobanks.biobankId })
          .from(biobanks)
          .where(eq(biobanks.biobankName, name))
          .limit(1)
          .all()[0];
        if (!biobank) {
          const insertedRows = tx
            .insert(biobanks)
            .values({ biobankName: name })
            .returning({ biobankId: biobanks.biobankId })
            .all();
          const inserted = insertedRows[0];
          if (!inserted) throw new Error(`Failed to insert biobank: ${name}`);
          biobank = { biobankId: inserted.biobankId };
        }
        tx.insert(studyBiobanks)
          .values({
            studyId,
            biobankId: biobank.biobankId,
          })
          .run();
      }

      for (const a of payload.Analyses ?? []) {
        const analysisRows = tx
          .insert(analyses)
          .values({
            studyId,
            analysisPmid: a.AnalysisPMID ?? null,
            analysisUrl: a.AnalysisURL ?? null,
            analysisDesc: a.AnalysisDescription ?? null,
          })
          .returning({ analysisId: analyses.analysisId })
          .all();
        const analysis = analysisRows[0];
        if (!analysis) throw new Error("Failed to insert analysis");
        const analysisId = analysis.analysisId;

        for (const fileName of a.AnalysisFiles ?? []) {
          const name = fileName.trim();
          if (!name) continue;
          tx.insert(analysisFiles)
            .values({
              analysisId,
              fileName: name,
            })
            .run();
        }
      }

      return { studyId };
    });

    return NextResponse.json({
      ok: true,
      studyId: result.studyId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Insert failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
