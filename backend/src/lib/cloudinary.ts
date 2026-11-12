import { v2 as cloudinary } from "cloudinary";
import { configured, env } from "./env.js";
import { HttpError } from "./http.js";

export function getCloudinary() {
  if (!configured.cloudinary) throw new HttpError(503, "Image uploads are not configured yet. Add CLOUDINARY_* variables to backend/.env");
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
  return cloudinary;
}

/** Signature for a direct browser → Cloudinary upload. The secret never leaves the server. */
export function signUpload(folder: string) {
  const c = getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const fullFolder = `ah-clothing-hub/${folder}`;
  const signature = c.utils.api_sign_request({ timestamp, folder: fullFolder }, env.CLOUDINARY_API_SECRET!);
  return { signature, timestamp, folder: fullFolder, apiKey: env.CLOUDINARY_API_KEY!, cloudName: env.CLOUDINARY_CLOUD_NAME! };
}

export async function destroyImage(publicId: string) {
  if (!publicId || !configured.cloudinary) return;
  await getCloudinary().uploader.destroy(publicId).catch(() => {});
}
