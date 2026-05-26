import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const r2Endpoint = process.env.R2_ENDPOINT;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;

const hasR2 = !!(r2Endpoint && r2AccessKeyId && r2SecretAccessKey && r2BucketName);

let s3Client: S3Client | null = null;
if (hasR2) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId!,
      secretAccessKey: r2SecretAccessKey!,
    },
  });
}

/**
 * Uploads a file to R2 or saves it locally if R2 is not configured.
 * @param key The destination path/filename (e.g. "exports/file.zip" or "invoices/inv_123.html")
 * @param body File content as Buffer or String
 * @param contentType HTTP content-type header
 * @returns A URI string (r2://<key> or local://<key>)
 */
export async function uploadFileToR2(
  key: string,
  body: Buffer | string,
  contentType: string
): Promise<string> {
  if (hasR2 && s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      await s3Client.send(command);
      console.log(`[Storage R2] Uploaded key: ${key}`);
      return `r2://${key}`;
    } catch (error) {
      console.error(`[Storage R2] Error uploading ${key}, falling back to local:`, error);
    }
  }

  // Local filesystem fallback
  try {
    const localPath = path.resolve(process.cwd(), "public", key);
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const writeData = typeof body === "string" ? body : Buffer.from(body);
    fs.writeFileSync(localPath, writeData);
    console.log(`[Storage Local] Saved key locally: ${key}`);
    return `local://${key}`;
  } catch (error) {
    console.error(`[Storage Local] Error saving local file ${key}:`, error);
    throw error;
  }
}

/**
 * Retrieves a file from R2 or the local filesystem.
 * @param key The file key (e.g. "exports/file.zip")
 * @returns Buffer containing file contents, or null if not found.
 */
export async function getFileFromR2(key: string): Promise<Buffer | null> {
  if (hasR2 && s3Client) {
    try {
      const command = new GetObjectCommand({
        Bucket: r2BucketName,
        Key: key,
      });
      const response = await s3Client.send(command);
      if (response.Body) {
        const bytes = await response.Body.transformToByteArray();
        return Buffer.from(bytes);
      }
    } catch (error) {
      console.error(`[Storage R2] Error reading key ${key}, checking local fallback:`, error);
    }
  }

  // Local filesystem fallback
  try {
    const localPath = path.resolve(process.cwd(), "public", key);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
  } catch (error) {
    console.error(`[Storage Local] Error reading local file ${key}:`, error);
  }
  
  return null;
}

/**
 * Deletes a file from R2 and the local filesystem.
 * @param key The file key
 * @returns Boolean representing if deletion succeeded
 */
export async function deleteFileFromR2(key: string): Promise<boolean> {
  let r2Deleted = false;
  if (hasR2 && s3Client) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: r2BucketName,
        Key: key,
      });
      await s3Client.send(command);
      console.log(`[Storage R2] Deleted key: ${key}`);
      r2Deleted = true;
    } catch (error) {
      console.error(`[Storage R2] Error deleting key ${key}:`, error);
    }
  }

  // Clean up local fallback if it exists
  let localDeleted = false;
  try {
    const localPath = path.resolve(process.cwd(), "public", key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      console.log(`[Storage Local] Deleted local file: ${key}`);
      localDeleted = true;
    }
  } catch (error) {
    console.error(`[Storage Local] Error deleting local file ${key}:`, error);
  }

  return r2Deleted || localDeleted;
}
