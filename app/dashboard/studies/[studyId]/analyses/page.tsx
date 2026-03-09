import Link from "next/link";
import { db } from "@/db";
import { analyses, analysisFiles, studyCollections, studies } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AnalysesTable } from "./AnalysesTable";

type PageProps = {
  params: Promise<{ studyId: string }>;
};

async function getStudyAndAnalyses(studyId: number) {
  const [study] = await db
    .select({
      studyName: studyCollections.studyName,
      collections: studyCollections.collections,
      updatedAt: studyCollections.updatedAt,
      piNames: studyCollections.piNames,
    })
    .from(studyCollections)
    .where(eq(studyCollections.studyId, studyId))
    .limit(1);

  if (!study) {
    const [fallback] = await db
      .select({ studyName: studies.studyName })
      .from(studies)
      .where(eq(studies.studyId, studyId))
      .limit(1);
    if (!fallback) return null;
    return {
      studyName: fallback.studyName,
      collections: null,
      updatedAt: null,
      piNames: null,
      analyses: await loadAnalysesWithFiles(studyId),
    };
  }

  return {
    studyName: study.studyName,
    collections: study.collections,
    updatedAt: study.updatedAt,
    piNames: study.piNames,
    analyses: await loadAnalysesWithFiles(studyId),
  };
}

async function loadAnalysesWithFiles(studyId: number) {
  const analysisRows = await db
    .select({
      analysisId: analyses.analysisId,
      analysisPmid: analyses.analysisPmid,
      analysisDesc: analyses.analysisDesc,
    })
    .from(analyses)
    .where(eq(analyses.studyId, studyId));

  const analysisIds = analysisRows.map((r) => r.analysisId);
  const firstFileByAnalysis = new Map<number, string>();
  if (analysisIds.length > 0) {
    const files = await db
      .select({
        analysisId: analysisFiles.analysisId,
        fileName: analysisFiles.fileName,
      })
      .from(analysisFiles)
      .where(inArray(analysisFiles.analysisId, analysisIds))
      .orderBy(analysisFiles.fileId);
    for (const f of files) {
      if (!firstFileByAnalysis.has(f.analysisId)) {
        firstFileByAnalysis.set(f.analysisId, f.fileName);
      }
    }
  }

  return analysisRows.map((r) => ({
    analysisId: r.analysisId,
    analysisPmid: r.analysisPmid,
    analysisDesc: r.analysisDesc,
    fileName: firstFileByAnalysis.get(r.analysisId) ?? null,
  }));
}

export default async function StudyAnalysesPage({ params }: PageProps) {
  const { studyId: studyIdParam } = await params;
  const studyId = Number(studyIdParam);
  if (!Number.isInteger(studyId) || studyId < 1) notFound();

  const data = await getStudyAndAnalyses(studyId);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/studies"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Studies
        </Link>
        <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p className="text-zinc-900 dark:text-zinc-50">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">Study Name:</span>{" "}
              {data.studyName ?? "—"}
            </p>
            <p className="text-zinc-900 dark:text-zinc-50">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">Collection:</span>{" "}
              {data.collections ?? "—"}
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-zinc-900 dark:text-zinc-50">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">Last Updated:</span>{" "}
              {data.updatedAt ?? "—"}
            </p>
            <p className="text-zinc-900 dark:text-zinc-50">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">Study PI:</span>{" "}
              {data.piNames ?? "—"}
            </p>
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Analysis PMID and description for this study.
        </p>
      </div>

      <AnalysesTable data={data.analyses} studyId={studyId} />
    </div>
  );
}
