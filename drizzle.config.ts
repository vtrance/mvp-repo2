//import path from "path";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "/data/local.db",
    //url: process.env.DATABASE_URL ?? path.join(process.cwd(), "data", "local.db"),
  },
});
