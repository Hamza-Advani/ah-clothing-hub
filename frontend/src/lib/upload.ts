"use client";
import { api, isApiConfigured } from "./api";

/** Resize + re-encode an image in the browser before uploading (saves bandwidth on mobile). */
export async function compressImage(file: File, maxSize = 1800, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
  return blob && blob.size < file.size ? blob : file;
}

type Signature = { signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string; allowedFormats?: string };

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Signed upload to Cloudinary. The backend creates the signature (secret stays on server),
 * the browser uploads directly to Cloudinary with progress events.
 */
export async function uploadImage(file: File, folder: "products" | "categories" | "banners" | "branding" | "payments", onProgress?: (pct: number) => void): Promise<{ url: string; publicId: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded.");
  if (file.size > MAX_BYTES) throw new Error("Image is larger than 15 MB.");
  const blob = await compressImage(file);
  if (!isApiConfigured) {
    // demo mode: keep a local preview URL so the UI flow works without keys
    onProgress?.(100);
    return { url: URL.createObjectURL(blob), publicId: "" };
  }
  const sig = await api.post<Signature>("/api/uploads/sign", { folder });
  const form = new FormData();
  form.append("file", blob, file.name.replace(/\.\w+$/, ".webp"));
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  if (sig.allowedFormats) form.append("allowed_formats", sig.allowedFormats);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve({ url: data.secure_url, publicId: data.public_id });
        else reject(new Error(data?.error?.message ?? "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}
