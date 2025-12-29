import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let cachedClient;

function getR2Env() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null);
  const publicBase =
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
    process.env.MEDIA_BASE_URL ||
    null;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "Missing R2 env vars. Required: R2_ACCOUNT_ID (or R2_ENDPOINT), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET"
    );
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket, publicBase };
}

export function getR2Client() {
  if (cachedClient) return cachedClient;
  const { endpoint, accessKeyId, secretAccessKey } = getR2Env();
  cachedClient = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

export function buildMediaUrl(key) {
  if (!key) return null;
  const { publicBase } = getR2Env();
  if (!publicBase) return null;
  const cleanBase = publicBase.replace(/\/+$/, "");
  const cleanKey = String(key).replace(/^\/+/, "");
  return `${cleanBase}/${cleanKey}`;
}

export async function putR2Object({ key, body, contentType, cacheControl }) {
  if (!key) throw new Error("Missing key for R2 upload");
  const { bucket } = getR2Env();
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType || "application/octet-stream",
    CacheControl: cacheControl,
  });
  await client.send(command);
}
