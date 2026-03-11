import Link from "next/link";
import { db } from "@/db";
import { analyses, analysisFiles, studyCollections, studies } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AnalysesTable } from "./AnalysesTable";

export const dynamic = "force-dynamic";

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
    <div className="space-y-6 pl-4">
      
      <div className="elgg-head">
        {/*<h2 className="inline-block h-[26px] pb-[0.4em] font-['Arial'] text-[28px] font-bold leading-[0.9em] text-[#555] tracking-normal">*/}
        <h2 className="h2">
            VA MVP Research Biobank - View Study
        </h2>
      </div>

      <div id="elgg-nav-list">
            <div className="navbar">
                <h3 className="h3">
                  <Link href="/dashboard" className="navbar-link">Overview</Link> | 
                  <Link href="/dashboard/studies" className="navbar-link"> Search/Browse Studies</Link> 
                </h3>
            </div>
      </div>

      <div>
        <Link
          href="/dashboard/studies"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back
        </Link>
      </div>
      
        <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p>
              {/*<span className="font-medium text-zinc-600 dark:text-zinc-400">Study Name:</span>{" "}*/}
              <span className="elgg-field-label">Study Name:</span>{" "}
              <span className="elgg-field-value">
                {data.studyName ?? "—"}
              </span>
            </p>
            <p>
              {/*<span className="font-medium text-zinc-600 dark:text-zinc-400">Collection:</span>{" "}*/}
              <span className="elgg-field-label">Collection:</span>{" "}
              <span className="elgg-field-value">
                {data.collections ?? "—"}
              </span>
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="elgg-field-label">Last Updated:</span>{" "}
              <span className="elgg-field-value">
                {data.updatedAt ?? "—"}
              </span>
            </p>
            <p>
              <span className="elgg-field-label">Study PI:</span>{" "}
              <span className="elgg-field-value">
                {data.piNames ?? "—"}
              </span>
            </p>
          </div>
        </div>
        {/*<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Analysis PMID and description for this study.
        </p>*/}
        
      
          
      <AnalysesTable data={data.analyses} studyId={studyId} />
      
    </div>
  );
}
