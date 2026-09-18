// src/lib/storage-upload.ts
//
// Shared Supabase Storage upload helpers for admin image fields.
//
// Every upload goes through browser-side compression first (WebP, ~100KB
// target) so user uploads don't eat the Supabase free-tier storage quota.
// GIFs are preserved as-is (compression would kill animation).

import { getBrowserClient } from "@/lib/client";
import { compressImage } from "@/app/admin/editor/utils/image-compressor";

export interface CompressedUploadOptions {
  bucket?: string;
  /** Storage folder, e.g. "public/settings". */
  dir?: string;
  /** Filename prefix, e.g. "settings" or "hrms-banner". */
  prefix?: string;
  maxWidth?: number;
  quality?: number;
  /** Size budget in MB (default ~0.1). Higher = better quality, bigger file. */
  maxSizeMB?: number;
}

export interface CompressedUploadResult {
  publicUrl: string;
  /** Final uploaded bytes (post-compression). */
  size: number;
}

function randomSuffix(): string {
  return Math.random().toString(36).substring(7);
}

/**
 * Compress (non-GIF) + upload a file, returning its public URL and size.
 * Throws on upload failure.
 */
export async function uploadCompressedImage(
  file: File,
  opts: CompressedUploadOptions = {}
): Promise<CompressedUploadResult> {
  const {
    bucket = "post-images",
    dir = "public/settings",
    prefix = "settings",
    maxWidth = 1200,
    quality = 0.8,
    maxSizeMB = 0.1,
  } = opts;

  const processedFile =
    file.type === "image/gif"
      ? file
      : await compressImage(file, { maxWidth, quality, maxSizeMB });

  const fileExt =
    processedFile.type === "image/gif"
      ? "gif"
      : processedFile.type === "image/png"
        ? "png"
        : "webp";
  const fileName = `${prefix}-${Date.now()}-${randomSuffix()}.${fileExt}`;
  const filePath = `${dir}/${fileName}`;

  const supabase = getBrowserClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, processedFile, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return { publicUrl, size: processedFile.size };
}

/**
 * Best-effort delete of a previously uploaded storage object, given its
 * public URL. Silently no-ops for local paths, external URLs, or failures —
 * callers must never break the save flow because cleanup failed.
 */
export async function deleteStorageObjectByUrl(
  url: string,
  bucket = "post-images"
): Promise<void> {
  try {
    if (!url) return;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return; // local file or external URL — not ours
    const path = url.substring(idx + marker.length).split("?")[0];
    if (!path) return;
    const supabase = getBrowserClient();
    await supabase.storage.from(bucket).remove([path]);
  } catch {
    // Intentionally ignored: cleanup must never fail the user action.
  }
}
