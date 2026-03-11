import Link from "next/link";
import { db } from "@/db";
import { analyses, analysisFiles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ studyId: string; analysisId: string }>;
};

async function getAnalysis(studyId: number, analysisId: number) {
  const [analysis] = await db
    .select({
      analysisPmid: analyses.analysisPmid,
      analysisDesc: analyses.analysisDesc,
    })
    .from(analyses)
    .where(
      and(
        eq(analyses.studyId, studyId),
        eq(analyses.analysisId, analysisId)
      )
    )
    .limit(1);

  if (!analysis) return null;

  const files = await db
    .select({
      fileId: analysisFiles.fileId,
      fileName: analysisFiles.fileName,
    })
    .from(analysisFiles)
    .where(eq(analysisFiles.analysisId, analysisId))
    .orderBy(analysisFiles.fileId);

  return { ...analysis, files };
}

export default async function AnalysisPage({ params }: PageProps) {
  const { studyId: studyIdParam, analysisId: analysisIdParam } = await params;
  const studyId = Number(studyIdParam);
  const analysisId = Number(analysisIdParam);

  if (
    !Number.isInteger(studyId) ||
    studyId < 1 ||
    !Number.isInteger(analysisId) ||
    analysisId < 1
  ) {
    notFound();
  }

  const data = await getAnalysis(studyId, analysisId);
  if (!data) notFound();

  return (
    <div className="space-y-6 pl-4">
      <div className="elgg-head">
         <h2 className="h2">
          VA MVP Research Biobank - View Analysis
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
          href={`/dashboard/studies/${studyId}/analyses`}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back
        </Link>
        {/*<h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Analysis
        </h1>*/}
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="space-y-1 text-sm">
          <p className="text-zinc-900 dark:text-zinc-50">
            <span className="font-medium text-zinc-600 dark:text-zinc-400">
              PMID:
            </span>{" "}
            {data.analysisPmid ?? "—"}
          </p>
          <p className="text-zinc-900 dark:text-zinc-50">
            <span className="font-medium text-zinc-600 dark:text-zinc-400">
              Description:
            </span>{" "}
            {data.analysisDesc ?? "—"}
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Files
          </h2>
          {data.files.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No files for this analysis.
            </p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {data.files.map((file) => (
                <li key={file.fileId}>
                  <a
                    href={file.fileName}
                    className="font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-50"
                  >
                    {file.fileName}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
