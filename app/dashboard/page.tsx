import Link from "next/link";
import { db } from "@/db";
import { biobanks, studyBiobanks } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getBiobankStudyCounts() {
  const rows = await db
    .select({
      biobankName: biobanks.biobankName,
      studyCount: count(studyBiobanks.studyId),
    })
    .from(biobanks)
    .leftJoin(studyBiobanks, eq(biobanks.biobankId, studyBiobanks.biobankId))
    .groupBy(biobanks.biobankId, biobanks.biobankName);
  return rows;
}

export default async function DashboardPage() {
  const studyCountData = await getBiobankStudyCounts();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        VA Research Biobank
      </h1>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome!
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Biobanks and number of studies per biobank.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studyCountData.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              No biobanks found.
            </p>
          ) : (
            studyCountData.map((row) => (
              <article
                key={row.biobankName}
                className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow dark:border-zinc-700 dark:bg-zinc-900"
              >
                <h3 className="text-lg text-center font-semibold text-zinc-900 dark:text-zinc-50">
                  {row.biobankName}
                </h3>
                <p className="mt-2 text-2xl text-center font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                  {row.studyCount}
                  <span className="ml-1 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                    {row.studyCount === 1 ? "study" : "studies"}
                  </span>
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <p className="text-zinc-600 dark:text-zinc-400">
        <Link
          href="/dashboard/studies"
          className="font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-50"
        >
          Search/Browse Studies →
        </Link>
      </p>
    </div>
  );
}
