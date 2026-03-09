import { db } from "@/db";
import { studyCollections } from "@/db/schema";
import { StudiesTable, type StudyCollectionRow } from "./StudiesTable";

async function getStudyCollections(): Promise<StudyCollectionRow[]> {
  const rows = await db.select().from(studyCollections);
  return rows;
}

export default async function StudiesPage() {
  const data = await getStudyCollections();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Studies
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Study collections with pagination, sort, and filter.
        </p>
      </div>
      <StudiesTable data={data} />
    </div>
  );
}
