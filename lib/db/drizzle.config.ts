import { defineConfig } from "drizzle-kit";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config(); // loads .env from current directory
dotenv.config({ path: "./artifacts/api-server/.env" });
dotenv.config({ path: "../api-server/.env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
