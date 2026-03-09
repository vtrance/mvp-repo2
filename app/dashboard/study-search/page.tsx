import { db } from "@/db";
import { studyCollections, analyses } from "@/db/schema";
import { StudiesTable, type StudyCollectionRow } from "../studies/StudiesTable";
import { like, or, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getSearchResults(
  q: string | undefined
): Promise<StudyCollectionRow[]> {
  const term = typeof q === "string" ? q.trim() : "";
  if (!term) {
    const rows = await db.select().from(studyCollections);
    return rows;
  }

  const pattern = `%${term}%`;

  const studyIdsFromAnalyses = await db
    .selectDistinct({ studyId: analyses.studyId })
    .from(analyses)
    .where(
      or(
        like(analyses.analysisPmid, pattern),
        like(analyses.analysisDesc, pattern)
      )!
    );

  const rowsFromView = await db
    .select()
    .from(studyCollections)
    .where(
      or(
        like(studyCollections.studyName, pattern),
        like(studyCollections.updatedAt, pattern),
        like(studyCollections.collections, pattern),
        like(studyCollections.piNames, pattern)
      )!
    );

  const idsFromAnalyses = studyIdsFromAnalyses
    .map((r) => r.studyId)
    .filter((id): id is number => id != null);
  const idsFromView = rowsFromView
    .map((r) => r.studyId)
    .filter((id): id is number => id != null);
  const allIds = [...new Set([...idsFromAnalyses, ...idsFromView])];

  if (allIds.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(studyCollections)
    .where(inArray(studyCollections.studyId, allIds));

  return rows;
}

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function StudySearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const data = await getSearchResults(q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Study search
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Search study collections and analyses (PMID, description). Results support sort and column filters.
        </p>
      </div>

      <form
        method="get"
        action="/dashboard/study-search"
        className="flex flex-wrap items-center gap-3"
      >
        <label htmlFor="study-search-q" className="sr-only">
          Search
        </label>
        <input
          id="study-search-q"
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search studies, collections, PIs, PMID, description..."
          className="h-10 min-w-[280px] rounded-md border border-zinc-300 bg-white px-3 text-sm shadow-sm placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:placeholder:text-zinc-400"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Search
        </button>
      </form>

      <StudiesTable data={data} />
    </div>
  );
}
