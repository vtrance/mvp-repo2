import { sqliteTable, sqliteView, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Example table – add your own tables here and run `npm run db:generate`
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Existing view in the database (read-only)
export const studyCollections = sqliteView("study_collections", {
  studyId: integer("study_id"),
  studyName: text("study_name"),
  updatedAt: text("updated_at"),
  collections: text("collections"),
  piNames: text("pi_names"),
}).existing();

export type StudyCollection = typeof studyCollections.$inferSelect;

export const studies = sqliteTable('studies', {
  studyId: integer('study_id').primaryKey(), // INTEGER PRIMARY KEY (auto rowid)
  studyName: text('study_name').notNull().unique(),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at'),
}, (t) => [
  index('idx_studies_name').on(t.studyName),
]);

export const people = sqliteTable('people', {
  personId: integer('person_id').primaryKey(),
  fullName: text('full_name').notNull().unique(),
}, (t) => [
  index('idx_people_name').on(t.fullName),
]);

export const studyPis = sqliteTable('study_pis', {
  studyId: integer('study_id')
    .notNull()
    .references(() => studies.studyId, { onDelete: 'cascade' }),
  personId: integer('person_id')
    .notNull()
    .references(() => people.personId, { onDelete: 'cascade' }),
  role: text('role').default('PI'),
}, (t) => [
  primaryKey({ name: 'pk_study_pis', columns: [t.studyId, t.personId] }),
]);

export const biobanks = sqliteTable('biobanks', {
  biobankId: integer('biobank_id').primaryKey(),
  biobankName: text('biobank_name').notNull().unique(),
}, (t) => [
  index('idx_biobanks_name').on(t.biobankName),
]);

export const studyBiobanks = sqliteTable('study_biobanks', {
  studyId: integer('study_id')
    .notNull()
    .references(() => studies.studyId, { onDelete: 'cascade' }),
  biobankId: integer('biobank_id')
    .notNull()
    .references(() => biobanks.biobankId, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ name: 'pk_study_biobanks', columns: [t.studyId, t.biobankId] }),
]);

export const analyses = sqliteTable('analyses', {
  analysisId: integer('analysis_id').primaryKey(),
  studyId: integer('study_id').notNull()
    .references(() => studies.studyId, { onDelete: 'cascade' }),
  analysisPmid: text('analysis_pmid'),   // keep as TEXT
  analysisUrl: text('analysis_url'),
  analysisDesc: text('analysis_desc'),
  createdAt: text('created_at').default(sql`datetime('now')`),
}, (t) => [
  index('idx_analyses_study').on(t.studyId),
  index('idx_analyses_pmid').on(t.analysisPmid),
  uniqueIndex('uniq_study_pmid').on(t.studyId, t.analysisPmid),
]);

export const analysisFiles = sqliteTable('analysis_files', {
  fileId: integer('file_id').primaryKey(),
  analysisId: integer('analysis_id').notNull()
    .references(() => analyses.analysisId, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  createdAt: text('created_at').default(sql`datetime('now')`),
}, (t) => [
  index('idx_files_analysis').on(t.analysisId),
  uniqueIndex('uniq_analysis_file').on(t.analysisId, t.fileName),
]);
