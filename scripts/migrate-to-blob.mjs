// Simple Supabase → Vercel Blob copier (no DB writes)
// Env (use .env.migrate):
// SUPABASE_URL=https://<project>.supabase.co
// SUPABASE_SERVICE_ROLE=... (or SUPABASE_SERVICE_ROLE_KEY)
// BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
// SUPABASE_BUCKETS=bucket1,bucket2
// MIGRATE_DRY_RUN=true
// MIGRATE_CONCURRENCY=5

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { put } from "@vercel/blob";
import pLimit from "p-limit";

// Load .env.migrate from project root
dotenv.config({ path: new URL("../.env.migrate", import.meta.url).pathname });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BUCKETS = (process.env.SUPABASE_BUCKETS || "images")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DRY = String(process.env.MIGRATE_DRY_RUN).toLowerCase() !== "false";
const CONC = Number(process.env.MIGRATE_CONCURRENCY || 5);

if (!SUPABASE_URL) throw new Error("Set SUPABASE_URL");
if (!SUPABASE_KEY)
  throw new Error("Set SUPABASE_SERVICE_ROLE (or SUPABASE_SERVICE_ROLE_KEY)");
if (!BLOB_TOKEN) throw new Error("Set BLOB_READ_WRITE_TOKEN");

console.log("[copy] Buckets:", BUCKETS.join(","), "DRY:", DRY, "CONC:", CONC);

const supa = createClient(SUPABASE_URL, SUPABASE_KEY);
const limit = pLimit(CONC);

async function listAllFiles(bucket, prefix = "") {
  const out = [];
  // Supabase Storage list API paginates per folder; we recurse through folders
  let page = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supa.storage.from(bucket).list(prefix, {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    const entries = data || [];
    if (entries.length === 0) break;

    for (const e of entries) {
      if (e.metadata && e.metadata.name === "..") continue; // safety
      if (e.id && e.name === "..") continue; // safety
      if (e.name && e.name.endsWith("/")) continue; // folders sometimes end with /

      if (
        e &&
        e.metadata === null &&
        e.created_at === null &&
        e.updated_at === null &&
        e.name
      ) {
        // Some SDK versions mark folders with null meta; detect by trying a deeper list
        const sub = prefix ? `${prefix}/${e.name}` : e.name;
        const { data: probe } = await supa.storage
          .from(bucket)
          .list(sub, { limit: 1 });
        if (Array.isArray(probe)) {
          // It's a folder
          out.push(...(await listAllFiles(bucket, sub)));
          continue;
        }
      }

      if (e.type === "folder") {
        const sub = prefix ? `${prefix}/${e.name}` : e.name;
        out.push(...(await listAllFiles(bucket, sub)));
      } else {
        const path = prefix ? `${prefix}/${e.name}` : e.name;
        out.push(path);
      }
    }

    if (entries.length < PAGE_SIZE) break;
    page++;
  }
  return out;
}

async function copyFile(bucket, path) {
  // Get a signed URL to download
  const { data, error } = await supa.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 10);
  if (error) throw error;

  const res = await fetch(data.signedUrl);
  if (!res.ok) throw new Error(`GET ${bucket}/${path} -> ${res.status}`);
  const contentType = res.headers.get("content-type") || undefined;
  const buf = await res.arrayBuffer();

  const blobKey = `${bucket}/${path}`; // mirror original structure in Blob
  if (DRY) {
    console.log("[dry] would copy", `${bucket}/${path}`, "→", blobKey);
    return { ok: true, url: `DRY://${blobKey}` };
  }

  const { url } = await put(blobKey, new Blob([buf]), {
    access: "public",
    token: BLOB_TOKEN,
    contentType,
  });
  console.log("[ok] copied", `${bucket}/${path}`);
  return { ok: true, url };
}

async function run() {
  for (const bucket of BUCKETS) {
    console.log(`\n== Bucket: ${bucket} ==`);
    const files = await listAllFiles(bucket, "");
    console.log(`[scan] ${files.length} objects`);

    let done = 0;
    await Promise.all(
      files.map((p) =>
        limit(async () => {
          try {
            await copyFile(bucket, p);
            done++;
            if (done % 50 === 0) console.log(`[prog] ${done}/${files.length}`);
          } catch (e) {
            console.error("[err]", bucket, p, e.message);
          }
        })
      )
    );
    console.log(`[bucket ${bucket}] finished ${done}/${files.length}`);
  }
  console.log("\nAll done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
