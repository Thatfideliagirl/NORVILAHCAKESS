"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ImageRow = {
  table: string;
  id: string;
  idColumn: string;
  label: string;
  url: string;
  sizeBytes: number;
};

type Result = {
  label: string;
  beforeKb: number;
  afterKb: number;
  status: "done" | "failed";
};

const SOURCES: { table: string; idColumn: string; labelColumn: string; imageColumn: string }[] = [
  { table: "products", idColumn: "id", labelColumn: "name", imageColumn: "image_url" },
  { table: "categories", idColumn: "id", labelColumn: "name", imageColumn: "image_url" },
  { table: "product_options", idColumn: "id", labelColumn: "label", imageColumn: "image_url" },
  { table: "price_lists", idColumn: "id", labelColumn: "title", imageColumn: "image_url" },
  { table: "announcements", idColumn: "id", labelColumn: "title", imageColumn: "image_url" },
];

const SIZE_THRESHOLD_BYTES = 600_000;
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

function bucketAndPathFromUrl(url: string): { bucket: string; path: string } | null {
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: decodeURIComponent(match[2]) };
}

async function compressBlob(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const compressed = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  return compressed && compressed.size < blob.size ? compressed : blob;
}

export default function PhotoCleanup() {
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<ImageRow[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<Result[] | null>(null);

  async function scan() {
    setScanning(true);
    setScanError(null);
    setResults(null);
    const found: ImageRow[] = [];
    try {
      for (const source of SOURCES) {
        const { data, error } = await supabase
          .from(source.table)
          .select(`${source.idColumn}, ${source.labelColumn}, ${source.imageColumn}`);
        if (error) throw error;
        for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
          const url = row[source.imageColumn] as string | null;
          if (!url) continue;
          let sizeBytes = 0;
          try {
            const head = await fetch(url, { method: "HEAD" });
            sizeBytes = Number(head.headers.get("content-length") ?? 0);
          } catch {
            continue;
          }
          if (sizeBytes > SIZE_THRESHOLD_BYTES) {
            found.push({
              table: source.table,
              id: String(row[source.idColumn]),
              idColumn: source.idColumn,
              label: String(row[source.labelColumn] ?? "(untitled)"),
              url,
              sizeBytes,
            });
          }
        }
      }
      setItems(found);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : "Something went wrong scanning photos.");
    } finally {
      setScanning(false);
    }
  }

  async function compressAll() {
    if (!items || items.length === 0) return;
    setCompressing(true);
    setProgress({ done: 0, total: items.length });
    const newResults: Result[] = [];
    // A handful of rows (e.g. Mix & Match flavours) point at the exact same
    // stored photo -- compress each underlying file once, not once per row.
    const alreadyDone = new Map<string, number>();

    for (const item of items) {
      const parsed = bucketAndPathFromUrl(item.url);
      try {
        if (!parsed) throw new Error("Could not read storage path from URL.");
        if (alreadyDone.has(item.url)) {
          newResults.push({
            label: `${item.table}: ${item.label}`,
            beforeKb: Math.round(item.sizeBytes / 1024),
            afterKb: alreadyDone.get(item.url) as number,
            status: "done",
          });
          setProgress((p) => ({ ...p, done: p.done + 1 }));
          continue;
        }
        const res = await fetch(item.url);
        if (!res.ok) throw new Error(`Could not download photo (HTTP ${res.status}).`);
        const original = await res.blob();
        const compressed = await compressBlob(original);
        const { error: uploadError } = await supabase.storage
          .from(parsed.bucket)
          .upload(parsed.path, compressed, { upsert: true, contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const afterKb = Math.round(compressed.size / 1024);
        alreadyDone.set(item.url, afterKb);
        newResults.push({
          label: `${item.table}: ${item.label}`,
          beforeKb: Math.round(item.sizeBytes / 1024),
          afterKb,
          status: "done",
        });
      } catch {
        newResults.push({
          label: `${item.table}: ${item.label}`,
          beforeKb: Math.round(item.sizeBytes / 1024),
          afterKb: 0,
          status: "failed",
        });
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setResults(newResults);
    setCompressing(false);
    setItems(null);
  }

  return (
    <div className="mt-10 rounded-panel bg-cream p-6 shadow-warm">
      <p className="font-display text-product text-berry">Photo Cleanup</p>
      <p className="mt-2 font-body text-small text-ink/60">
        Finds product, category, flavour, price-list and broadcast photos larger than 600KB
        (the uncompressed originals that make the site feel slow) and shrinks them in place --
        nothing else changes, the same photo just loads much faster.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={scan}
          disabled={scanning || compressing}
          className="rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          {scanning ? "Scanning..." : "Scan for large photos"}
        </button>
        {compressing && (
          <p className="font-body text-small text-ink/60">
            Compressing {progress.done} of {progress.total}...
          </p>
        )}
      </div>

      {scanError && <p className="mt-3 font-body text-small text-berry">{scanError}</p>}

      {items && items.length === 0 && (
        <p className="mt-4 font-body text-small text-ink/60">
          Nothing over 600KB found -- all photos are already a reasonable size.
        </p>
      )}

      {items && items.length > 0 && (
        <div className="mt-4">
          <p className="font-body text-small font-medium text-ink">
            Found {items.length} large photo{items.length === 1 ? "" : "s"}:
          </p>
          <ul className="mt-2 flex flex-col gap-1 font-body text-small text-ink/70">
            {items.map((item) => (
              <li key={`${item.table}-${item.id}`}>
                {item.table}: {item.label} -- {(item.sizeBytes / 1024 / 1024).toFixed(1)}MB
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={compressAll}
            disabled={compressing}
            className="mt-4 rounded-pill bg-berry px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
          >
            {compressing ? "Compressing..." : `Compress all ${items.length}`}
          </button>
        </div>
      )}

      {results && (
        <div className="mt-4">
          <p className="font-body text-small font-medium text-ink">Done:</p>
          <ul className="mt-2 flex flex-col gap-1 font-body text-small text-ink/70">
            {results.map((r, i) => (
              <li key={i}>
                {r.status === "done"
                  ? `${r.label} -- ${(r.beforeKb / 1024).toFixed(1)}MB → ${r.afterKb}KB`
                  : `${r.label} -- failed, left as-is`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
