import Link from "next/link";
import { db } from "@/db";
import { studyCollections } from "@/db/schema";
import { StudiesTable, type StudyCollectionRow } from "./StudiesTable";

export const dynamic = "force-dynamic";

async function getStudyCollections(): Promise<StudyCollectionRow[]> {
  const rows = await db.select().from(studyCollections);
  return rows;
}

export default async function StudiesPage() {
  const data = await getStudyCollections();

  return (
    <div className="space-y-6 pl-4">
      <div className="elgg-head">
        {/*<h2 className="inline-block h-[26px] pb-[0.4em] font-['Arial'] text-[28px] font-bold leading-[0.9em] text-[#555] tracking-normal">*/}
        <h2 className="h2">
          VA MVP Research Biobank - Search/Browse Studies
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

      <div className="pt-4">
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Study collections with pagination, sort, and filter.
        </p>
      </div>
      <StudiesTable data={data} />
    </div>
  );
}
