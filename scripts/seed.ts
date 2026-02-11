// Seed script — loads supabase/seed.sql into the database
// Usage: npm run db:seed

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  const seedPath = path.join(__dirname, "..", "supabase", "seed.sql");
  const sql = readFileSync(seedPath, "utf-8");

  console.log("Loading seed data...");

  const { error } = await supabase.rpc("exec_sql", { sql_text: sql });

  if (error) {
    // If RPC doesn't exist, fall back to running individual statements
    console.log(
      "Note: exec_sql RPC not available. For full seed, run the SQL directly:"
    );
    console.log(`  psql $DATABASE_URL < ${seedPath}`);
    console.log(
      "\nAlternatively, paste the seed SQL into Supabase SQL Editor."
    );
    process.exit(1);
  }

  console.log("Seed data loaded successfully.");

  // Verify counts
  const { count: programCount } = await supabase
    .from("programs")
    .select("*", { count: "exact", head: true });
  const { count: areaCount } = await supabase
    .from("attendance_areas")
    .select("*", { count: "exact", head: true });

  console.log(`  Programs: ${programCount}`);
  console.log(`  Attendance areas: ${areaCount}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
