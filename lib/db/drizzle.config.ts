import { defineConfig } from "drizzle-kit";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../../artifacts/api-server/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "artifacts/api-server/.env") });
dotenv.config({ path: "./artifacts/api-server/.env" });
dotenv.config({ path: "../api-server/.env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned. Process CWD: " + process.cwd());
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
