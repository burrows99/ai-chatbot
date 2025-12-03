import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { PutBlobResult, put as vercelPutType } from "@vercel/blob";

// Use Vercel's put function type to ensure exact signature compatibility
type VercelPutFunction = typeof vercelPutType;

const useVercel = process.env.USE_VERCEL_BLOB === "true";
const BUCKET = process.env.S3_BUCKET ?? "uploads";

// Local MinIO setup
const s3 = new S3Client({
  region: String(process.env.S3_REGION),
  endpoint: String(process.env.S3_ENDPOINT), // S3-compatible endpoint
  forcePathStyle: true,
  credentials: {
    accessKeyId: String(process.env.S3_ACCESS_KEY_ID),
    secretAccessKey: String(process.env.S3_SECRET_ACCESS_KEY),
  },
});

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    try {
      await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    } catch {
      // If creation fails because it already exists or due to race, ignore.
    }
  }
}

async function toBuffer(
  body: Parameters<VercelPutFunction>[1]
): Promise<Buffer> {
  if (Buffer.isBuffer(body)) {
    return body as Buffer;
  }
  if (typeof body === "string") {
    return Buffer.from(body);
  }
  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }
  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer());
  }
  if (typeof File !== "undefined" && body instanceof File) {
    return Buffer.from(await body.arrayBuffer());
  }
  throw new TypeError("Unsupported body type for put");
}

const localPut: VercelPutFunction = async (pathname, body, options) => {
  await ensureBucket();
  const buffer = await toBuffer(body);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: pathname,
      Body: buffer,
      ContentType: options?.contentType ?? "application/octet-stream",
      ACL: options?.access === "public" ? "public-read" : undefined,
    })
  );

  const contentType = options?.contentType ?? "application/octet-stream";

  // Generate a presigned URL to avoid AccessDenied when bucket policy is not public
  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: pathname }),
    { expiresIn: 60 * 60 }
  );

  const result: PutBlobResult = {
    url: signedUrl,
    pathname,
    contentType,
    downloadUrl: signedUrl,
    contentDisposition: "inline",
  };

  return result;
};

// Env-driven export
export const put: VercelPutFunction = useVercel
  ? async (pathname, body, options) => {
      const { put: vercelPut } = await import("@vercel/blob");
      return vercelPut(pathname, body, options);
    }
  : localPut;
